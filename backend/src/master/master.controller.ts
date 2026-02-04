import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MasterService } from './master.service';

@ApiTags('Master')
@ApiBearerAuth()
@Controller('master')
export class MasterController {
  constructor(private service: MasterService) {}

  @Get(':type')
  async findByType(@Param('type') type: string) {
    return this.service.findByType(type);
  }

  @Post()
  async create(@Body() body: { masterType: string; masterName: string }) {
    return this.service.create(body.masterType, body.masterName);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { masterName: string }) {
    return this.service.update(parseInt(id), body.masterName);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(parseInt(id));
  }
}
