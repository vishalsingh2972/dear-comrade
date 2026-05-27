import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PatientService {
  constructor(private readonly prisma: PrismaService) {}

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

    return patient;
  }
}