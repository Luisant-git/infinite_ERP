import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getApprovalsPending(tenantId: number) {
    const [rateQuotationApprovals, partyApprovals, designApprovals] = await Promise.all([
      // Rate Quotation Approvals Pending
      this.prisma.rateQuotationHeader.count({
        where: {
          tenantId,
          deleteFlg: 0,
          isApproval: 0
        }
      }),
      // Party Approvals Pending
      this.prisma.party.count({
        where: {
          isApproval: 0
        }
      }),
      // Design Approvals Pending
      this.prisma.design.count({
        where: {
          isApproval: 0
        }
      })
    ]);

    return {
      rateQuotationApprovals,
      partyApprovals,
      designApprovals
    };
  }
}
