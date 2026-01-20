import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartyTypeDto } from './dto/create-party-type.dto';
import { UpdatePartyTypeDto } from './dto/update-party-type.dto';

@Injectable()
export class PartyTypeService {
  constructor(private prisma: PrismaService) {}

  async create(createPartyTypeDto: CreatePartyTypeDto) {
    console.log('Creating party type with data:', createPartyTypeDto);
    console.log('tenantId:', createPartyTypeDto.tenantId);
    
    return this.prisma.partyType.create({
      data: createPartyTypeDto,
    });
  }

  async findAll(tenantId: number, search?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = {
      isDeleted: false,
      tenantId,
      ...(search && {
        partyTypeName: { contains: search, mode: 'insensitive' as const }
      })
    };

    const [data, total] = await Promise.all([
      this.prisma.partyType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.partyType.count({ where })
    ]);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async findOne(id: number) {
    return this.prisma.partyType.findUnique({
      where: { id }
    });
  }

  async update(id: number, updatePartyTypeDto: UpdatePartyTypeDto) {
    return this.prisma.partyType.update({
      where: { id },
      data: updatePartyTypeDto,
    });
  }

  async remove(id: number, userId: number) {
    return this.prisma.partyType.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId
      }
    });
  }
}