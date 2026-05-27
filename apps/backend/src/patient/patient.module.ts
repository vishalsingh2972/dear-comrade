import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PatientController],
  providers: [PatientService, PrismaService],
})
export class PatientModule {}