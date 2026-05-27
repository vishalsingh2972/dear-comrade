import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    // Use a pool configuration that explicitly allows the connection 
    // without enforcing strict CA certificate verification
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // This is the key for Supabase/PG in dev
      },
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}