import { Controller, Get, Param, Query } from '@nestjs/common';
import { PatientService } from './patient.service';
import { InsightService } from './insight.service';
import { SarvamService } from './sarvam.service';

@Controller('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService,
    private readonly insightService: InsightService,
    private readonly sarvamService: SarvamService,
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

  @Get(':phoneNumber/report/:reportId/audio')
  async getAudioReport(
    @Param('phoneNumber') phoneNumber: string,
    @Param('reportId') reportId: string,
    @Query('lang') lang: string = 'hi-IN',
  ) {
    const report = await this.patientService.getReportById(reportId);

    // Debugging: Log what we are sending to Sarvam
    console.log("Generating audio for summary:", report.criticalAnomaliesSummary);

    const audioUrl = await this.sarvamService.convertTextToSpeech(
      report.criticalAnomaliesSummary,
      lang
    );

    console.log("Sarvam returned URL:", audioUrl);

    return { audioUrl };
  }
}