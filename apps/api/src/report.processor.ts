import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Processor('report-queue')
export class ReportProcessor extends WorkerHost {
  private genAI: GoogleGenerativeAI;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super();
    // Initialize Gemini SDK using ConfigService to ensure env vars are loaded
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in the environment configuration.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`🚀 DEBUG: Started processing job: ${job.id}`);

    try {
      // 1. Analyze with Gemini
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      console.log("🛠️ DEBUG: Gemini initialized with gemini-2.5-flash");

      const result = await model.generateContent("Analyze this: Glucose 110 mg/dL, Normal. Return a short summary in Hindi.");
      const summary = result.response.text();
      console.log("🤖 AI Analysis Result:", summary);

      // 2. Convert to Speech using Sarvam AI
      console.log("🎤 DEBUG: Sending text to Sarvam AI...");

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

      // 3. Extract the audio
      const audioBase64 = sarvamResponse.data.audios[0];
      console.log("✅ SUCCESS: Audio generated, length:", audioBase64.length);

      return {
        success: true,
        summary,
        audio: audioBase64
      };

    } catch (error: any) {
      console.error("❌ DEBUG ERROR:", error.response?.data || error.message);
      throw error;
    }
  }
}