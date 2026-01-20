import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { PartyTypeService } from './party-type.service';
import { CreatePartyTypeDto } from './dto/create-party-type.dto';
import { UpdatePartyTypeDto } from './dto/update-party-type.dto';

@ApiTags('Party Type Management')
@ApiBearerAuth()
@Controller('party-types')
export class PartyTypeController {
  constructor(private readonly partyTypeService: PartyTypeService) {}

  @Post()
  @ApiOperation({ summary: 'Create new party type' })
  @ApiHeader({ name: 'tenant-id', description: 'Tenant ID' })
  @ApiResponse({ status: 201, description: 'Party type created successfully' })
  create(@Headers('tenant-id') tenantId: string, @Body() createPartyTypeDto: CreatePartyTypeDto) {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.partyTypeService.create({ ...createPartyTypeDto, tenantId: parseInt(tenantId) });
  }

  @Get()
  @ApiOperation({ summary: 'Get all party types' })
  @ApiHeader({ name: 'tenant-id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'List of party types' })
  findAll(
    @Headers('tenant-id') tenantId: string,
    @Query('search') search?: string, 
    @Query('page') page?: string, 
    @Query('limit') limit?: string
  ) {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.partyTypeService.findAll(parseInt(tenantId), search, +(page || 1), +(limit || 10));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get party type by ID' })
  @ApiResponse({ status: 200, description: 'Party type details' })
  findOne(@Param('id') id: string) {
    return this.partyTypeService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update party type' })
  @ApiHeader({ name: 'tenant-id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Party type updated successfully' })
  update(@Param('id') id: string, @Headers('tenant-id') tenantId: string, @Body() updatePartyTypeDto: UpdatePartyTypeDto) {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.partyTypeService.update(+id, updatePartyTypeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete party type' })
  @ApiHeader({ name: 'tenant-id', description: 'Tenant ID' })
  @ApiHeader({ name: 'user-id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Party type deleted successfully' })
  remove(@Param('id') id: string, @Headers('tenant-id') tenantId: string, @Headers('user-id') userId: string) {
    if (!tenantId || !userId) {
      throw new Error('Tenant ID and User ID are required');
    }
    return this.partyTypeService.remove(+id, parseInt(userId));
  }
}