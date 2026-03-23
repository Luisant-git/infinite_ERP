import { Module } from '@nestjs/common';
import { PartyOpeningService } from './party-opening.service';
import { PartyOpeningController } from './party-opening.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PartyOpeningController],
  providers: [PartyOpeningService],
})
export class PartyOpeningModule {}
