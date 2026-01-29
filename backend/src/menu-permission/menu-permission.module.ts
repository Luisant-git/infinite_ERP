import { Module } from '@nestjs/common';
import { MenuPermissionController } from './menu-permission.controller';
import { MenuPermissionService } from './menu-permission.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MenuPermissionController],
  providers: [MenuPermissionService, PrismaService],
  exports: [MenuPermissionService]
})
export class MenuPermissionModule {}