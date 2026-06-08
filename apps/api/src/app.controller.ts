import { Controller, Post, Body, Req } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Request } from 'express';

@Controller('webhook')
export class AppController {
  constructor(@InjectQueue('report-queue') private reportQueue: Queue) { }

  @Post()
  async handleWebhook(@Body() body: any) {
    // Twilio sends the image URL in 'MediaUrl0'
    const image = body.MediaUrl0;
    const sender = body.From; // The phone number of the parent

    console.log(`📩 Received WhatsApp from ${sender}. Media: ${image}`);

    if (image) {
      // Add job only if there is an image to process
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