import { Module } from '@nestjs/common';
import { PartyTypeService } from './party-type.service';
import { PartyTypeController } from './party-type.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PartyTypeController],
  providers: [PartyTypeService],
})
export class PartyTypeModule {}