import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuPermissionService {
  constructor(private prisma: PrismaService) {}

  async getUsers() {
    return this.prisma.user.findMany({
      where: { isDeleted: false },
      select: { id: true, username: true, adminUser: true }
    });
  }

  async getMenus() {
    return [
      { name: 'Dashboard', key: 'dashboard' },
      { name: 'Party Master', key: 'party_master' },
      { name: 'Party Type Master', key: 'party_type_master' }
    ];
  }

  async getUserPermissions(userId: number) {
    return this.prisma.menuPermission.findMany({
      where: { userId },
      select: {
        menuName: true,
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true
      }
    });
  }

  async upsertPermissions(permissions: any[]) {
    const results: any[] = [];
    
    for (const permission of permissions) {
      const result = await this.prisma.menuPermission.upsert({
        where: {
          userId_menuName: {
            userId: permission.userId,
            menuName: permission.menuName
          }
        },
        update: {
          canView: permission.canView,
          canAdd: permission.canAdd,
          canEdit: permission.canEdit,
          canDelete: permission.canDelete
        },
        create: {
          userId: permission.userId,
          menuName: permission.menuName,
          canView: permission.canView,
          canAdd: permission.canAdd,
          canEdit: permission.canEdit,
          canDelete: permission.canDelete
        }
      });
      results.push(result);
    }
    
    return results;
  }
}