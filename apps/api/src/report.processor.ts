import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';
import twilio = require('twilio');

@Processor('report-queue')
export class ReportProcessor extends WorkerHost {
  private genAI: GoogleGenerativeAI;
  private twilioClient: twilio.Twilio;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super();

    // Load credentials
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    // We initialize the client even if the key is potentially invalid
    // to allow the application to boot. Errors will trigger in 'process'
    this.genAI = new GoogleGenerativeAI(apiKey || '');

    this.twilioClient = twilio(
      this.configService.get('TWILIO_ACCOUNT_SID'),
      this.configService.get('TWILIO_AUTH_TOKEN')
    );
  }

  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`🚀 DEBUG: Processing job: ${job.id}`);

    try {
      // 1. Analyze with Gemini - 2.5-flash is stable and supported
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent("Analyze this: Glucose 110 mg/dL, Normal. Return a short summary in Hindi.");
      const summary = result.response.text();

      // 2. Sarvam Speech Synthesis
      const sarvamResponse = await firstValueFrom(
        this.httpService.post(
          'https://api.sarvam.ai/text-to-speech',
          {
            text: summary,
            target_language_code: "hi-IN",
            model: "bulbul:v3",
            speaker: "shubh",
          },
          {
            headers: {
              'api-subscription-key': this.configService.get('SARVAM_API_KEY'),
              'Content-Type': 'application/json'
            }
          }
        )
      );

      // 3. File System Persistence
      const audioBase64 = sarvamResponse.data.audios[0];
      const fileName = `report-${job.id}.mp3`;
      const audioDir = path.join(process.cwd(), 'public', 'audio');

      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }

      const filePath = path.join(audioDir, fileName);
      fs.writeFileSync(filePath, Buffer.from(audioBase64, 'base64'));

      // 4. Twilio Dispatch
      const publicUrl = `${this.configService.get('PUBLIC_URL')}/audio/${fileName}`;
      const fromNumber = this.configService.get('TWILIO_PHONE_NUMBER');
      const toNumber = 'whatsapp:+916303366896';

      console.log(`💬 Sending WhatsApp from ${fromNumber} to ${toNumber}...`);

      await this.twilioClient.messages.create({
        body: `आपकी मेडिकल रिपोर्ट का सारांश: ${summary}`,
        from: fromNumber,
        to: toNumber,
        mediaUrl: [publicUrl]
      });

      console.log(`✅ SUCCESS: Message sent.`);
      return { success: true, summary, audioUrl: publicUrl };

    } catch (error: any) {
      console.error("❌ ERROR DETAILED:", error.message);
      throw error;
    }
  }
}