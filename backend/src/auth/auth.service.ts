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
    const { username, password, adminUser, dcClose, isActive, concernIds, canAdd, canEdit, canDelete } = registerDto;
    const trimmedUsername = username.trim();
    const normalizedUsername = trimmedUsername.replace(/\s+/g, '').toLowerCase();
    
    const existingUser = await this.prisma.user.findFirst({
      where: { username: { not: '' } }
    });
    
    if (existingUser) {
      const allUsers = await this.prisma.user.findMany();
      const duplicate = allUsers.find(u => 
        u.username.replace(/\s+/g, '').toLowerCase() === normalizedUsername
      );
      if (duplicate) {
        throw new UnauthorizedException('Username already exists');
      }
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userData: any = {
      username: trimmedUsername,
      password: hashedPassword,
      adminUser: adminUser || false,
      dcClose: dcClose || false,
      isActive: isActive !== undefined ? isActive : true,
      concernIds: concernIds || [],
      canAdd: canAdd || false,
      canEdit: canEdit || false,
      canDelete: canDelete || false
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
      canAdd: user.canAdd,
      canEdit: user.canEdit,
      canDelete: user.canDelete,
      createdAt: user.createdAt
    };
  }

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.trim() },
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

    const payload = { 
      sub: user.id, 
      username: user.username,
      adminUser: user.adminUser,
      dcClose: user.dcClose,
      isActive: user.isActive,
      concernIds: user.concernIds,
      canAdd: user.canAdd,
      canEdit: user.canEdit,
      canDelete: user.canDelete
    };
    const token = this.jwtService.sign(payload);

    // Auto-select for users with exactly one concern
    if (user.concernIds.length === 1) {
      const tenant = await this.prisma.tenant.findFirst({
        where: { 
          concernId: { in: user.concernIds },
          concern: { isDeleted: false }
        },
        include: { concern: true }
      });
      
      return {
        access_token: token,
        autoSelectTenant: tenant ? {
          id: tenant.id,
          company: tenant.concern.partyName,
          financialYear: tenant.financialYear
        } : null
      };
    }

    // For users with multiple concerns or admin with concerns, return available tenants
    const availableTenants = await this.prisma.tenant.findMany({
      where: {
        ...(user.concernIds.length === 0 ? {} : { concernId: { in: user.concernIds } }),
        concern: { isDeleted: false }
      },
      include: { concern: true }
    });

    return {
      access_token: token,
      tenants: availableTenants.map(tenant => ({
        id: tenant.id,
        company: tenant.concern.partyName,
        financialYear: tenant.financialYear
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
          vendorCode: 'VC_' + Date.now()
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
          canAdd: true,
          canEdit: true,
          canDelete: true,
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
        canAdd: true,
        canEdit: true,
        canDelete: true,
        createdAt: true
      }
    });
  }

  async updateUser(id: number, updateData: any) {
    const { username, password, adminUser, dcClose, isActive, concernIds, canAdd, canEdit, canDelete } = updateData;
    
    const updateFields: any = {
      adminUser,
      dcClose,
      isActive,
      concernIds,
      canAdd,
      canEdit,
      canDelete
    };
    
    if (username) {
      const trimmedUsername = username.trim();
      const existingUser = await this.prisma.user.findFirst({
        where: { username: trimmedUsername, isDeleted: false, NOT: { id } }
      });
      if (existingUser) {
        throw new UnauthorizedException('Username already exists');
      }
      updateFields.username = trimmedUsername;
    }
    
    if (password && password !== '********') {
      updateFields.password = await bcrypt.hash(password, 10);
    }
    
    return this.prisma.user.update({
      where: { id },
      data: updateFields,
      select: {
        id: true,
        username: true,
        adminUser: true,
        dcClose: true,
        isActive: true,
        concernIds: true,
        canAdd: true,
        canEdit: true,
        canDelete: true
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

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return {
        id: payload.sub,
        username: payload.username,
        adminUser: payload.adminUser,
        dcClose: payload.dcClose,
        isActive: payload.isActive,
        concernIds: payload.concernIds,
        canAdd: payload.canAdd,
        canEdit: payload.canEdit,
        canDelete: payload.canDelete
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}