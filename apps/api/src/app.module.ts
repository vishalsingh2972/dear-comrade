import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { ReportProcessor } from './report.processor';

@Module({
  imports: [
    BullModule.forRoot({ connection: { host: 'localhost', port: 6379 } }),
    BullModule.registerQueue({ name: 'report-queue' }),
  ],
  controllers: [AppController],
  providers: [ReportProcessor],
})
export class AppModule {}