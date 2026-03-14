import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartyScreenRateDto } from './dto/create-party-screen-rate.dto';
import { UpdatePartyScreenRateDto } from './dto/update-party-screen-rate.dto';

@Injectable()
export class PartyScreenRateService {
  constructor(private prisma: PrismaService) {}

  async create(createPartyScreenRateDto: CreatePartyScreenRateDto) {
    return this.prisma.partyScreenRate.create({
      data: createPartyScreenRateDto,
      include: {
        party: {
          select: {
            id: true,
            partyName: true,
          },
        },
      },
    });
  }

  async findAll(search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const where = {
      isDeleted: false,
      ...(search && {
        party: {
          partyName: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.partyScreenRate.findMany({
        where,
        include: {
          party: {
            select: {
              id: true,
              partyName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.partyScreenRate.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const partyScreenRate = await this.prisma.partyScreenRate.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        party: {
          select: {
            id: true,
            partyName: true,
          },
        },
      },
    });

    if (!partyScreenRate) {
      throw new NotFoundException(`Party Screen Rate with ID ${id} not found`);
    }

    return partyScreenRate;
  }

  async findByParty(partyId: number) {
    return this.prisma.partyScreenRate.findFirst({
      where: {
        partyId,
        isDeleted: false,
      },
      include: {
        party: {
          select: {
            id: true,
            partyName: true,
          },
        },
      },
    });
  }

  async update(id: number, updatePartyScreenRateDto: UpdatePartyScreenRateDto) {
    const existingRecord = await this.findOne(id);

    return this.prisma.partyScreenRate.update({
      where: { id },
      data: updatePartyScreenRateDto,
      include: {
        party: {
          select: {
            id: true,
            partyName: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    const existingRecord = await this.findOne(id);

    return this.prisma.partyScreenRate.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}