import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from './generated/prisma'; // This matches your schema output path

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}