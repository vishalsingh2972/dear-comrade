import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IngestionModule } from './ingestion/ingestion.module';

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
  ],
})
export class AppModule {}