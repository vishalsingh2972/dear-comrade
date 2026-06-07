import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MedicalReportSchema } from './report.schema';

@Processor('report-queue')
export class ReportProcessor extends WorkerHost {
  private genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  // async process(job: Job<any, any, string>): Promise<any> {
  //   const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  //   // 1. In a real scenario, job.data.url contains the image from WhatsApp
  //   // 2. We send the image + prompt to Gemini
  //   const result = await model.generateContent([
  //     "Extract medical metrics from this report. Return JSON matching this schema:",
  //     JSON.stringify(MedicalReportSchema.safeParse({}).data) // Simplification
  //   ]);

  //   console.log("AI Analysis:", result.response.text());
  //   return { success: true };
  // }

  //for testing
  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`✅ Worker received job: ${job.id}`);

    // For testing, we are just telling the AI to extract data from a mock report
    // We will pass the image data here in Day 4
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Note: Use gemini-1.5-flash if 2.5 isn't active

    const prompt = "Analyze this mock medical report and return the metrics in JSON format: Patient has Glucose of 110 mg/dL, Status: Normal.";

    const result = await model.generateContent(prompt);
    const response = await result.response;

    console.log("🤖 AI Analysis Result:", response.text());
    return { success: true };
  }
}