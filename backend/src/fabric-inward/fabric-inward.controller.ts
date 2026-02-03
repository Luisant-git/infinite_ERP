import { Controller, Get, Post, Put, Delete, Body, Param, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FabricInwardService } from './fabric-inward.service';
import { CreateFabricInwardDto } from './dto/create-fabric-inward.dto';

@ApiTags('Fabric Inward')
@ApiBearerAuth()
@Controller('fabric-inward')
export class FabricInwardController {
  constructor(private service: FabricInwardService) {}

  @Get('next-grn')
  @ApiOperation({ summary: 'Get next GRN number' })
  async getNextGrnNo(@Headers('tenant-id') tenantId: string) {
    return { grnNo: await this.service.getNextGrnNo(parseInt(tenantId)) };
  }

  @Get()
  @ApiOperation({ summary: 'Get all fabric inwards' })
  async findAll(
    @Headers('tenant-id') tenantId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.service.findAll(parseInt(tenantId), search, page ? parseInt(page) : 1, limit ? parseInt(limit) : 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fabric inward by id' })
  async findOne(@Param('id') id: string, @Headers('tenant-id') tenantId: string) {
    return this.service.findOne(parseInt(id), parseInt(tenantId));
  }

  @Post()
  @ApiOperation({ summary: 'Create fabric inward' })
  async create(
    @Body() createDto: CreateFabricInwardDto,
    @Headers('username') username: string,
    @Headers('tenant-id') tenantId: string
  ) {
    return this.service.create(createDto, username || 'system', parseInt(tenantId));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update fabric inward' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: CreateFabricInwardDto,
    @Headers('username') username: string,
    @Headers('tenant-id') tenantId: string
  ) {
    return this.service.update(parseInt(id), updateDto, username || 'system', parseInt(tenantId));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete fabric inward' })
  async delete(
    @Param('id') id: string,
    @Headers('username') username: string,
    @Headers('tenant-id') tenantId: string
  ) {
    return this.service.delete(parseInt(id), username || 'system', parseInt(tenantId));
  }
}
