import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { LabReportAnalysisSchema } from './lab-report.schema';

@Processor('LAB_REPORT_QUEUE')
export class IngestionProcessor extends WorkerHost {
  private readonly ai: GoogleGenAI;

  constructor() {
    super();
    // Initializes the client. It automatically picks up GEMINI_API_KEY from your .env
    this.ai = new GoogleGenAI({});
  }

  async process(job: Job<any, any, string>): Promise<any> {
    // Read the exact sticky note data fields sent from your controller yesterday
    const imageUrl = job.data.imageUrl;
    const phoneNumber = job.data.phoneNumber;

    console.log(`[Processor] [Job ${job.id}] Pulled from queue. Target Parent: ${phoneNumber}`);
    console.log(`[Processor] Target Image URL: ${imageUrl}`);

    try {
      // 1. Fetch the binary image asset down into our local process buffer
      console.log(`[Processor] Downloading image asset from secure webhook transfer...`);
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
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

      // TODO: Day 3 - Persist validatedData directly to your PostgreSQL database
      return validatedData;

    } catch (error) {
      console.error(`[Processor Failure] Critical exception thrown during background processing run:`, error);
      throw error;
    }
  }
}