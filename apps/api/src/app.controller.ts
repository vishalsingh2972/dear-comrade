import { Controller, Post, Body, Get } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('webhook')
export class AppController {
  constructor(@InjectQueue('report-queue') private reportQueue: Queue) { }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: ['Sarvam', 'Twilio', 'Cloudinary', 'Resend']
    };
  }

  @Post()
  async handleWebhook(@Body() body: any) {
    const image = body.MediaUrl0;
    const sender = body.From;

    console.log(`📩 Received WhatsApp from ${sender}. Media: ${image}`);

    if (image) {
      await this.reportQueue.add('process-report', {
        imageUrl: image,
        sender: sender
      });
      return { status: 'queued_with_image' };
    }
    return { status: 'ignored_no_image' };
  }

  @Post('test-ai')
  async testAI() {
    await this.reportQueue.add('test-job', { payload: 'trigger' });
    return { status: 'AI Test Triggered' };
  }
}