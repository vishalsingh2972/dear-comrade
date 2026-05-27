process.env.GEMINI_API_KEY = "ADD_KEY_HERE";
process.env.DATABASE_URL = "ADD_CONNECTION_STRING_HERE";
// npx ts-node -r dotenv/config -r tsconfig-paths/register apps/backend/src/scripts/test-db.ts dotenv_config_path=apps/backend/.env

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module'; 
import { PrismaService } from '../prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  console.log('--- Starting Second Manual Database Test ---');

  const phoneNumber = "918888888888"; 
  const mockData = {
    labName: "Global Diagnostic Center",
    summary: "Patient shows signs of iron deficiency.",
    biomarkers: [
      { name: "Iron", value: "35.0", unit: "mcg/dL", isOutOfRange: true, referenceRange: "60-170" },
      { name: "Ferritin", value: "15.0", unit: "ng/mL", isOutOfRange: true, referenceRange: "20-200" }
    ]
  };

  try {
    const patient = await prisma.patient.upsert({
      where: { phoneNumber },
      update: {},
      create: { phoneNumber },
    });

    const labReport = await prisma.labReport.create({
      data: {
        patientId: patient.id,
        labName: mockData.labName,
        criticalAnomaliesSummary: mockData.summary,
        biomarkers: {
          create: mockData.biomarkers.map((b) => ({
            name: b.name,
            value: parseFloat(b.value),
            unit: b.unit,
            isOutOfRange: b.isOutOfRange,
            referenceRange: b.referenceRange,
          })),
        },
      },
    });

    console.log('Second test success! New LabReport ID:', labReport.id);
  } catch (error) {
    console.error('Second test failed:', error);
  } finally {
    await app.close();
    process.exit();
  }
}

bootstrap();