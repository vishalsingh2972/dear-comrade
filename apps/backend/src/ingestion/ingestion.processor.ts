import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { LabReportAnalysisSchema } from './lab-report.schema';
import { PrismaService } from '../prisma.service';

@Processor('LAB_REPORT_QUEUE')
export class IngestionProcessor extends WorkerHost {
  private readonly ai: GoogleGenAI;

  constructor(private readonly prisma: PrismaService) {
    super();
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { imageUrl, phoneNumber } = job.data;

    try {
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          "Extract medical lab report data. Follow the JSON schema provided.",
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
        ],
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: LabReportAnalysisSchema,
        },
      });

      const validatedData = JSON.parse(response.text!);

      // Proceed if we have data to save
      if (!validatedData || !validatedData.biomarkers) {
        throw new Error('AI analysis failed to extract valid biomarkers.');
      }

      const patient = await this.prisma.patient.upsert({
        where: { phoneNumber },
        update: {},
        create: { phoneNumber },
      });

      const labReport = await this.prisma.labReport.create({
        data: {
          patientId: patient.id,
          labName: validatedData.labName ?? 'Unknown Lab',
          criticalAnomaliesSummary: validatedData.summary ?? '',
          biomarkers: {
            create: validatedData.biomarkers.map((b: any) => ({
              name: b.name ?? 'Unknown',
              value: parseFloat(b.value) || 0, // Ensure numeric for Float columns
              unit: b.unit ?? '',
              isOutOfRange: !!b.isOutOfRange,
              referenceRange: b.referenceRange ?? '',
            })),
          },
        },
      });

      return { success: true, labReportId: labReport.id };
    } catch (error) {
      console.error(`[Processor Failure] Job ${job.id}:`, error);
      throw error;
    }
  }
}