import { Controller, Get, Param } from '@nestjs/common';
import { PatientService } from './patient.service';

@Controller('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get(':phoneNumber')
  async getHistory(@Param('phoneNumber') phoneNumber: string) {
    return await this.patientService.getPatientHistory(phoneNumber);
  }
}