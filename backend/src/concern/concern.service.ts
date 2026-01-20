import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConcernService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: number, search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const where: Prisma.ConcernWhereInput = {
      tenantId,
      isDeleted: false,
      ...(search && {
        OR: [
          { partyName: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { vendorCode: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { mobileNo: { contains: search } },
          { gstNo: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } }
        ]
      })
    };

    const [concerns, total] = await Promise.all([
      this.prisma.concern.findMany({
        where,
        include: { contacts: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.concern.count({ where })
    ]);

    return {
      data: concerns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async create(tenantId: number, data: any) {
    const { contacts, ...concernData } = data;
    
    // Truncate fields to match database constraints
    const processedConcernData = {
      ...concernData,
      partyName: concernData.partyName?.substring(0, 50),
      vendorCode: concernData.vendorCode?.substring(0, 50),
      address1: concernData.address1?.substring(0, 50),
      address2: concernData.address2?.substring(0, 50),
      address3: concernData.address3?.substring(0, 50),
      address4: concernData.address4?.substring(0, 50),
      pincode: concernData.pincode?.substring(0, 8),
      district: concernData.district?.substring(0, 50),
      mobileNo: concernData.mobileNo?.substring(0, 10),
      phoneNo: concernData.phoneNo?.substring(0, 10),
      email: concernData.email?.substring(0, 20),
      panNo: concernData.panNo?.substring(0, 20),
      tallyAccName: concernData.tallyAccName?.substring(0, 50),
      gstNo: concernData.gstNo?.substring(0, 50),
      accountNo: concernData.accountNo?.substring(0, 30),
      bank: concernData.bank?.substring(0, 30),
      ifscCode: concernData.ifscCode?.substring(0, 12),
      branch: concernData.branch?.substring(0, 30)
    };
    
    // Convert boolean to int for contacts
    const processedContacts = contacts?.map(contact => ({
      name: contact.name?.substring(0, 50),
      mobileNo: contact.mobileNo?.substring(0, 10),
      email: contact.email?.substring(0, 12),
      whatsappRequired: contact.whatsappRequired ? 1 : 0,
      mailRequired: contact.mailRequired ? 1 : 0
    }));
    
    return this.prisma.concern.create({
      data: {
        ...processedConcernData,
        tenantId,
        contacts: processedContacts ? {
          create: processedContacts
        } : undefined
      },
      include: { contacts: true }
    });
  }

  async update(id: number, tenantId: number, data: any) {
    const { contacts, ...concernData } = data;
    
    await this.prisma.concernContact.deleteMany({
      where: { concernId: id }
    });

    // Convert boolean to int for contacts
    const processedContacts = contacts?.map(contact => ({
      name: contact.name?.substring(0, 50),
      mobileNo: contact.mobileNo?.substring(0, 10),
      email: contact.email?.substring(0, 12),
      whatsappRequired: contact.whatsappRequired ? 1 : 0,
      mailRequired: contact.mailRequired ? 1 : 0
    }));

    return this.prisma.concern.update({
      where: { id, tenantId },
      data: {
        ...concernData,
        contacts: processedContacts ? {
          create: processedContacts
        } : undefined
      },
      include: { contacts: true }
    });
  }

  async delete(id: number, tenantId: number, userId: number) {
    return this.prisma.concern.update({
      where: { id, tenantId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId
      }
    });
  }
}