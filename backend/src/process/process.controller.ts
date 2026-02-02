import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProcessService } from './process.service';
import { CreateProcessDto } from './dto/create-process.dto';

@ApiTags('Process Management')
@Controller('process')
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  @Get()
  findAll(@Query('search') search: string = '', @Query('page') page: string = '1', @Query('limit') limit: string = '10') {
    return this.processService.findAll(search, +page, +limit);
  }

  @Post()
  create(@Body() data: CreateProcessDto) {
    return this.processService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: CreateProcessDto) {
    return this.processService.update(+id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.processService.delete(+id);
  }
}
