import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(registerDto: any) {
    const { username, password, adminUser, dcClose, isActive, concernIds } = registerDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userData: any = {
      username,
      password: hashedPassword,
      adminUser: adminUser || false,
      dcClose: dcClose || false,
      isActive: isActive !== undefined ? isActive : true,
      concernIds: concernIds || []
    };
    
    const user = await this.prisma.user.create({
      data: userData
    });
    
    return { 
      id: user.id, 
      username: user.username, 
      adminUser: user.adminUser,
      dcClose: user.dcClose,
      isActive: user.isActive,
      concernIds: user.concernIds,
      createdAt: user.createdAt
    };
  }

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        userTenants: {
          include: {
            tenant: {
              include: {
                concern: true
              }
            }
          }
        }
      }
    });

    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const payload = { sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);

    if (user.concernIds.length > 0) {
      const tenant = await this.prisma.tenant.findFirst({
        where: { concernId: { in: user.concernIds } },
        include: { concern: true }
      });
      
      return {
        access_token: token,
        user: { 
          id: user.id, 
          username: user.username,
          adminUser: user.adminUser,
          dcClose: user.dcClose,
          isActive: user.isActive,
          concernIds: user.concernIds
        },
        autoSelectTenant: tenant ? {
          id: tenant.id,
          company: tenant.concern.partyName,
          financialYear: tenant.financialYear
        } : null
      };
    }

    return {
      access_token: token,
      user: { 
        id: user.id, 
        username: user.username,
        adminUser: user.adminUser,
        dcClose: user.dcClose,
        isActive: user.isActive,
        concernIds: user.concernIds
      },
      tenants: user.userTenants.map(ut => ({
        id: ut.tenant.id,
        company: ut.tenant.concern.partyName,
        financialYear: ut.tenant.financialYear
      }))
    };
  }

  async getCompanies() {
    return this.prisma.concern.findMany({
      include: {
        tenants: true
      }
    });
  }

  async getTenants() {
    return this.prisma.tenant.findMany({
      include: {
        concern: true
      }
    });
  }

  async createTenant(companyName: string, financialYear: string) {
    let concern = await this.prisma.concern.findFirst({
      where: { partyName: companyName }
    });

    if (!concern) {
      concern = await this.prisma.concern.create({
        data: { 
          partyName: companyName,
          gstNo: 'TEMP_GST_' + Date.now()
        }
      });
    }

    return this.prisma.tenant.create({
      data: {
        concernId: concern.id,
        financialYear
      }
    });
  }

  async getUsers(search?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = {
      isDeleted: false,
      ...(search && {
        username: { contains: search, mode: 'insensitive' as const }
      })
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          adminUser: true,
          dcClose: true,
          isActive: true,
          concernIds: true,
          createdAt: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id, isDeleted: false },
      select: {
        id: true,
        username: true,
        adminUser: true,
        dcClose: true,
        isActive: true,
        concernIds: true,
        createdAt: true
      }
    });
  }

  async updateUser(id: number, updateData: any) {
    const { adminUser, dcClose, isActive, concernIds } = updateData;
    return this.prisma.user.update({
      where: { id },
      data: {
        adminUser,
        dcClose,
        isActive,
        concernIds
      },
      select: {
        id: true,
        username: true,
        adminUser: true,
        dcClose: true,
        isActive: true,
        concernIds: true
      }
    });
  }

  async deleteUser(id: number, deletedBy: number) {
    return this.prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy
      }
    });
  }
}