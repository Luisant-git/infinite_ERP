import { Controller, Get, Post, Body, Put, Param, Delete, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@ApiTags('Collection')
@ApiBearerAuth()
@Controller('collection')
export class CollectionController {
  constructor(private readonly service: CollectionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all collections' })
  async findAll(@Headers('tenant-id') tenantId: string) {
    return this.service.findAll(parseInt(tenantId));
  }

  @Post()
  @ApiOperation({ summary: 'Create new collection' })
  async create(
    @Body() createDto: CreateCollectionDto,
    @Headers('tenant-id') tenantId: string,
  ) {
    return this.service.create(createDto, parseInt(tenantId));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update collection' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCollectionDto,
    @Headers('tenant-id') tenantId: string,
  ) {
    return this.service.update(parseInt(id), updateDto, parseInt(tenantId));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete collection' })
  async remove(
    @Param('id') id: string,
    @Headers('tenant-id') tenantId: string,
  ) {
    return this.service.remove(parseInt(id), parseInt(tenantId));
  }

  @Get('party-balance/:partyId')
  @ApiOperation({ summary: 'Get party current balance' })
  async getPartyBalance(
    @Param('partyId') partyId: string,
    @Headers('tenant-id') tenantId: string,
  ) {
    return this.service.getPartyBalance(parseInt(partyId), parseInt(tenantId));
  }
}
