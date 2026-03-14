import { Module } from '@nestjs/common';
import { PartyScreenRateService } from './party-screen-rate.service';
import { PartyScreenRateController } from './party-screen-rate.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PartyScreenRateController],
  providers: [PartyScreenRateService],
  exports: [PartyScreenRateService],
})
export class PartyScreenRateModule {}