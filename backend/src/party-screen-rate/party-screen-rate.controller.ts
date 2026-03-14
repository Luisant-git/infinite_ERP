import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { PartyScreenRateService } from './party-screen-rate.service';
import { CreatePartyScreenRateDto } from './dto/create-party-screen-rate.dto';
import { UpdatePartyScreenRateDto } from './dto/update-party-screen-rate.dto';

@Controller('party-screen-rate')
export class PartyScreenRateController {
  constructor(private readonly partyScreenRateService: PartyScreenRateService) {}

  @Post()
  create(@Body() createPartyScreenRateDto: CreatePartyScreenRateDto) {
    return this.partyScreenRateService.create(createPartyScreenRateDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.partyScreenRateService.findAll(search, pageNum, limitNum);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.partyScreenRateService.findOne(id);
  }

  @Get('party/:partyId')
  findByParty(@Param('partyId', ParseIntPipe) partyId: number) {
    return this.partyScreenRateService.findByParty(partyId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePartyScreenRateDto: UpdatePartyScreenRateDto,
  ) {
    return this.partyScreenRateService.update(id, updatePartyScreenRateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.partyScreenRateService.remove(id);
  }
}