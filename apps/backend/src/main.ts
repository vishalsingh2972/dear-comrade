// apps/backend/src/main.ts
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: 'D:/JavaScript/AI/dear-comrade/apps/backend/.env' });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();