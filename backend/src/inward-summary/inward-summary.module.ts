import { Module } from '@nestjs/common';
import { InwardSummaryController } from './inward-summary.controller';
import { InwardSummaryService } from './inward-summary.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InwardSummaryController],
  providers: [InwardSummaryService],
})
export class InwardSummaryModule {}
