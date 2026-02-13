import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RateQuotationService {
  constructor(private prisma: PrismaService) {}

  async getNextQuotNo(tenantId: number) {
    const allQuots = await this.prisma.rateQuotationHeader.findMany({
      where: { tenantId, deleteFlg: 0 },
      orderBy: { createdDate: 'desc' }
    });

    if (allQuots.length === 0) {
      return { quotNo: 'Q/1' };
    }

    // Get the last quotation number
    const lastQuotNo = allQuots[0].quotNo;
    
    // Extract the numeric part from the end
    const match = lastQuotNo.match(/(\d+)$/);
    
    if (match) {
      const lastNumber = parseInt(match[1]);
      const prefix = lastQuotNo.substring(0, lastQuotNo.length - match[1].length);
      const nextNumber = lastNumber + 1;
      const nextQuotNo = `${prefix}${nextNumber}`;
      
      // Ensure it doesn't exceed 10 characters
      if (nextQuotNo.length > 10) {
        return { quotNo: lastQuotNo }; // Return same if would exceed limit
      }
      
      return { quotNo: nextQuotNo };
    }
    
    // If no number found, append 1
    const nextQuotNo = `${lastQuotNo}1`;
    return { quotNo: nextQuotNo.substring(0, 10) }; // Truncate to 10 chars
  }

  async findAll(tenantId: number | null, search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const where: any = {
      deleteFlg: 0,
      ...(tenantId && { tenantId }),
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
          party: true,
          concern: true
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

  async create(tenantId: number, concernId: number | null, data: any) {
    const { details, ...headerData } = data;
    
    // Validate concernId is provided
    if (!concernId) {
      throw new BadRequestException('Concern ID is required. Please login again to continue.');
    }
    
    // Extract number from any format (Q/1, AMP TEST 3, HVACBAS////10, etc.)
    const quotNoMatch = headerData.quotNo.match(/(\d+)$/);
    const sortOrder = quotNoMatch ? parseInt(quotNoMatch[1]) : 1;
    
    // Check for duplicate quotNo within the same tenant
    const existing = await this.prisma.rateQuotationHeader.findFirst({
      where: {
        tenantId,
        quotNo: headerData.quotNo,
        deleteFlg: 0
      }
    });

    if (existing) {
      throw new BadRequestException('Quotation number already exists for this tenant');
    }
    
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
    const { details, id: _, party, concern, createdDate, modifiedDate, deletedDate, sortOrder, tenantId, concernId, ...headerData } = data;
    
    // Validate concernId is provided
    if (!concernId) {
      throw new BadRequestException('Concern ID is required. Please login again to continue.');
    }
    
    await this.prisma.rateQuotationDetail.deleteMany({
      where: { headerId: id }
    });

    return this.prisma.rateQuotationHeader.update({
      where: { id },
      data: {
        ...headerData,
        concernId,
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
