import { Controller, Get, Post, Put, Delete, Body, Param, Headers, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { PartyService } from './party.service';
import { CreatePartyDto } from './dto/create-party.dto';

@ApiTags('Party Management')
@ApiBearerAuth()
@Controller('party')
export class PartyController {
  constructor(private partyService: PartyService) {}

  @Get()
  @ApiOperation({ summary: 'Get all parties' })
  @ApiResponse({ status: 200, description: 'List of parties' })
  async findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.partyService.findAll(
      search, 
      page ? parseInt(page) : 1, 
      limit ? parseInt(limit) : 10
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create new party' })
  @ApiResponse({ status: 201, description: 'Party created successfully' })
  async create(@Body() createPartyDto: CreatePartyDto) {
    return this.partyService.create(createPartyDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update party' })
  @ApiResponse({ status: 200, description: 'Party updated successfully' })
  async update(@Param('id') id: string, @Body() updatePartyDto: CreatePartyDto) {
    return this.partyService.update(parseInt(id), updatePartyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete party' })
  @ApiHeader({ name: 'user-id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Party deleted successfully' })
  async delete(@Param('id') id: string, @Headers('user-id') userId: string) {
    return this.partyService.delete(parseInt(id), parseInt(userId));
  }
}