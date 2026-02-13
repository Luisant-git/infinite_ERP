import { Controller, Get, Headers } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('approvals')
  async getApprovalsPending(@Headers('tenant-id') tenantId: string) {
    return this.dashboardService.getApprovalsPending(parseInt(tenantId));
  }
}
