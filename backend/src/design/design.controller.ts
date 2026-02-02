import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Headers } from '@nestjs/common';
import { DesignService } from './design.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';

@Controller('design')
export class DesignController {
  constructor(private readonly designService: DesignService) {}

  @Post()
  create(@Body() createDesignDto: CreateDesignDto) {
    return this.designService.create(createDesignDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.designService.findAll(
      search,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.designService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDesignDto: UpdateDesignDto) {
    return this.designService.update(+id, updateDesignDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers('user-id') userId: string) {
    return this.designService.remove(+id, parseInt(userId));
  }
}
