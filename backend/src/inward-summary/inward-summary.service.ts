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
      },
      include: {
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
    const { fromDate, toDate } = query;

    // Get all concerns/tenants
    const concerns = await this.prisma.concern.findMany({
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
      })
    );

    return {
      concerns: concernsData,
      grandTotals: this.calculateGrandTotals(concernsData),
    };
  }

  private async getInwardSummaryByConcern(query: InwardSummaryQueryDto & { concernId: number }) {
    const { fromDate, toDate, concernId, search } = query;

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

        return detailsWithCalculations.filter(item => item !== null);
      }),
    );

    // Flatten the array and filter out nulls
    const flattenedData = summaryData.flat();

    return {
      data: flattenedData,
    };
  }

  private calculateTotals(data: any[]) {
    return data.reduce(
      (acc, item) => ({
        inwardKgs: acc.inwardKgs + (Number(item.inwardKgs) || 0),
        dcKgs: acc.dcKgs + (Number(item.dcKgs) || 0),
        returnKgs: acc.returnKgs + (Number(item.returnKgs) || 0),
        balanceKgs: acc.balanceKgs + (Number(item.balanceKgs) || 0),
      }),
      { inwardKgs: 0, dcKgs: 0, returnKgs: 0, balanceKgs: 0 }
    );
  }

  private calculateGrandTotals(concernsData: any[]) {
    return concernsData.reduce(
      (acc, concern) => ({
        inwardKgs: acc.inwardKgs + concern.totals.inwardKgs,
        dcKgs: acc.dcKgs + concern.totals.dcKgs,
        returnKgs: acc.returnKgs + concern.totals.returnKgs,
        balanceKgs: acc.balanceKgs + concern.totals.balanceKgs,
      }),
      { inwardKgs: 0, dcKgs: 0, returnKgs: 0, balanceKgs: 0 }
    );
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

        return detailsWithCalculations.filter(item => item !== null);
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
