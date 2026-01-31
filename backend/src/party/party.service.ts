import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PartyService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const where: Prisma.PartyWhereInput = {
      isDeleted: false,
      ...(search && {
        OR: [
          { partyName: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { partyCode: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { mobileNo: { contains: search } },
          { gstNo: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { district: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { state: { contains: search, mode: Prisma.QueryMode.insensitive } }
        ]
      })
    };

    const [parties, total] = await Promise.all([
      this.prisma.party.findMany({
        where,
        include: { 
          contacts: true,
          partyTypes: {
            include: {
              partyType: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.party.count({ where })
    ]);

    return {
      data: parties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async create(data: any) {
    const { contacts, partyTypeIds, ...partyData } = data;
    
    const trimmedPartyName = partyData.partyName?.trim();
    const existingParty = await this.prisma.party.findFirst({
      where: { partyName: trimmedPartyName, isDeleted: false }
    });
    if (existingParty) {
      throw new Error('Party name already exists');
    }
    
    const processedContacts = contacts?.map(contact => ({
      ...contact,
      whatsappRequired: contact.whatsappRequired ? 1 : 0,
      mailRequired: contact.mailRequired ? 1 : 0
    }));
    
    return this.prisma.party.create({
      data: {
        ...partyData,
        partyName: trimmedPartyName,
        contacts: processedContacts ? {
          create: processedContacts
        } : undefined,
        partyTypes: partyTypeIds ? {
          create: partyTypeIds.map(typeId => ({ partyTypeId: typeId }))
        } : undefined
      },
      include: { 
        contacts: true,
        partyTypes: {
          include: {
            partyType: true
          }
        }
      }
    });
  }

  async update(id: number, data: any) {
    const { contacts, partyTypeIds, ...partyData } = data;
    
    if (partyData.partyName) {
      const trimmedPartyName = partyData.partyName.trim();
      const existingParty = await this.prisma.party.findFirst({
        where: { partyName: trimmedPartyName, isDeleted: false, NOT: { id } }
      });
      if (existingParty) {
        throw new Error('Party name already exists');
      }
      partyData.partyName = trimmedPartyName;
    }
    
    await this.prisma.partyContact.deleteMany({
      where: { partyId: id }
    });

    await this.prisma.partyPartyType.deleteMany({
      where: { partyId: id }
    });

    const processedContacts = contacts?.map(contact => ({
      ...contact,
      whatsappRequired: contact.whatsappRequired ? 1 : 0,
      mailRequired: contact.mailRequired ? 1 : 0
    }));

    return this.prisma.party.update({
      where: { id },
      data: {
        ...partyData,
        contacts: processedContacts ? {
          create: processedContacts
        } : undefined,
        partyTypes: partyTypeIds ? {
          create: partyTypeIds.map(typeId => ({ partyTypeId: typeId }))
        } : undefined
      },
      include: { 
        contacts: true,
        partyTypes: {
          include: {
            partyType: true
          }
        }
      }
    });
  }

  async delete(id: number, userId: number) {
    return this.prisma.party.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId
      }
    });
  }
}