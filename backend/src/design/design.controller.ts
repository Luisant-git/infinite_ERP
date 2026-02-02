import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DesignService } from './design.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';

@ApiTags('Design Management')
@Controller('design')
export class DesignController {
  constructor(private readonly designService: DesignService) {}

  @Post()
  @ApiOperation({ summary: 'Create new design' })
  @ApiResponse({ status: 201, description: 'Design created successfully' })
  create(@Body() createDesignDto: CreateDesignDto) {
    return this.designService.create(createDesignDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all designs' })
  @ApiResponse({ status: 200, description: 'List of designs' })
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
  @ApiOperation({ summary: 'Get design by ID' })
  @ApiResponse({ status: 200, description: 'Design details' })
  findOne(@Param('id') id: string) {
    return this.designService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update design' })
  @ApiResponse({ status: 200, description: 'Design updated successfully' })
  update(@Param('id') id: string, @Body() updateDesignDto: UpdateDesignDto) {
    return this.designService.update(+id, updateDesignDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete design' })
  @ApiResponse({ status: 200, description: 'Design deleted successfully' })
  remove(@Param('id') id: string, @Headers('user-id') userId: string) {
    return this.designService.remove(+id, parseInt(userId));
  }
}
