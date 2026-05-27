import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('LAB_REPORT_QUEUE')
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`[Job ${job.id}] Successfully pulled from queue. Processing report...`);
    this.logger.log(`Target Parent: ${job.data.phoneNumber}`);
    this.logger.log(`Image Source Link: ${job.data.imageUrl}`);
    
    // Day 2 (Tomorrow) we write the Gemini 2.5 vision parser logic here!
    return { processed: true };
  }
}