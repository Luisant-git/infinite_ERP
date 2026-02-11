import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { GstMasterService } from './gst-master.service';
import { CreateGstMasterDto, UpdateGstMasterDto } from './dto/gst-master.dto';

@Controller('gst-master')
export class GstMasterController {
  constructor(private readonly gstMasterService: GstMasterService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.gstMasterService.findAll(search, Number(page) || 1, Number(limit) || 10);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gstMasterService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateGstMasterDto) {
    return this.gstMasterService.create(createDto);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateGstMasterDto) {
    return this.gstMasterService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.gstMasterService.remove(id);
  }
}
