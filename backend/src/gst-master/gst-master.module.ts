import { Module } from '@nestjs/common';
import { GstMasterController } from './gst-master.controller';
import { GstMasterService } from './gst-master.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GstMasterController],
  providers: [GstMasterService],
  exports: [GstMasterService],
})
export class GstMasterModule {}
