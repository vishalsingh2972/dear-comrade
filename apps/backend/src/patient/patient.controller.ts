import { Controller, Get, Param } from '@nestjs/common';
import { PatientService } from './patient.service';
import { InsightService } from './insight.service';

@Controller('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService,
    private readonly insightService: InsightService,
  ) { }

  @Get(':phoneNumber')
  async getHistory(@Param('phoneNumber') phoneNumber: string) {
    return await this.patientService.getPatientHistory(phoneNumber);
  }

  @Get(':phoneNumber/latest-status')
  async getLatestStatus(@Param('phoneNumber') phoneNumber: string) {
    const data = await this.patientService.getPatientHistory(phoneNumber);
    const latest = data.labReports[0]; 
    const summary = await this.insightService.getFriendlySummary(latest?.anomalies || []);

    await this.patientService.notifyPatientIfCritical(phoneNumber, !latest?.requiresAttention, summary);

    return {
      patientName: data.name,
      latestReportDate: latest?.uploadedAt,
      isHealthy: !latest?.requiresAttention,
      criticalAnomalies: latest?.anomalies,
      summary: summary,
    };
  }
}