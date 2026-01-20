import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PartyService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: number, search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const where: Prisma.PartyWhereInput = {
      tenantId,
      isDeleted: false,
      ...(search && {
        OR: [
          { partyName: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { partyCode: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { mobileNo: { contains: search } },
          { gstNo: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } }
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

  async create(tenantId: number, data: any) {
    const { contacts, partyTypeIds, ...partyData } = data;
    
    // Convert boolean to int for contacts
    const processedContacts = contacts?.map(contact => ({
      ...contact,
      whatsappRequired: contact.whatsappRequired ? 1 : 0,
      mailRequired: contact.mailRequired ? 1 : 0
    }));
    
    return this.prisma.party.create({
      data: {
        ...partyData,
        tenantId,
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

  async update(id: number, tenantId: number, data: any) {
    const { contacts, partyTypeIds, ...partyData } = data;
    
    await this.prisma.partyContact.deleteMany({
      where: { partyId: id }
    });

    await this.prisma.partyPartyType.deleteMany({
      where: { partyId: id }
    });

    // Convert boolean to int for contacts
    const processedContacts = contacts?.map(contact => ({
      ...contact,
      whatsappRequired: contact.whatsappRequired ? 1 : 0,
      mailRequired: contact.mailRequired ? 1 : 0
    }));

    return this.prisma.party.update({
      where: { id, tenantId },
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

  async delete(id: number, tenantId: number, userId: number) {
    return this.prisma.party.update({
      where: { id, tenantId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId
      }
    });
  }
}