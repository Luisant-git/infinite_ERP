import { Module } from '@nestjs/common';
import { ConcernController } from './concern.controller';
import { ConcernService } from './concern.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ConcernController],
  providers: [ConcernService, PrismaService],
  exports: [ConcernService]
})
export class ConcernModule {}