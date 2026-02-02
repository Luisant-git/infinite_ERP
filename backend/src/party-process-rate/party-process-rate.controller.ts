import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PartyProcessRateService } from './party-process-rate.service';

@Controller('party-process-rate')
export class PartyProcessRateController {
  constructor(private readonly service: PartyProcessRateService) {}

  @Get()
  findAll(@Query('partyId') partyId?: string) {
    return this.service.findAll(partyId ? parseInt(partyId) : undefined);
  }

  @Post()
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(parseInt(id), data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(parseInt(id));
  }

  @Post('copy')
  copyRates(@Body() data: { fromPartyId: number; toPartyId: number }) {
    return this.service.copyRates(data.fromPartyId, data.toPartyId);
  }
}
