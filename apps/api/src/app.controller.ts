import { Controller, Post, Body } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('webhook')
export class AppController {
  constructor(@InjectQueue('report-queue') private reportQueue: Queue) { }

  @Post()
  async handleWebhook(@Body() body: any) {
    await this.reportQueue.add('process-report', { data: body });
    return { status: 'queued' };
  }

  @Post('test-ai')
  async testAI() {
    await this.reportQueue.add('test-job', { payload: 'trigger' });
    return { status: 'AI Test Triggered' };
  }
}