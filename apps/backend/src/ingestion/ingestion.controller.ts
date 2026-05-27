import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('webhook/infobip')
export class IngestionController {
  constructor(
    @InjectQueue('LAB_REPORT_QUEUE') private readonly reportQueue: Queue,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK) // Instantly send back HTTP 200
  async handleIncomingMedia(@Body() payload: any) {
    // Extract vital fields from the incoming message
    const parentPhoneNumber = payload?.results?.[0]?.from;
    const mediaUrl = payload?.results?.[0]?.message?.mediaUrl;

    if (!parentPhoneNumber || !mediaUrl) {
      return { status: 'ignored', message: 'Missing phone number or media attachment' };
    }

    // Hand it off to the background queue worker instantly (< 50ms)
    const job = await this.reportQueue.add('process-report', {
      phoneNumber: parentPhoneNumber,
      imageUrl: mediaUrl,
      timestamp: new Date().toISOString(),
    });

    // Return tracking ID back to the gateway closing the connection safely
    return {
      status: 'queued',
      jobId: job.id,
    };
  }
}