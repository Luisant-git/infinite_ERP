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
            { grnNo: { contains: search } },
            { pdcNo: { contains: search } },
            { orderNo: { contains: search } },
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

    // Get all parties for mapping names
    const parties = await this.prisma.party.findMany({
      select: { id: true, partyName: true },
    });
    const partyMap = new Map(parties.map((p) => [p.id, p.partyName]));

    // Calculate DC, Process & Return quantities for each inward detail
    const summaryData = await Promise.all(
      inwards.map(async (inward) => {
        const inwardReturnTotalAssigned = new Set<string>();
        const detailsWithCalculations = await Promise.all(
          inward.details.map(async (detail) => {
            // Get DC data for this inward
            const dcDataForInward = await this.prisma.fabricDcHeader.findMany({
              where: {
                deleteFlg: 0,
                inwardNo: { equals: inward.grnNo },
              },
              include: {
                details: {
                  where: {
                    deleteFlg: 0,
                  },
                },
              },
            });

            // Try to match DC details by inwardDetailId first
            let processKgs = 0;
            let dcKgs = 0;

            dcDataForInward.forEach((dc) => {
              dc.details.forEach((dcDetail) => {
                // If inwardDetailId matches, add to this detail
                if (dcDetail.inwardDetailId === detail.id) {
                  processKgs += Number(dcDetail.processWeight || 0);
                  dcKgs += Number(dcDetail.dcWeight || 0);
                }
                // If inwardDetailId is null, try to match by fabric/color/dia/gsm
                else if (
                  !dcDetail.inwardDetailId &&
                  dcDetail.fabricId === detail.fabricId &&
                  dcDetail.colorId === detail.colorId &&
                  dcDetail.diaId === detail.diaId &&
                  dcDetail.gsm === detail.gsm
                ) {
                  processKgs += Number(dcDetail.processWeight || 0);
                  dcKgs += Number(dcDetail.dcWeight || 0);
                }
              });
            });

            // Load all return details for this inward
            const returnDetailsForInward =
              await this.prisma.fabricReturnDetail.findMany({
                where: {
                  deleteFlg: 0,
                  header: {
                    inwardNo: { equals: inward.grnNo },
                    deleteFlg: 0,
                  },
                },
                include: { header: true },
              });

            // Match return details by inwardDetailId or fabric/color/dia/gsm
            let returnKgs = 0;
            returnDetailsForInward.forEach((rd) => {
              // If inwardDetailId matches, add to this detail
              if (rd.inwardDetailId === detail.id) {
                returnKgs += Number(rd.weight || 0);
              }
              // If inwardDetailId is null, try to match by fabric/color/dia/gsm
              else if (
                !rd.inwardDetailId &&
                rd.fabricId === detail.fabricId &&
                rd.colorId === detail.colorId &&
                rd.diaId === detail.diaId &&
                rd.gsm === detail.gsm
              ) {
                returnKgs += Number(rd.weight || 0);
              }
            });

            // If no match found and there's a total, assign it once
            if (returnKgs === 0) {
              const totalReturnKgsForInward = returnDetailsForInward.reduce(
                (sum, rd) => sum + Number(rd.weight || 0),
                0,
              );

              if (totalReturnKgsForInward > 0) {
                const inwardKey = inward.grnNo || '';
                if (!inwardReturnTotalAssigned.has(inwardKey)) {
                  inwardReturnTotalAssigned.add(inwardKey);
                  returnKgs = totalReturnKgsForInward;
                }
              }
            }

            const inwardKgs = Number(detail.weight || 0);
            const balanceKgs = inwardKgs - processKgs - returnKgs;

            return {
              id: detail.id,
              inwardNo: inward.grnNo,
              inwardDate: inward.grnDate,
              partyName: partyMap.get(inward.partyId as number) || '',
              pdcNo: inward.pdcNo || '',
              orderNo: inward.orderNo || '',
              fabric: detail.fabric?.masterName || '',
              dia: detail.dia?.masterName || '',
              color: detail.color?.masterName || '',
              inwardKgs: Number(inwardKgs.toFixed(3)),
              processKgs: Number(processKgs.toFixed(3)),
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

    // Group by inward detail ID to ensure distinct items
    const distinctData = Object.values(
      flattenedData.reduce((acc, item) => {
        if (!acc[item.id]) {
          acc[item.id] = item;
        }
        return acc;
      }, {} as Record<number, any>),
    );

    return {
      data: distinctData,
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
      processKgs: data.reduce(
        (acc, item) => acc + (Number(item.processKgs) || 0),
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
      processKgs: concernsData.reduce(
        (acc, concern) => acc + concern.totals.processKgs,
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
        { grnNo: { contains: search } },
        { pdcNo: { contains: search } },
        { orderNo: { contains: search } },
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

    // Get all parties for mapping names
    const parties = await this.prisma.party.findMany({
      select: { id: true, partyName: true },
    });
    const partyMap = new Map(parties.map((p) => [p.id, p.partyName]));

    // Calculate DC and Return quantities for each inward detail
    const summaryData = await Promise.all(
      inwards.map(async (inward) => {
        const inwardReturnTotalAssigned = new Set<string>();
        const detailsWithCalculations = await Promise.all(
          inward.details.map(async (detail) => {
            // Get DC data for this inward
            const dcDataForInward = await this.prisma.fabricDcHeader.findMany({
              where: {
                deleteFlg: 0,
                inwardNo: { equals: inward.grnNo },
              },
              include: {
                details: {
                  where: {
                    deleteFlg: 0,
                  },
                },
              },
            });

            // Try to match DC details by inwardDetailId first
            let processKgs = 0;
            let dcKgs = 0;

            dcDataForInward.forEach((dc) => {
              dc.details.forEach((dcDetail) => {
                // If inwardDetailId matches, add to this detail
                if (dcDetail.inwardDetailId === detail.id) {
                  processKgs += Number(dcDetail.processWeight || 0);
                  dcKgs += Number(dcDetail.dcWeight || 0);
                }
                // If inwardDetailId is null, try to match by fabric/color/dia/gsm
                else if (
                  !dcDetail.inwardDetailId &&
                  dcDetail.fabricId === detail.fabricId &&
                  dcDetail.colorId === detail.colorId &&
                  dcDetail.diaId === detail.diaId &&
                  dcDetail.gsm === detail.gsm
                ) {
                  processKgs += Number(dcDetail.processWeight || 0);
                  dcKgs += Number(dcDetail.dcWeight || 0);
                }
              });
            });

            // Load all return details for this inward
            const returnDetailsForInward =
              await this.prisma.fabricReturnDetail.findMany({
                where: {
                  deleteFlg: 0,
                  header: {
                    inwardNo: { equals: inward.grnNo },
                    deleteFlg: 0,
                  },
                },
                include: { header: true },
              });

            // Match return details by inwardDetailId or fabric/color/dia/gsm
            let returnKgs = 0;
            returnDetailsForInward.forEach((rd) => {
              // If inwardDetailId matches, add to this detail
              if (rd.inwardDetailId === detail.id) {
                returnKgs += Number(rd.weight || 0);
              }
              // If inwardDetailId is null, try to match by fabric/color/dia/gsm
              else if (
                !rd.inwardDetailId &&
                rd.fabricId === detail.fabricId &&
                rd.colorId === detail.colorId &&
                rd.diaId === detail.diaId &&
                rd.gsm === detail.gsm
              ) {
                returnKgs += Number(rd.weight || 0);
              }
            });

            // If no match found and there's a total, assign it once
            if (returnKgs === 0) {
              const totalReturnKgsForInward = returnDetailsForInward.reduce(
                (sum, rd) => sum + Number(rd.weight || 0),
                0,
              );

              if (totalReturnKgsForInward > 0) {
                const inwardKey = inward.grnNo || '';
                if (!inwardReturnTotalAssigned.has(inwardKey)) {
                  inwardReturnTotalAssigned.add(inwardKey);
                  returnKgs = totalReturnKgsForInward;
                }
              }
            }

            const inwardKgs = Number(detail.weight || 0);
            const balanceKgs = inwardKgs - processKgs - returnKgs;

            return {
              id: detail.id,
              inwardNo: inward.grnNo,
              inwardDate: inward.grnDate,
              partyName: partyMap.get(inward.partyId as number) || '',
              pdcNo: inward.pdcNo || '',
              orderNo: inward.orderNo || '',
              fabric: detail.fabric?.masterName || '',
              dia: detail.dia?.masterName || '',
              color: detail.color?.masterName || '',
              inwardKgs: Number(inwardKgs.toFixed(3)),
              processKgs: Number(processKgs.toFixed(3)),
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

    // Group by inward detail ID to ensure distinct items
    const distinctData = Object.values(
      flattenedData.reduce((acc, item) => {
        if (!acc[item.id]) {
          acc[item.id] = item;
        }
        return acc;
      }, {} as Record<number, any>),
    );

    return {
      data: distinctData,
      totals: this.calculateTotals(distinctData),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async getUnDcList(query: InwardSummaryQueryDto) {
    const summary = await this.getInwardSummary({ ...query, page: 1, limit: 10000 });
    const data = summary.data.filter((item) => Number(item.balanceKgs) > 0);
    return {
      data,
      totals: this.calculateTotals(data),
    };
  }

  async getUnBillList(query: InwardSummaryQueryDto) {
    const { fromDate, toDate, tenantId, search } = query;

    const where: any = {
      deleteFlg: 0,
      isNoNeedBill: 0,
    };

    if (tenantId) where.tenantId = Number(tenantId);
    if (fromDate && toDate) {
      where.dcDate = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    }

    if (search) {
      where.OR = [
        { dcNo: { contains: search } },
        { inwardNo: { contains: search } },
        { pdcNo: { contains: search } },
      ];
    }

    const [dcs, parties] = await Promise.all([
      this.prisma.fabricDcHeader.findMany({
        where,
        orderBy: { dcDate: "desc" },
        include: {
          details: {
            where: { deleteFlg: 0 },
            include: {
              fabric: { select: { masterName: true } },
              dia: { select: { masterName: true } },
              color: { select: { masterName: true } },
              uom: { select: { masterName: true } },
            },
          },
        },
      }),
      this.prisma.party.findMany({
        select: { id: true, partyName: true },
      }),
    ]);

    // Check if DC is used in Bill
    const dcsWithBillStatus = await Promise.all(
      dcs.map(async (dc) => {
        const consumedWeights = await this.prisma.fabricBillDetail.aggregate({
          where: {
            dcId: dc.id,
            deleteFlg: 0,
            header: { deleteFlg: 0 },
          },
          _sum: {
            weight: true,
          },
        });
        const totalBilledWeight = Number(consumedWeights._sum.weight || 0);
        const totalDcWeight = Number(dc.totalQty || 0);

        return {
          ...dc,
          isFullyBilled: totalBilledWeight >= totalDcWeight && totalDcWeight > 0,
        };
      }),
    );

    const partyMap = new Map(parties.map((p) => [p.id, p.partyName]));

    const flattenedData = dcsWithBillStatus
      .filter((dc) => !dc.isFullyBilled)
      .flatMap((dc) =>
        dc.details.map((detail) => ({
          id: detail.id,
          dcNo: dc.dcNo,
          dcDate: dc.dcDate,
          inwardNo: dc.inwardNo,
          partyName: partyMap.get(dc.partyId as number) || "",
          pdcNo: dc.pdcNo || "",
          fabric: detail.fabric?.masterName || "",
          dia: detail.dia?.masterName || "",
          color: detail.color?.masterName || "",
          gsm: detail.gsm || "",
          processWeight: Number(detail.processWeight || 0),
          dcWeight: Number(detail.dcWeight || 0),
          rolls: Number(detail.rolls || 0),
          uom: detail.uom?.masterName || "",
        })),
      );

    return {
      data: flattenedData,
      totals: {
        processWeight: flattenedData.reduce(
          (acc, item) => acc + item.processWeight,
          0,
        ),
        dcWeight: flattenedData.reduce((acc, item) => acc + item.dcWeight, 0),
        rolls: flattenedData.reduce((acc, item) => acc + item.rolls, 0),
      },
    };
  }
}
