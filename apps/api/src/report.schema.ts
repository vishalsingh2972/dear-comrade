import { z } from 'zod';

export const MedicalReportSchema = z.object({
  patient_name: z.string().optional(),
  metrics: z.array(z.object({
    name: z.string(),
    value: z.number(),
    unit: z.string(),
    status: z.enum(['normal', 'high', 'low', 'critical']),
  })),
  summary: z.string(),
  is_urgent: z.boolean(),
});