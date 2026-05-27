import * as dotenv from 'dotenv';
dotenv.config({ path: 'D:/JavaScript/AI/dear-comrade/apps/backend/.env' });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // In production, replace with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });
  
  await app.listen(3000);
}
bootstrap();