import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AppService {
  private prisma = new PrismaClient();

  async test(): Promise<any> {
    return this.prisma.transaction.findMany();
  }
}
