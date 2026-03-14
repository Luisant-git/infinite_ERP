import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InwardSummaryService } from './inward-summary.service';
import { InwardSummaryQueryDto } from './dto/inward-summary.dto';

@Controller('inward-summary')
export class InwardSummaryController {
  constructor(private readonly inwardSummaryService: InwardSummaryService) {}

  @Get()
  async getInwardSummary(@Query() query: InwardSummaryQueryDto) {
    return this.inwardSummaryService.getInwardSummary(query);
  }
}
