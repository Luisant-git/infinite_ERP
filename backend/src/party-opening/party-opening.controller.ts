import { Controller, Get, Post, Body, Put, Param, Delete, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PartyOpeningService } from './party-opening.service';
import { CreatePartyOpeningDto } from './dto/create-party-opening.dto';
import { UpdatePartyOpeningDto } from './dto/update-party-opening.dto';

@ApiTags('Party Opening')
@ApiBearerAuth()
@Controller('party-opening')
export class PartyOpeningController {
  constructor(private readonly service: PartyOpeningService) {}

  @Get()
  @ApiOperation({ summary: 'Get all party openings' })
  async findAll(@Headers('tenant-id') tenantId: string) {
    return this.service.findAll(parseInt(tenantId));
  }

  @Post()
  @ApiOperation({ summary: 'Create new party opening' })
  async create(
    @Body() createDto: CreatePartyOpeningDto,
    @Headers('tenant-id') tenantId: string,
  ) {
    return this.service.create(createDto, parseInt(tenantId));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update party opening' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePartyOpeningDto,
    @Headers('tenant-id') tenantId: string,
  ) {
    return this.service.update(parseInt(id), updateDto, parseInt(tenantId));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete party opening' })
  async remove(
    @Param('id') id: string,
    @Headers('tenant-id') tenantId: string,
  ) {
    return this.service.remove(parseInt(id), parseInt(tenantId));
  }
}
