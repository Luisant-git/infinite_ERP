import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InwardSummaryQueryDto } from './dto/inward-summary.dto';

@Injectable()
export class InwardSummaryService {
  constructor(private prisma: PrismaService) {}

  async testConcerns() {
    // Get all concerns
    const concerns = await this.prisma.concern.findMany({
      select: {
        id: true,
        partyName: true,
        active: true,
        isDeleted: true,
      },
    });

    // Get sample inward data
    const inwards = await this.prisma.fabricInwardHeader.findMany({
      take: 5,
      select: {
        id: true,
        grnNo: true,
        concernId: true,
        tenantId: true,
        isClosed: true,
        tenant: {
          select: {
            id: true,
            concernId: true,
            concern: {
              select: {
                id: true,
                partyName: true,
              },
            },
          },
        },
      },
    });

    return {
      concerns,
      sampleInwards: inwards,
    };
  }

  async getInwardSummaryForMD(query: InwardSummaryQueryDto) {
    const { fromDate, toDate, tenantId, concernId } = query;

    // Normalize numeric filter params (query params arrive as strings unless transformed)
    const tenantIdNum = tenantId ? Number(tenantId) : undefined;
    const concernIdNum = concernId ? Number(concernId) : undefined;

    // Get all concerns/tenants
    let concerns = await this.prisma.concern.findMany({
      select: {
        id: true,
        partyName: true,
      },
      where: {
        active: 1,
        isDeleted: false,
      },
      orderBy: { partyName: 'asc' },
    });

    // If tenantId (branch) filter is provided, limit to that tenant's concern only
    if (tenantIdNum) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantIdNum },
        include: { concern: true },
      });
      if (tenant && tenant.concern) {
        concerns = [
          { id: tenant.concern.id, partyName: tenant.concern.partyName },
        ];
      } else {
        // No matching tenant, return empty
        return { concerns: [], grandTotals: this.calculateGrandTotals([]) };
      }
    }

    // If concernId filter is provided, limit to that concern only
    if (concernIdNum) {
      const concern = concerns.find((c) => c.id === concernIdNum);
      if (concern) {
        concerns = [concern];
      } else {
        // No matching concern, return empty
        return { concerns: [], grandTotals: this.calculateGrandTotals([]) };
      }
    }

    // Get data for each concern
    const concernsData = await Promise.all(
      concerns.map(async (concern) => {
        const data = await this.getInwardSummaryByConcern({
          ...query,
          concernId: concern.id,
        });
        return {
          concernId: concern.id,
          concernName: concern.partyName,
          data: data.data,
          totals: this.calculateTotals(data.data),
        };
      }),
    );

    return {
      concerns: concernsData,
      grandTotals: this.calculateGrandTotals(concernsData),
    };
  }

  private async getInwardSummaryByConcern(
    query: InwardSummaryQueryDto & { concernId: number },
  ) {
    const { fromDate, toDate, concernId, search, tenantId } = query;

    const where: any = {
      isClosed: 0,
      deleteFlg: 0,
      // Filter by concern - either directly or through tenant relationship
      OR: [
        { concernId: concernId },
        {
          tenant: {
            concernId: concernId,
          },
        },
      ],
    };

    // If tenantId is provided, restrict to that tenant (branch)
    if (tenantId) {
      where.tenantId = tenantId;
    }

    // Date range filter
    if (fromDate && toDate) {
      where.grnDate = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    }

    // Search filter
    if (search) {
      where.AND = [
        where.OR ? { OR: where.OR } : {},
        {
          OR: [
            { grnNo: { contains: search, mode: 'insensitive' } },
            { pdcNo: { contains: search, mode: 'insensitive' } },
            { orderNo: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
      delete where.OR;
    }

    // Get inward data with details for this concern
    const inwards = await this.prisma.fabricInwardHeader.findMany({
      where,
      orderBy: { grnDate: 'desc' },
      include: {
        tenant: {
          include: {
            concern: true,
          },
        },
        details: {
          where: {
            deleteFlg: 0,
          },
          include: {
            fabric: {
              select: {
                id: true,
                masterName: true,
              },
            },
            dia: {
              select: {
                id: true,
                masterName: true,
              },
            },
            color: {
              select: {
                id: true,
                masterName: true,
              },
            },
            uom: {
              select: {
                id: true,
                masterName: true,
              },
            },
          },
        },
      },
    });

    // Calculate DC and Return quantities for each inward detail
    const summaryData = await Promise.all(
      inwards.map(async (inward) => {
        const detailsWithCalculations = await Promise.all(
          inward.details.map(async (detail) => {
            // Get DC quantity
            const dcData = await this.prisma.fabricDcHeader.findMany({
              where: {
                details: {
                  some: {
                    inwardDetailId: detail.id,
                  },
                },
              },
              include: {
                details: {
                  where: {
                    inwardDetailId: detail.id,
                  },
                },
              },
            });

            const dcKgs = dcData.reduce((sum, dc) => {
              return (
                sum +
                dc.details.reduce(
                  (detailSum, dcDetail) =>
                    detailSum + Number(dcDetail.dcWeight || 0),
                  0,
                )
              );
            }, 0);

            // Get Return quantity
            const returnData = await this.prisma.fabricReturnHeader.findMany({
              where: {
                details: {
                  some: {
                    inwardDetailId: detail.id,
                  },
                },
              },
              include: {
                details: {
                  where: {
                    inwardDetailId: detail.id,
                  },
                },
              },
            });

            const returnKgs = returnData.reduce((sum, ret) => {
              return (
                sum +
                ret.details.reduce(
                  (detailSum, retDetail) =>
                    detailSum + Number(retDetail.weight || 0),
                  0,
                )
              );
            }, 0);

            const inwardKgs = Number(detail.weight || 0);
            const balanceKgs = inwardKgs - dcKgs - returnKgs;

            // Only include records with positive balance
            if (balanceKgs <= 0) {
              return null;
            }

            return {
              id: detail.id,
              inwardNo: inward.grnNo,
              inwardDate: inward.grnDate,
              partyName: '',
              pdcNo: inward.pdcNo || '',
              orderNo: inward.orderNo || '',
              fabric: detail.fabric?.masterName || '',
              dia: detail.dia?.masterName || '',
              color: detail.color?.masterName || '',
              inwardKgs: Number(inwardKgs.toFixed(3)),
              dcKgs: Number(dcKgs.toFixed(3)),
              returnKgs: Number(returnKgs.toFixed(3)),
              balanceKgs: Number(balanceKgs.toFixed(3)),
              uom: detail.uom?.masterName || '',
            };
          }),
        );

        return detailsWithCalculations.filter((item) => item !== null);
      }),
    );

    // Flatten the array and filter out nulls
    const flattenedData = summaryData.flat();

    return {
      data: flattenedData,
    };
  }

  private calculateTotals(data: any[]) {
    // Get distinct inward numbers
    const distinctInwardNos = [
      ...new Set(data.map((item) => item.inwardNo)),
    ].filter(Boolean);

    return {
      inwardKgs: data.reduce(
        (acc, item) => acc + (Number(item.inwardKgs) || 0),
        0,
      ),
      dcKgs: data.reduce((acc, item) => acc + (Number(item.dcKgs) || 0), 0),
      returnKgs: data.reduce(
        (acc, item) => acc + (Number(item.returnKgs) || 0),
        0,
      ),
      balanceKgs: data.reduce(
        (acc, item) => acc + (Number(item.balanceKgs) || 0),
        0,
      ),
      totalRecords: data.length,
      distinctInwardCount: distinctInwardNos.length,
      distinctInwardNos: distinctInwardNos,
    };
  }

  private calculateGrandTotals(concernsData: any[]) {
    // Get all distinct inward numbers across all concerns
    const allDistinctInwardNos = [
      ...new Set(
        concernsData.flatMap(
          (concern) => concern.totals.distinctInwardNos || [],
        ),
      ),
    ].filter(Boolean);

    return {
      inwardKgs: concernsData.reduce(
        (acc, concern) => acc + concern.totals.inwardKgs,
        0,
      ),
      dcKgs: concernsData.reduce(
        (acc, concern) => acc + concern.totals.dcKgs,
        0,
      ),
      returnKgs: concernsData.reduce(
        (acc, concern) => acc + concern.totals.returnKgs,
        0,
      ),
      balanceKgs: concernsData.reduce(
        (acc, concern) => acc + concern.totals.balanceKgs,
        0,
      ),
      totalRecords: concernsData.reduce(
        (acc, concern) => acc + concern.totals.totalRecords,
        0,
      ),
      distinctInwardCount: allDistinctInwardNos.length,
      distinctInwardNos: allDistinctInwardNos,
    };
  }

  async getInwardSummary(query: InwardSummaryQueryDto) {
    const { fromDate, toDate, page = 1, limit = 10, search } = query;

    // Ensure page and limit are numbers
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const where: any = {
      isClosed: 0, // Only show open records
    };

    // Date range filter
    if (fromDate && toDate) {
      where.grnDate = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    }

    // Search filter
    if (search) {
      where.OR = [
        { grnNo: { contains: search, mode: 'insensitive' } },
        { pdcNo: { contains: search, mode: 'insensitive' } },
        { orderNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await this.prisma.fabricInwardHeader.count({ where });

    // Get inward data with details
    const inwards = await this.prisma.fabricInwardHeader.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { grnDate: 'desc' },
      include: {
        details: {
          include: {
            fabric: {
              select: {
                id: true,
                masterName: true,
              },
            },
            dia: {
              select: {
                id: true,
                masterName: true,
              },
            },
            color: {
              select: {
                id: true,
                masterName: true,
              },
            },
            uom: {
              select: {
                id: true,
                masterName: true,
              },
            },
          },
        },
      },
    });

    // Calculate DC and Return quantities for each inward detail
    const summaryData = await Promise.all(
      inwards.map(async (inward) => {
        const detailsWithCalculations = await Promise.all(
          inward.details.map(async (detail) => {
            // Get DC quantity
            const dcData = await this.prisma.fabricDcHeader.findMany({
              where: {
                details: {
                  some: {
                    inwardDetailId: detail.id,
                  },
                },
              },
              include: {
                details: {
                  where: {
                    inwardDetailId: detail.id,
                  },
                },
              },
            });

            const dcKgs = dcData.reduce((sum, dc) => {
              return (
                sum +
                dc.details.reduce(
                  (detailSum, dcDetail) =>
                    detailSum + Number(dcDetail.dcWeight || 0),
                  0,
                )
              );
            }, 0);

            // Get Return quantity
            const returnData = await this.prisma.fabricReturnHeader.findMany({
              where: {
                details: {
                  some: {
                    inwardDetailId: detail.id,
                  },
                },
              },
              include: {
                details: {
                  where: {
                    inwardDetailId: detail.id,
                  },
                },
              },
            });

            const returnKgs = returnData.reduce((sum, ret) => {
              return (
                sum +
                ret.details.reduce(
                  (detailSum, retDetail) =>
                    detailSum + Number(retDetail.weight || 0),
                  0,
                )
              );
            }, 0);

            const inwardKgs = Number(detail.weight || 0);
            const balanceKgs = inwardKgs - dcKgs - returnKgs;

            // Only include records with positive balance
            if (balanceKgs <= 0) {
              return null;
            }

            return {
              id: detail.id,
              inwardNo: inward.grnNo,
              inwardDate: inward.grnDate,
              partyName: '',
              pdcNo: inward.pdcNo || '',
              orderNo: inward.orderNo || '',
              fabric: detail.fabric?.masterName || '',
              dia: detail.dia?.masterName || '',
              color: detail.color?.masterName || '',
              inwardKgs: Number(inwardKgs.toFixed(3)),
              dcKgs: Number(dcKgs.toFixed(3)),
              returnKgs: Number(returnKgs.toFixed(3)),
              balanceKgs: Number(balanceKgs.toFixed(3)),
              uom: detail.uom?.masterName || '',
            };
          }),
        );

        return detailsWithCalculations.filter((item) => item !== null);
      }),
    );

    // Flatten the array and filter out nulls
    const flattenedData = summaryData.flat();

    return {
      data: flattenedData,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }
}
