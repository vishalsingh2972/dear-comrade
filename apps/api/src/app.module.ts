import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { ReportProcessor } from './report.processor';
import { HttpModule } from '@nestjs/axios';
import { ReminderService } from './cron/reminder.service';

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    BullModule.forRoot({ connection: { host: 'localhost', port: 6379 } }),
    BullModule.registerQueue({ name: 'report-queue' }),
  ],
  controllers: [AppController],
  providers: [ReportProcessor, ReminderService],
})
export class AppModule {}