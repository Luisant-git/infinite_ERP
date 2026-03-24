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
import { PartyProcessRateModule } from './party-process-rate/party-process-rate.module';
import { PartyScreenRateModule } from './party-screen-rate/party-screen-rate.module';
import { MasterModule } from './master/master.module';
import { FabricInwardModule } from './fabric-inward/fabric-inward.module';
import { RateQuotationModule } from './rate-quotation/rate-quotation.module';
import { FabricDcModule } from './fabric-dc/fabric-dc.module';
import { FabricReturnModule } from './fabric-return/fabric-return.module';
import { GstMasterModule } from './gst-master/gst-master.module';
import { FabricBillModule } from './fabric-bill/fabric-bill.module';
import { BillEinvoiceModule } from './bill-einvoice/bill-einvoice.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SettingsModule } from './settings/settings.module';
import { InwardSummaryModule } from './inward-summary/inward-summary.module';
import { PartyOpeningModule } from './party-opening/party-opening.module';
import { CollectionModule } from './collection/collection.module';
import { PartyLedgerModule } from './party-ledger/party-ledger.module';


@Module({
  imports: [PrismaModule, AuthModule, PartyModule, ConcernModule, PartyTypeModule, DesignModule, UploadModule, ProcessModule, PartyProcessRateModule, PartyScreenRateModule, MasterModule, FabricInwardModule, RateQuotationModule, FabricDcModule, FabricReturnModule, GstMasterModule, FabricBillModule, BillEinvoiceModule, DashboardModule, SettingsModule, InwardSummaryModule, PartyOpeningModule, CollectionModule, PartyLedgerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}