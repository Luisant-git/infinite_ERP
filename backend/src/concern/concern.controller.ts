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
  @ApiHeader({ name: 'tenant-id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'List of concerns' })
  async findAll(
    @Headers('tenant-id') tenantId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.concernService.findAll(
      parseInt(tenantId), 
      search, 
      page ? parseInt(page) : 1, 
      limit ? parseInt(limit) : 10
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create new concern' })
  @ApiHeader({ name: 'tenant-id', description: 'Tenant ID' })
  @ApiResponse({ status: 201, description: 'Concern created successfully' })
  async create(@Headers('tenant-id') tenantId: string, @Body() createConcernDto: CreateConcernDto) {
    return this.concernService.create(parseInt(tenantId), createConcernDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update concern' })
  @ApiHeader({ name: 'tenant-id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Concern updated successfully' })
  async update(@Param('id') id: string, @Headers('tenant-id') tenantId: string, @Body() updateConcernDto: CreateConcernDto) {
    return this.concernService.update(parseInt(id), parseInt(tenantId), updateConcernDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete concern' })
  @ApiHeader({ name: 'tenant-id', description: 'Tenant ID' })
  @ApiHeader({ name: 'user-id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Concern deleted successfully' })
  async delete(@Param('id') id: string, @Headers('tenant-id') tenantId: string, @Headers('user-id') userId: string) {
    return this.concernService.delete(parseInt(id), parseInt(tenantId), parseInt(userId));
  }
}