import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { prisma } from '@corphish/db/client'

@Injectable()
export class PrismaService implements OnModuleDestroy {
  get client() {
    return prisma
  }

  async onModuleDestroy(): Promise<void> {
    await prisma.$disconnect()
  }
}
