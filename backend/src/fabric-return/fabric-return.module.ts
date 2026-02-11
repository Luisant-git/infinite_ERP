import { Module } from '@nestjs/common';
import { FabricReturnController } from './fabric-return.controller';
import { FabricReturnService } from './fabric-return.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FabricReturnController],
  providers: [FabricReturnService],
  exports: [FabricReturnService]
})
export class FabricReturnModule {}
