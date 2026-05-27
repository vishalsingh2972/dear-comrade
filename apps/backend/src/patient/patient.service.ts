import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PatientService {
  constructor(private readonly prisma: PrismaService) { }

  async getPatientHistory(phoneNumber: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { phoneNumber },
      include: {
        labReports: {
          orderBy: { uploadedAt: 'desc' },
          include: { biomarkers: true },
        },
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    const reportsWithAlerts = patient.labReports.map(report => ({
      ...report,
      requiresAttention: report.biomarkers.some(b => b.isOutOfRange),
      anomalies: report.biomarkers.filter(b => b.isOutOfRange).map(b => b.name),
    }));

    return { ...patient, labReports: reportsWithAlerts };
  }
}