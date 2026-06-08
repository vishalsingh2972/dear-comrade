import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { v2 as cloudinary } from 'cloudinary';
import { Twilio } from 'twilio';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Processor('report-queue')
export class ReportProcessor extends WorkerHost {
  private genAI: GoogleGenerativeAI;
  private twilioClient: Twilio;
  private prisma: PrismaClient;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super();

    // 3. Initialize the connection pool using your DATABASE_URL
    const connectionString = this.configService.get<string>('DATABASE_URL');
    const pool = new Pool({ connectionString });

    // 4. Create the adapter
    const adapter = new PrismaPg(pool);

    // 5. Initialize Prisma with the adapter
    this.prisma = new PrismaClient({ adapter });

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

  private async getBase64FromUrl(url: string): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.get(url, {
        responseType: 'arraybuffer',
        // Add authentication here
        auth: {
          username: this.configService.get<string>('TWILIO_ACCOUNT_SID')!,
          password: this.configService.get<string>('TWILIO_AUTH_TOKEN')!,
        },
      })
    );
    return Buffer.from(response.data).toString('base64');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { imageUrl, sender } = job.data;
    console.log(`👁️ Vision Processing: ${imageUrl}`);

    try {
      const imageBase64 = await this.getBase64FromUrl(imageUrl);
      // Using 2.5-flash for stable vision analysis
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = "Analyze this medical lab report. Provide a short, warm summary in Hindi for an elderly patient. Focus on whether the result is normal or abnormal.";

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
      ]);
      const summary = result.response.text();

      // --- DATABASE SAVING ---
      const isCritical = summary.toLowerCase().includes('danger') || summary.toLowerCase().includes('high');

      await this.prisma.report.create({
        data: {
          sender: sender,
          summary: summary,
          isCritical: isCritical
        }
      });
      console.log('✅ Report saved to Supabase');

      // --- SPEECH SYNTHESIS (SARVAM) ---
      const sarvamResponse = await firstValueFrom(
        this.httpService.post(
          'https://api.sarvam.ai/text-to-speech',
          { text: summary, target_language_code: "hi-IN", model: "bulbul:v3", speaker: "shubh" }, //hi-IN
          { headers: { 'api-subscription-key': this.configService.get('SARVAM_API_KEY'), 'Content-Type': 'application/json' } }
        )
      );

      // --- CLOUDINARY & TWILIO ---
      const audioBuffer = Buffer.from(sarvamResponse.data.audios[0], 'base64');
      const uploadResult: any = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: "video", format: "mp3" },
          (error, result) => error ? reject(error) : resolve(result)
        ).end(audioBuffer);
      });

      await this.twilioClient.messages.create({
        body: "आपकी मेडिकल रिपोर्ट का विश्लेषण तैयार है।",
        from: this.configService.get('TWILIO_PHONE_NUMBER')!,
        to: sender,
        mediaUrl: [uploadResult.secure_url]
      });

      return { success: true };
    } catch (error: any) {
      console.error("❌ ERROR:", error.message);
      throw error;
    }
  }
}