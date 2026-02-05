import { Module } from '@nestjs/common';
import { RateQuotationController } from './rate-quotation.controller';
import { RateQuotationService } from './rate-quotation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RateQuotationController],
  providers: [RateQuotationService],
  exports: [RateQuotationService]
})
export class RateQuotationModule {}
