import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PartyModule } from './party/party.module';
import { ConcernModule } from './concern/concern.module';
import { PartyTypeModule } from './party-type/party-type.module';
import { MenuPermissionModule } from './menu-permission/menu-permission.module';

@Module({
  imports: [PrismaModule, AuthModule, PartyModule, ConcernModule, PartyTypeModule, MenuPermissionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
