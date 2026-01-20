import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PartyTypeService } from './party-type.service';
import { CreatePartyTypeDto } from './dto/create-party-type.dto';
import { UpdatePartyTypeDto } from './dto/update-party-type.dto';

@Controller('party-types')
export class PartyTypeController {
  constructor(private readonly partyTypeService: PartyTypeService) {}

  @Post()
  create(@Body() createPartyTypeDto: CreatePartyTypeDto) {
    return this.partyTypeService.create(createPartyTypeDto);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.partyTypeService.findAll(search, +(page || 1), +(limit || 10));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partyTypeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePartyTypeDto: UpdatePartyTypeDto) {
    return this.partyTypeService.update(+id, updatePartyTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partyTypeService.remove(+id, 1);
  }
}