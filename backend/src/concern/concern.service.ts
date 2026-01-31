import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConcernService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const where: Prisma.ConcernWhereInput = {
      isDeleted: false,
      ...(search && {
        OR: [
          { partyName: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { vendorCode: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { mobileNo: { contains: search } },
          { gstNo: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { district: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { state: { contains: search, mode: Prisma.QueryMode.insensitive } }
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

  async create(data: any) {
    const { contacts, ...concernData } = data;
    
    const trimmedPartyName = concernData.partyName?.trim();
    const existingConcern = await this.prisma.concern.findFirst({
      where: { partyName: trimmedPartyName, isDeleted: false }
    });
    if (existingConcern) {
      throw new Error('Concern name already exists');
    }
    
    const processedConcernData = {
      ...concernData,
      partyName: trimmedPartyName,
      vendorCode: concernData.vendorCode?.substring(0, 50),
      address1: concernData.address1?.substring(0, 50),
      address2: concernData.address2?.substring(0, 50),
      address3: concernData.address3?.substring(0, 50),
      address4: concernData.address4?.substring(0, 50),
      pincode: concernData.pincode?.substring(0, 8),
      district: concernData.district?.substring(0, 50),
      state: concernData.state?.substring(0, 50),
      mobileNo: concernData.mobileNo?.substring(0, 10),
      phoneNo: concernData.phoneNo?.substring(0, 10),
      email: concernData.email?.toLowerCase().substring(0, 100),
      panNo: concernData.panNo?.substring(0, 20),
      tallyAccName: concernData.tallyAccName?.substring(0, 50),
      gstNo: concernData.gstNo?.substring(0, 50),
      accountNo: concernData.accountNo?.substring(0, 30),
      bank: concernData.bank?.substring(0, 30),
      ifscCode: concernData.ifscCode?.substring(0, 12),
      branch: concernData.branch?.substring(0, 30)
    };
    
    const processedContacts = contacts?.map(contact => ({
      name: contact.name?.substring(0, 50),
      mobileNo: contact.mobileNo?.substring(0, 10),
      email: contact.email?.toLowerCase().substring(0, 100),
      whatsappRequired: contact.whatsappRequired ? 1 : 0,
      mailRequired: contact.mailRequired ? 1 : 0
    }));
    
    const concern = await this.prisma.concern.create({
      data: {
        ...processedConcernData,
        contacts: processedContacts && processedContacts.length > 0 ? {
          create: processedContacts
        } : undefined
      },
      include: { contacts: true }
    });

    const currentYear = new Date().getFullYear();
    const financialYear = `${currentYear}-${currentYear + 1}`;
    
    await this.prisma.tenant.create({
      data: {
        concernId: concern.id,
        financialYear
      }
    });

    return concern;
  }

  async update(id: number, data: any) {
    const { contacts, ...concernData } = data;
    
    if (concernData.partyName) {
      const trimmedPartyName = concernData.partyName.trim();
      const existingConcern = await this.prisma.concern.findFirst({
        where: { partyName: trimmedPartyName, isDeleted: false, NOT: { id } }
      });
      if (existingConcern) {
        throw new Error('Concern name already exists');
      }
      concernData.partyName = trimmedPartyName;
    }
    
    await this.prisma.concernContact.deleteMany({
      where: { concernId: id }
    });

    const processedContacts = contacts?.map(contact => ({
      name: contact.name?.substring(0, 50),
      mobileNo: contact.mobileNo?.substring(0, 10),
      email: contact.email?.toLowerCase().substring(0, 100),
      whatsappRequired: contact.whatsappRequired ? 1 : 0,
      mailRequired: contact.mailRequired ? 1 : 0
    }));

    return this.prisma.concern.update({
      where: { id },
      data: {
        ...concernData,
        contacts: processedContacts && processedContacts.length > 0 ? {
          create: processedContacts
        } : undefined
      },
      include: { contacts: true }
    });
  }

  async delete(id: number, userId: number) {
    return this.prisma.concern.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId
      }
    });
  }
}