import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { ReportProcessor } from './report.processor';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    BullModule.forRoot({ connection: { host: 'localhost', port: 6379 } }),
    BullModule.registerQueue({ 
      name: 'report-queue',
      defaultJobOptions: {
        attempts: 3, 
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [ReportProcessor],
})
export class AppModule {}