import { Module } from '@nestjs/common';
import { FabricInwardController } from './fabric-inward.controller';
import { FabricInwardService } from './fabric-inward.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FabricInwardController],
  providers: [FabricInwardService],
  exports: [FabricInwardService]
})
export class FabricInwardModule {}
