import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { PatientService } from './patient.service';
import { InsightService } from './insight.service';
import { SarvamService } from './sarvam.service';
import { Response } from 'express';

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
  async getLatestStatus(@Param('phoneNumber') phoneNumber: string, @Query('lang') lang: string = 'hi-IN') {
    const data = await this.patientService.getPatientHistory(phoneNumber);
    const latest = data.labReports[0];
    const summary = await this.insightService.getFriendlySummary(latest?.anomalies || [], lang);

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
    @Query('lang') lang: string = 'hi-IN', // This comes from your frontend
    @Res() res: Response,
  ) {
    const report = await this.patientService.getReportById(reportId);
    const anomalies = report.biomarkers.filter(b => b.isOutOfRange).map(b => b.name);

    // Pass 'lang' here so the LLM knows which language to write in
    const summary = await this.insightService.getFriendlySummary(anomalies, lang);

    await this.sarvamService.streamTextToSpeech(summary, res, lang);
  }

  @Get('debug/voices')
  async getVoices() {
    const response = await fetch('https://api.sarvam.ai/speech-synthesis-voices', {
      headers: { 'api-subscription-key': process.env.SARVAM_API_KEY }
    });
    return await response.json();
  }

  @Get('audio/:reportId')
  async getAudioForInfobip(
    @Param('reportId') reportId: string,
    @Query('lang') lang: string = 'hi-IN',
    @Res() res: Response,
  ) {
    const report = await this.patientService.getReportById(reportId);
    const anomalies = report.biomarkers.filter(b => b.isOutOfRange).map(b => b.name);

    // Generate the summary for the audio file
    const summary = await this.insightService.getFriendlySummary(anomalies, lang);

    // Stream it back to Infobip
    await this.sarvamService.streamTextToSpeech(summary, res, lang);
  }
}