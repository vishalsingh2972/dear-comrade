import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('report-queue')
export class ReportProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`✅ Worker received job: ${job.id}`);
    console.log(`📦 Data payload:`, job.data);
    
    // Day 3 will be all about adding the Gemini logic right here!
    return { status: 'processed' };
  }
}