import { Module } from '@nestjs/common';
import { FabricBillController } from './fabric-bill.controller';
import { FabricBillService } from './fabric-bill.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FabricBillController],
  providers: [FabricBillService],
  exports: [FabricBillService],
})
export class FabricBillModule {}
