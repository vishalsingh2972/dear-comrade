import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IngestionModule } from './ingestion/ingestion.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // Connects to your local running Redis instance
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    IngestionModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
})
export class AppModule { }