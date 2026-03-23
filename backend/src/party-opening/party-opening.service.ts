import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartyOpeningDto } from './dto/create-party-opening.dto';
import { UpdatePartyOpeningDto } from './dto/update-party-opening.dto';

@Injectable()
export class PartyOpeningService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: number) {
    return this.prisma.partyOpening.findMany({
      where: {
        tenantId,
        isDeleted: false,
      },
      include: {
        party: {
          select: {
            id: true,
            partyName: true,
            partyCode: true,
          },
        },
      },
      orderBy: {
        billDate: 'desc',
      },
    });
  }

  async findOne(id: number, tenantId: number) {
    return this.prisma.partyOpening.findFirst({
      where: {
        id,
        tenantId,
        isDeleted: false,
      },
      include: {
        party: true,
      },
    });
  }

  async create(createDto: CreatePartyOpeningDto, tenantId: number) {
    return this.prisma.partyOpening.create({
      data: {
        ...createDto,
        tenantId,
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

  async update(id: number, updateDto: UpdatePartyOpeningDto, tenantId: number) {
    return this.prisma.partyOpening.update({
      where: {
        id,
      },
      data: updateDto,
    });
  }

  async remove(id: number, tenantId: number) {
    return this.prisma.partyOpening.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
      },
    });
  }
}
