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
import { Resend } from 'resend';

@Processor('report-queue')
export class ReportProcessor extends WorkerHost {
  private genAI: GoogleGenerativeAI;
  private twilioClient: Twilio;
  private prisma: PrismaClient;
  private resend: Resend;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super();
    const connectionString = this.configService.get<string>('DATABASE_URL');
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter });

    this.resend = new Resend(this.configService.get('RESEND_API_KEY'));
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
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Analyze this lab report. 
      1. Provide a warm summary in Telugu for the elderly patient.
      2. Provide a short, clinical summary in English for the child.
      3. Determine if critical (YES/NO).
      Format exactly like this:
      [CRITICAL:YES/NO]
      [TELUGU]: Summary here...
      [ENGLISH]: Summary here...`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
      ]);
      const fullResponse = result.response.text();

      const FORCE_CRITICAL_TEST = true;
      const isCritical = FORCE_CRITICAL_TEST ? true : fullResponse.includes('[CRITICAL:YES]');
      const teluguSummary = fullResponse.split('[TELUGU]:')[1]?.split('[ENGLISH]:')[0]?.trim() || "";
      const englishSummary = fullResponse.split('[ENGLISH]:')[1]?.trim() || "";

      await this.prisma.report.create({
        data: { sender, summary: teluguSummary, isCritical }
      });

      const sarvamResponse = await firstValueFrom(
        this.httpService.post(
          'https://api.sarvam.ai/text-to-speech',
          { text: teluguSummary, target_language_code: "te-IN", model: "bulbul:v3", speaker: "shubh" },
          { headers: { 'api-subscription-key': this.configService.get('SARVAM_API_KEY'), 'Content-Type': 'application/json' } }
        )
      );

      const audioBuffer = Buffer.from(sarvamResponse.data.audios[0], 'base64');
      const uploadResult: any = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: "video", format: "mp3" },
          (error, result) => error ? reject(error) : resolve(result)
        ).end(audioBuffer);
      });

      if (isCritical) {
        // 1. Notify NRI Child when critical
        await this.twilioClient.messages.create({
          body: `⚠️ URGENT: The medical report for ${sender} is CRITICAL. Summary: ${englishSummary}`,
          from: this.configService.get('TWILIO_PHONE_NUMBER')!,
          to: this.configService.get('NRI_CHILD_PHONE_NUMBER')!
        });

        // 2. Email Doctor when critical (Just Text-based summary for now later will send pdf of dashboard)
        try {
          const emailResponse = await this.resend.emails.send({
            from: 'onboarding@resend.dev',
            to: this.configService.get('DOCTOR_EMAIL')!,
            subject: `🚨 URGENT: Critical Lab Report for ${sender}`,
            html: `<h2>Urgent Medical Alert</h2>
                   <p>A new critical lab report has been detected for <strong>${sender}</strong>.</p>
                   <p><strong>Clinical Summary:</strong> ${englishSummary}</p>`
          });
          console.log("Urgent Email Alert sent successfully:", emailResponse.data?.id);
        } catch (emailError) {
          console.error("❌ Failed to send doctor email:", emailError);
        }

        // 3. Notify Parent
        await this.twilioClient.messages.create({
          body: "మీ వైద్య నివేదిక సిద్ధంగా ఉంది. దయచేసి డాక్టరును సంప్రదించండి.",
          from: this.configService.get('TWILIO_PHONE_NUMBER')!,
          to: sender,
          mediaUrl: [uploadResult.secure_url]
        });
      } else {
        await this.twilioClient.messages.create({
          body: "మీ వైద్య నివేదిక సిద్ధంగా ఉంది.",
          from: this.configService.get('TWILIO_PHONE_NUMBER')!,
          to: sender,
          mediaUrl: [uploadResult.secure_url]
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error("❌ ERROR:", error.message);
      throw error;
    }
  }
}