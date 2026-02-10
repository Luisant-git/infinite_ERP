import { Module } from '@nestjs/common';
import { FabricDcController } from './fabric-dc.controller';
import { FabricDcService } from './fabric-dc.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FabricDcController],
  providers: [FabricDcService],
  exports: [FabricDcService]
})
export class FabricDcModule {}
