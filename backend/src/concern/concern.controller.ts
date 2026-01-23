import { Controller, Get, Post, Put, Delete, Body, Param, Headers, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { ConcernService } from './concern.service';
import { CreateConcernDto } from './dto/create-concern.dto';

@ApiTags('Concern Management')
@ApiBearerAuth()
@Controller('concern')
export class ConcernController {
  constructor(private concernService: ConcernService) {}

  @Get()
  @ApiOperation({ summary: 'Get all concerns' })
  @ApiResponse({ status: 200, description: 'List of concerns' })
  async findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.concernService.findAll(
      search, 
      page ? parseInt(page) : 1, 
      limit ? parseInt(limit) : 10
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create new concern' })
  @ApiResponse({ status: 201, description: 'Concern created successfully' })
  async create(@Body() createConcernDto: CreateConcernDto) {
    return this.concernService.create(createConcernDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update concern' })
  @ApiResponse({ status: 200, description: 'Concern updated successfully' })
  async update(@Param('id') id: string, @Body() updateConcernDto: CreateConcernDto) {
    return this.concernService.update(parseInt(id), updateConcernDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete concern' })
  @ApiHeader({ name: 'user-id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Concern deleted successfully' })
  async delete(@Param('id') id: string, @Headers('user-id') userId: string) {
    return this.concernService.delete(parseInt(id), parseInt(userId));
  }
}