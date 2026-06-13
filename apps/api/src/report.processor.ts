import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { firstValueFrom } from 'rxjs';
import { v2 as cloudinary } from 'cloudinary';
import { Twilio } from 'twilio';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Resend } from 'resend';

@Processor('report-queue')
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);
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
    this.logger.log(`👁️ Processing report ${job.id} for: ${job.data.sender}`);

    try {
      const imageBase64 = await this.getBase64FromUrl(job.data.imageUrl);
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

      const isCritical = fullResponse.includes('[CRITICAL:YES]');
      const teluguSummary = fullResponse.split('[TELUGU]:')[1]?.split('[ENGLISH]:')[0]?.trim() || "Report processed.";
      const englishSummary = fullResponse.split('[ENGLISH]:')[1]?.trim() || "Report processed.";

      // DATABASE FIX: Now saving English summary to the dashboard
      await this.prisma.report.create({
        data: { 
            sender: job.data.sender, 
            summary: englishSummary, 
            isCritical 
        }
      });

      const sarvamResponse = await firstValueFrom(
        this.httpService.post(
          'https://api.sarvam.ai/text-to-speech',
          {
            text: teluguSummary,
            target_language_code: "te-IN",
            model: "bulbul:v3",
            speaker: "shubh",
            max_duration_seconds: 30
          },
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
        await this.twilioClient.messages.create({
          body: `⚠️ URGENT: The medical report for ${job.data.sender} is CRITICAL. Summary: ${englishSummary}`,
          from: this.configService.get('TWILIO_PHONE_NUMBER')!,
          to: this.configService.get('NRI_CHILD_PHONE_NUMBER')!
        });

        try {
          await this.resend.emails.send({
            from: 'onboarding@resend.dev',
            to: this.configService.get('DOCTOR_EMAIL')!,
            subject: `🚨 URGENT: Critical Lab Report for ${job.data.sender}`,
            html: `<p>Critical lab report for <strong>${job.data.sender}</strong>.</p><p>${englishSummary}</p>`
          });
        } catch (emailError) {
          this.logger.error("Failed to send doctor email", emailError);
        }
      }

      await this.twilioClient.messages.create({
        body: isCritical ? "మీ వైద్య నివేదిక సిద్ధంగా ఉంది. దయచేసి డాక్టరును సంప్రదించండి." : "మీ వైద్య నివేదిక సిద్ధంగా ఉంది.",
        from: this.configService.get('TWILIO_PHONE_NUMBER')!,
        to: job.data.sender,
        mediaUrl: [uploadResult.secure_url]
      });

      this.logger.log(`✅ Pipeline completed for job ${job.id}`);
      return { success: true };
    } catch (error: any) {
      this.logger.error(`❌ Pipeline failed for job ${job.id}: ${error.message}`);
      throw error;
    }
  }
}