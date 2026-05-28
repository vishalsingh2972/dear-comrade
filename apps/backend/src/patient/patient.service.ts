import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { HttpService } from '@nestjs/axios';
import { SarvamService } from './sarvam.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
    private readonly sarvam: SarvamService
  ) { }

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

    if (!patient) throw new Error('Patient not found');

    const reportsWithAlerts = patient.labReports.map(report => ({
      ...report,
      requiresAttention: report.biomarkers.some(b => b.isOutOfRange),
      anomalies: report.biomarkers.filter(b => b.isOutOfRange).map(b => b.name),
    }));

    return { ...patient, labReports: reportsWithAlerts };
  }

  async getReportById(reportId: string) {
    const report = await this.prisma.labReport.findUnique({
      where: { id: reportId },
      include: { biomarkers: true },
    });

    if (!report) throw new Error('Report not found');
    return report;
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

  async notifyPatientAndChild(phoneNumber: string, reportId: string, summary: string) {
    try {
      // 1. Notify NRI Child
      const dashboardUrl = `${process.env.FRONTEND_URL}/report/${reportId}`;
      const nriMessage = `Dear Comrade: New report analyzed. Summary: ${summary}. View here: ${dashboardUrl}`;
      await this.sendInfobipMessage(process.env.NRI_PHONE_NUMBER!, nriMessage);
      this.logger.log(`NRI notification sent for report ${reportId}`);

      // 2. Notify Parent with Audio
      // We point to our own internal controller route that serves the generated audio
      const audioUrl = `${process.env.BACKEND_URL}/patient/audio/${reportId}`;
      await this.sendInfobipMedia(phoneNumber, audioUrl);
      this.logger.log(`Parent audio notification sent for report ${reportId}`);
    } catch (error) {
      this.logger.error('Failed to notify parties:', error);
    }
  }

  private async sendInfobipMessage(to: string, text: string) {
    const url = `${process.env.INFOBIP_BASE_URL}/whatsapp/1/message/text`;
    return firstValueFrom(this.http.post(url, {
      from: process.env.INFOBIP_WHATSAPP_NUMBER,
      to,
      content: { text }
    }, { headers: { Authorization: `App ${process.env.INFOBIP_API_KEY}` } }));
  }

  private async sendInfobipMedia(to: string, mediaUrl: string) {
    const url = `${process.env.INFOBIP_BASE_URL}/whatsapp/1/message/audio`;
    return firstValueFrom(this.http.post(url, {
      from: process.env.INFOBIP_WHATSAPP_NUMBER,
      to,
      content: { mediaUrl }
    }, { headers: { Authorization: `App ${process.env.INFOBIP_API_KEY}` } }));
  }
}