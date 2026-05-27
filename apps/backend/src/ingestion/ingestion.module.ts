import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IngestionController } from './ingestion.controller';
import { IngestionProcessor } from './ingestion.processor';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    // Register the specific queue named 'LAB_REPORT_QUEUE'
    BullModule.registerQueue({
      name: 'LAB_REPORT_QUEUE',
    }),
  ],
  controllers: [IngestionController],
  providers: [IngestionProcessor, PrismaService],
})
export class IngestionModule {}