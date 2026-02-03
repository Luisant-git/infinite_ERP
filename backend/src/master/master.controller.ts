import { Controller, Get, Post, Put, Delete, Body, Param, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MasterService } from './master.service';

@ApiTags('Master')
@ApiBearerAuth()
@Controller('master')
export class MasterController {
  constructor(private service: MasterService) {}

  @Get(':type')
  async findByType(@Param('type') type: string, @Headers('tenant-id') tenantId: string) {
    return this.service.findByType(type, parseInt(tenantId));
  }

  @Post()
  async create(@Body() body: { masterType: string; masterName: string }, @Headers('tenant-id') tenantId: string) {
    return this.service.create(body.masterType, body.masterName, parseInt(tenantId));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { masterName: string }, @Headers('tenant-id') tenantId: string) {
    return this.service.update(parseInt(id), body.masterName, parseInt(tenantId));
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Headers('tenant-id') tenantId: string) {
    return this.service.delete(parseInt(id), parseInt(tenantId));
  }
}
