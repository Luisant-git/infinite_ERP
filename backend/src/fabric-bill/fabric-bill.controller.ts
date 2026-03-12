import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, Headers } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { FabricBillService } from './fabric-bill.service';
import { CreateFabricBillDto, UpdateFabricBillDto } from './dto/fabric-bill.dto';

@Controller('fabric-bill')
export class FabricBillController {
  constructor(private readonly fabricBillService: FabricBillService) {}

  @Get('next-bill-no')
  async getNextBillNo(@Headers('tenant-id') tenantId: string) {
    return this.fabricBillService.getNextBillNo(Number(tenantId));
  }

  @Get()
  async findAll(
    @Headers('tenant-id') tenantId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.fabricBillService.findAll(Number(tenantId), search, Number(page) || 1, Number(limit) || 10);
  }

  @Get('available-dcs/:partyId')
  @ApiOperation({ summary: 'Get available DCs for billing' })
  async getAvailableDcs(
    @Param('partyId') partyId: string,
    @Headers('tenant-id') tenantId: string
  ) {
    return this.fabricBillService.getAvailableDcs(parseInt(partyId), parseInt(tenantId));
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fabricBillService.findOne(id);
  }

  @Post()
  async create(
    @Headers('tenant-id') tenantId: string,
    @Headers('concern-id') concernId: string,
    @Headers('username') username: string,
    @Body() createDto: CreateFabricBillDto,
  ) {
    return this.fabricBillService.create(Number(tenantId), Number(concernId), username, createDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Headers('username') username: string,
    @Body() updateDto: UpdateFabricBillDto,
  ) {
    return this.fabricBillService.update(id, username, updateDto);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Headers('username') username: string,
  ) {
    return this.fabricBillService.remove(id, username);
  }
}
