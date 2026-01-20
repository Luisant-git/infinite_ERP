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
    const { username, password, adminUser, dcClose, isActive } = registerDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        adminUser: adminUser || false,
        dcClose: dcClose || false,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    
    // Create default company and tenant
    const defaultCompany = await this.prisma.company.create({
      data: { name: 'Default Company' }
    });
    
    const defaultTenant = await this.prisma.tenant.create({
      data: {
        companyId: defaultCompany.id,
        financialYear: '2025-2026'
      }
    });
    
    // Link user to tenant
    await this.prisma.userTenant.create({
      data: {
        userId: user.id,
        tenantId: defaultTenant.id
      }
    });
    
    return { id: user.id, username: user.username };
  }

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        userTenants: {
          include: {
            tenant: {
              include: {
                company: true
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

    return {
      access_token: token,
      user: { id: user.id, username: user.username },
      tenants: user.userTenants.map(ut => ({
        id: ut.tenant.id,
        company: ut.tenant.company.name,
        financialYear: ut.tenant.financialYear
      }))
    };
  }

  async getCompanies() {
    return this.prisma.company.findMany({
      include: {
        tenants: true
      }
    });
  }

  async getTenants() {
    return this.prisma.tenant.findMany({
      include: {
        company: true
      }
    });
  }

  async createTenant(companyName: string, financialYear: string) {
    let company = await this.prisma.company.findFirst({
      where: { name: companyName }
    });

    if (!company) {
      company = await this.prisma.company.create({
        data: { name: companyName }
      });
    }

    return this.prisma.tenant.create({
      data: {
        companyId: company.id,
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
        createdAt: true
      }
    });
  }

  async updateUser(id: number, updateData: any) {
    const { adminUser, dcClose, isActive } = updateData;
    return this.prisma.user.update({
      where: { id },
      data: {
        adminUser,
        dcClose,
        isActive
      },
      select: {
        id: true,
        username: true,
        adminUser: true,
        dcClose: true,
        isActive: true
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