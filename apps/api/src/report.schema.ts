import { z } from 'zod';

export const MedicalReportSchema = z.object({
  patient_name: z.string().optional(),
  metrics: z.array(z.object({
    name: z.string(), // e.g., "HbA1c"
    value: z.number(),
    unit: z.string(),
    status: z.enum(['normal', 'high', 'low', 'critical']),
  })),
  summary: z.string(), // A warm, friendly explanation
  is_urgent: z.boolean(),
});