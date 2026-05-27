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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing from environment variables!");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`[Processor] [Job ${job.id}] STARTED! Data:`, JSON.stringify(job.data));
    // Read the exact sticky note data fields sent from your controller yesterday
    const { imageUrl, phoneNumber } = job.data;

    console.log(`[Processor] [Job ${job.id}] Pulled from queue. Target Parent: ${phoneNumber}`);
    console.log(`[Processor] Target Image URL: ${imageUrl}`);

    try {
      // 1. Fetch the binary image asset down into our local process buffer
      console.log(`[Processor] Downloading image asset...`);
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          // This tricks the server into thinking a real browser is making the request
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
      const contentTypeHeader = imageResponse.headers['content-type'];
      const mimeType = typeof contentTypeHeader === 'string' ? contentTypeHeader : 'image/jpeg';

      // 2. Build out the precise engineering prompt instructions
      const promptInstructions = `
        You are an expert clinical systems engine. Analyze the provided medical laboratory report image asset.
        1. Extract the patient and lab details if legibly displayed.
        2. Walk through every single row item in the results section, parsing the biomarker name, value, unit, and baseline reference ranges.
        3. Compare the 'value' against the 'referenceRange'. If the value sits completely outside those standard boundaries, mark 'isOutOfRange' as true.
        4. Synthesize a professional, direct engineering summary outlining any critical abnormalities found.
      `;

      // 3. Fire the request directly to the Gemini Multimodal model
      console.log(`[Processor] Sending image and schema blueprint to Gemini...`);
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          promptInstructions,
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: LabReportAnalysisSchema,
        },
      });

      // 4. Extract and log the fully type-safe structured text result
      const structuredResultText = response.text;
      if (!structuredResultText) {
        throw new Error('Gemini pipeline execution returned empty text block payload.');
      }

      const validatedData = JSON.parse(structuredResultText);
      console.log('[Processor] AI Analysis pipeline completely successful!');
      console.dir(validatedData, { depth: null });

      // 3. PERSISTENCE LAYER: Debugging the AI Output
      console.log(`[Processor] Saving analysis to database for ${phoneNumber}...`);
      console.log('[Processor] Debug: Received AI output:', JSON.stringify(validatedData, null, 2));

      // Check if biomarkers exist before proceeding
      if (!validatedData || !validatedData.biomarkers) {
        console.warn('[Processor] Skipping database save: No biomarkers found in AI output.');
        return { success: false, reason: 'No biomarkers detected in image' };
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
          criticalAnomaliesSummary: validatedData.summary ?? 'No summary',
          biomarkers: {
            create: validatedData.biomarkers.map((b: any) => ({
              name: b.name ?? 'Unknown',
              value: String(b.value ?? '0'),
              unit: b.unit ?? '',
              isOutOfRange: !!b.isOutOfRange,
              referenceRange: b.referenceRange ?? '',
            })),
          },
        },
      });

      console.log(`[Processor] Success! LabReport created with ID: ${labReport.id}`);
      return { success: true, labReportId: labReport.id };

    } catch (error) {
      console.error(`[Processor Failure] Critical exception thrown during background processing run:`, error);
      throw error;
    }
  }
}