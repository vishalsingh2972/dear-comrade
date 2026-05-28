import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('webhook/infobip')
export class IngestionController {
  constructor(
    @InjectQueue('LAB_REPORT_QUEUE') private readonly reportQueue: Queue,
  ) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleIncomingMedia(@Body() payload: any) {
    const message = payload?.results?.[0];
    const parentPhoneNumber = message?.from;

    // Look for the image URL in the structure Infobip sends
    const mediaUrl = message?.message?.image?.url || message?.message?.mediaUrl;

    if (!parentPhoneNumber || !mediaUrl) {
      console.log('Payload received but missing fields:', JSON.stringify(payload, null, 2));
      return { status: 'ignored', message: 'Missing phone number or media attachment' };
    }

    // Hand it off to the background queue worker
    const job = await this.reportQueue.add('process-report', {
      phoneNumber: parentPhoneNumber,
      imageUrl: mediaUrl,
      timestamp: new Date().toISOString(),
    });

    return {
      status: 'queued',
      jobId: job.id,
    };
  }
}