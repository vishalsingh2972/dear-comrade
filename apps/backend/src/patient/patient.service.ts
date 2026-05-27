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

  async notifyPatientIfCritical(phoneNumber: string, isHealthy: boolean, summary: string) {
    if (!isHealthy) {
      console.log(`--- [NOTIFICATION SENT] ---`);
      console.log(`To: ${phoneNumber}`);
      console.log(`Message: Dear Comrade, ${summary}`);
      console.log(`---------------------------`);

      // In a real scenario, this is where you call:
      // await this.httpService.post('https://api.infobip.com/...', { ... }).toPromise();
    }
  }

  async getReportById(reportId: string) {
    const report = await this.prisma.labReport.findUnique({
      where: { id: reportId },
      include: { biomarkers: true },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    return {
      ...report,
      requiresAttention: report.biomarkers.some(b => b.isOutOfRange),
      criticalAnomaliesSummary: report.criticalAnomaliesSummary,
    };
  }
}