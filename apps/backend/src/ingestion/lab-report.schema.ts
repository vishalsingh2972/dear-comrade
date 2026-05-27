import { z } from 'zod';

// Define the shape of a single clinical biomarker entry
export const BiomarkerRecordSchema = z.object({
  name: z.string().describe('The standard clinical name of the test or biomarker, e.g., Hemoglobin, Serum Creatinine, HbA1c'),
  value: z.number().describe('The precise numerical value extracted from the patient report result column'),
  unit: z.string().describe('The unit of measurement specified on the report sheet, e.g., g/dL, mg/dL, %'),
  isOutOfRange: z.boolean().describe('True if the extracted value sits outside the standard reference high/low boundaries printed on the document'),
  referenceRange: z.string().describe('The standard comparison reference text printed on the sheet, e.g., 13.5 - 17.5'),
});

// Define the complete structured sheet we expect back from Gemini
export const LabReportAnalysisSchema = z.object({
  patientName: z.string().optional().describe('The extracted full name of the patient if legibly visible on the paper asset'),
  labName: z.string().optional().describe('The hospital or diagnostic laboratory brand name heading'),
  biomarkers: z.array(BiomarkerRecordSchema).describe('The collection list of all lab test records found on the report sheet'),
  criticalAnomaliesSummary: z.string().describe('A brief, highly professional engineering synthesis of any biomarkers tagged as dangerously out of range'),
});

export type LabReportAnalysis = z.infer<typeof LabReportAnalysisSchema>;