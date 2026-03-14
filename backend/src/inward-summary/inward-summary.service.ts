import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InwardSummaryQueryDto } from './dto/inward-summary.dto';

@Injectable()
export class InwardSummaryService {
  constructor(private prisma: PrismaService) {}

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
