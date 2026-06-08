import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { v2 as cloudinary } from 'cloudinary';
import { Twilio } from 'twilio';

@Processor('report-queue')
export class ReportProcessor extends WorkerHost {
  private genAI: GoogleGenerativeAI;
  private twilioClient: Twilio;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.genAI = new GoogleGenerativeAI(this.configService.get<string>('GEMINI_API_KEY') || '');
    this.twilioClient = new Twilio(
      this.configService.get<string>('TWILIO_ACCOUNT_SID')!,
      this.configService.get<string>('TWILIO_AUTH_TOKEN')!
    );
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`🚀 DEBUG: Processing job: ${job.id}`);

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent("Glucose 110 mg/dL, Normal. Return short summary in Hindi.");
      const summary = result.response.text();

      const sarvamResponse = await firstValueFrom(
        this.httpService.post(
          'https://api.sarvam.ai/text-to-speech',
          { text: summary, target_language_code: "hi-IN", model: "bulbul:v3", speaker: "shubh" },
          { headers: { 'api-subscription-key': this.configService.get('SARVAM_API_KEY'), 'Content-Type': 'application/json' } }
        )
      );

      // Upload buffer directly to Cloudinary (No local file created)
      const audioBuffer = Buffer.from(sarvamResponse.data.audios[0], 'base64');
      const uploadResult: any = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: "video", format: "mp3" },
          (error, result) => error ? reject(error) : resolve(result)
        ).end(audioBuffer);
      });

      await this.twilioClient.messages.create({
        body: "आपकी मेडिकल रिपोर्ट तैयार है।",
        from: this.configService.get('TWILIO_PHONE_NUMBER')!,
        to: 'whatsapp:+916303366896',
        mediaUrl: [uploadResult.secure_url]
      });

      console.log(`✅ SUCCESS: Message sent with URL: ${uploadResult.secure_url}`);
      return { success: true };
    } catch (error: any) {
      console.error("❌ ERROR:", error.message);
      throw error;
    }
  }
}