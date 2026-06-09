import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import { Twilio } from 'twilio';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReminderService {
  private prisma = new PrismaClient();
  private twilioClient: Twilio;

  constructor(private configService: ConfigService) {
    this.twilioClient = new Twilio(
      this.configService.get('TWILIO_ACCOUNT_SID')!,
      this.configService.get('TWILIO_AUTH_TOKEN')!
    );
  }

  // 8:00 AM IST daily cron
  @Cron('0 8 * * *', { timeZone: 'Asia/Kolkata' })
  async sendDailyReminders() {
    // Bypass type checking for the query for now as we are not changing db tables atributes or values for now to not distrueb main branch
    const reports = await (this.prisma.report as any).findMany({
      where: {
        dailyReminder: { not: null }
      },
      distinct: ['sender'],
    });

    for (const report of reports) {
      // Access via bracket notation to bypass type checking
      const reminder = (report as any).dailyReminder;

      await this.twilioClient.messages.create({
        body: `☀️ Dear Comrade Reminder: ${reminder}`,
        from: this.configService.get('TWILIO_PHONE_NUMBER')!,
        to: report.sender,
      });
    }
  }
}