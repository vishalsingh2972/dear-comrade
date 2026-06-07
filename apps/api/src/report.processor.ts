import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { MedicalReportSchema } from './report.schema';

@Processor('report-queue')
export class ReportProcessor extends WorkerHost {
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing!");
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`✅ Worker received job: ${job.id}`);
    
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0curl -X POST http://localhost:3000/webhook/test-ai-flash" });

      const prompt = `
        Analyze this medical report. 
        Extract data following this JSON schema: ${JSON.stringify(MedicalReportSchema)}
        Return ONLY valid JSON.
      `;

      const result = await model.generateContent(prompt);
      console.log("🤖 AI Analysis Result:", result.response.text());
      return { success: true };
    } catch (error) {
      console.error("❌ AI Processing Error:", error);
      throw error;
    }
  }
}