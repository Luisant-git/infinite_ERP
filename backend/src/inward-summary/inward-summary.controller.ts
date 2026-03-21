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

  @Get('test-concerns')
  async testConcerns() {
    return this.inwardSummaryService.testConcerns();
  }

  @Get('un-dc')
  async getUnDcList(@Query() query: InwardSummaryQueryDto) {
    return this.inwardSummaryService.getUnDcList(query);
  }

  @Get('un-bill')
  async getUnBillList(@Query() query: InwardSummaryQueryDto) {
    return this.inwardSummaryService.getUnBillList(query);
  }

  @Get('md-view')
  async getInwardSummaryForMD(@Query() query: InwardSummaryQueryDto) {
    return this.inwardSummaryService.getInwardSummaryForMD(query);
  }
}
