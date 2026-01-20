import { Module } from '@nestjs/common';
import { PartyController } from './party.controller';
import { PartyService } from './party.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PartyController],
  providers: [PartyService, PrismaService],
  exports: [PartyService]
})
export class PartyModule {}