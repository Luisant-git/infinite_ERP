import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RateQuotationService {
  constructor(private prisma: PrismaService) {}

  async getNextQuotNo(tenantId: number) {
    const lastQuot = await this.prisma.rateQuotationHeader.findFirst({
      where: { tenantId, deleteFlg: 0 },
      orderBy: { sortOrder: 'desc' }
    });

    const nextNo = lastQuot ? (lastQuot.sortOrder || 0) + 1 : 1;
    return { quotNo: nextNo.toString().padStart(10, '0') };
  }

  async findAll(tenantId: number, search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const where: any = {
      tenantId,
      deleteFlg: 0,
      ...(search && {
        OR: [
          { quotNo: { contains: search } }
        ]
      })
    };

    const [quotations, total] = await Promise.all([
      this.prisma.rateQuotationHeader.findMany({
        where,
        include: {
          details: {
            include: {
              process: true
            }
          },
          party: true
        },
        orderBy: { createdDate: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.rateQuotationHeader.count({ where })
    ]);

    return {
      data: quotations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async create(tenantId: number, concernId: number, data: any) {
    const { details, ...headerData } = data;
    
    const sortOrder = parseInt(headerData.quotNo);
    
    return this.prisma.rateQuotationHeader.create({
      data: {
        ...headerData,
        tenantId,
        concernId,
        sortOrder,
        details: {
          create: details?.map(d => ({
            processId: d.processId,
            rate: d.rate || 0,
            confirmRate: d.confirmRate || 0,
            remarks: d.remarks
          })) || []
        }
      },
      include: { details: true }
    });
  }

  async update(id: number, data: any) {
    const { details, id: _, party, createdDate, modifiedDate, deletedDate, sortOrder, tenantId, concernId, ...headerData } = data;
    
    await this.prisma.rateQuotationDetail.deleteMany({
      where: { headerId: id }
    });

    return this.prisma.rateQuotationHeader.update({
      where: { id },
      data: {
        ...headerData,
        details: {
          create: details?.map(d => ({
            processId: d.processId,
            rate: d.rate || 0,
            confirmRate: d.confirmRate || 0,
            remarks: d.remarks
          })) || []
        }
      },
      include: { details: true }
    });
  }

  async delete(id: number, userId: string) {
    return this.prisma.rateQuotationHeader.update({
      where: { id },
      data: {
        deleteFlg: 1,
        deletedBy: userId,
        deletedDate: new Date()
      }
    });
  }
}
