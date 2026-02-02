import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PartyModule } from './party/party.module';
import { ConcernModule } from './concern/concern.module';
import { PartyTypeModule } from './party-type/party-type.module';
import { DesignModule } from './design/design.module';
import { UploadModule } from './upload/upload.module';
import { ProcessModule } from './process/process.module';

@Module({
  imports: [PrismaModule, AuthModule, PartyModule, ConcernModule, PartyTypeModule, DesignModule, UploadModule, ProcessModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
