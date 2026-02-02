import { Module } from '@nestjs/common';
import { PartyProcessRateController } from './party-process-rate.controller';
import { PartyProcessRateService } from './party-process-rate.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PartyProcessRateController],
  providers: [PartyProcessRateService],
})
export class PartyProcessRateModule {}
