import { Controller, Get, Param, Headers, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PartyLedgerService } from './party-ledger.service';

@ApiTags('Party Ledger')
@ApiBearerAuth()
@Controller('party-ledger')
export class PartyLedgerController {
  constructor(private readonly service: PartyLedgerService) {}

  @Get()
  @ApiOperation({ summary: 'Get all party ledgers' })
  async getAllLedgers(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Headers('tenant-id') tenantId: string,
  ) {
    return this.service.getLedger(
      [],
      parseInt(tenantId),
      fromDate,
      toDate,
    );
  }

  @Get(':partyIds')
  @ApiOperation({ summary: 'Get party ledger for specific parties' })
  async getLedger(
    @Param('partyIds') partyIds: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Headers('tenant-id') tenantId: string,
  ) {
    const ids = partyIds ? partyIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
    
    return this.service.getLedger(
      ids,
      parseInt(tenantId),
      fromDate,
      toDate,
    );
  }
}
