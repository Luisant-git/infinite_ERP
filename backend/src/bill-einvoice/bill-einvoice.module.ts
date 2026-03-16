import { Module } from '@nestjs/common';
import { BillEinvoiceController } from './bill-einvoice.controller';
import { BillEinvoiceService } from './bill-einvoice.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BillEinvoiceController],
  providers: [BillEinvoiceService],
  exports: [BillEinvoiceService],
})
export class BillEinvoiceModule {}