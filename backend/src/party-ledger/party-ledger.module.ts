import { Module } from '@nestjs/common';
import { PartyLedgerService } from './party-ledger.service';
import { PartyLedgerController } from './party-ledger.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PartyLedgerController],
  providers: [PartyLedgerService],
  exports: [PartyLedgerService],
})
export class PartyLedgerModule {}
