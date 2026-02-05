import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';

@Injectable()
export class DesignService {
  constructor(private prisma: PrismaService) {}

  async create(createDesignDto: CreateDesignDto) {
    const normalizedDesignNo = createDesignDto.designNo.replace(/\s+/g, '').toLowerCase();
    const normalizedDesignName = createDesignDto.designName.trim().replace(/\s+/g, '').toLowerCase();
    const allDesigns = await this.prisma.design.findMany({
      where: { isDeleted: false }
    });
    
    const existingNo = allDesigns.find(d => 
      d.designNo.replace(/\s+/g, '').toLowerCase() === normalizedDesignNo
    );
    if (existingNo) {
      throw new Error('Design number already exists');
    }

    const existingName = allDesigns.find(d => 
      d.designName.trim().replace(/\s+/g, '').toLowerCase() === normalizedDesignName
    );
    if (existingName) {
      throw new Error('Design name already exists');
    }

    return this.prisma.design.create({
      data: {
        ...createDesignDto,
        designName: createDesignDto.designName.trim(),
        date: createDesignDto.date ? new Date(createDesignDto.date) : new Date(),
      },
      include: { customer: true }
    });
  }

  async findAll(search?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = {
      isDeleted: false,
      ...(search && {
        OR: [
          { designNo: { contains: search, mode: 'insensitive' as const } },
          { designName: { contains: search, mode: 'insensitive' as const } },
          { refNo: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    };

    const [data, total] = await Promise.all([
      this.prisma.design.findMany({
        where,
        include: { customer: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.design.count({ where })
    ]);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async findOne(id: number) {
    return this.prisma.design.findUnique({
      where: { id, isDeleted: false },
      include: { customer: true }
    });
  }

  async update(id: number, updateDesignDto: UpdateDesignDto) {
    const { id: _, customer, createdAt, updatedAt, deletedAt, deletedBy, isDeleted, ...cleanData } = updateDesignDto as any;
    
    const allDesigns = await this.prisma.design.findMany({
      where: { isDeleted: false, NOT: { id } }
    });

    if (cleanData.designNo) {
      const normalizedDesignNo = cleanData.designNo.replace(/\s+/g, '').toLowerCase();
      const existingNo = allDesigns.find(d => 
        d.designNo.replace(/\s+/g, '').toLowerCase() === normalizedDesignNo
      );
      if (existingNo) {
        throw new Error('Design number already exists');
      }
    }

    if (cleanData.designName) {
      const normalizedDesignName = cleanData.designName.trim().replace(/\s+/g, '').toLowerCase();
      const existingName = allDesigns.find(d => 
        d.designName.trim().replace(/\s+/g, '').toLowerCase() === normalizedDesignName
      );
      if (existingName) {
        throw new Error('Design name already exists');
      }
      cleanData.designName = cleanData.designName.trim();
    }

    return this.prisma.design.update({
      where: { id },
      data: {
        ...cleanData,
        date: cleanData.date ? new Date(cleanData.date) : undefined,
      },
      include: { customer: true }
    });
  }

  async remove(id: number, userId: number) {
    return this.prisma.design.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId
      }
    });
  }
}
