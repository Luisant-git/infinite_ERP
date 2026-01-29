import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MenuPermissionService } from './menu-permission.service';

@ApiTags('Menu Permission Management')
@ApiBearerAuth()
@Controller('menu-permission')
export class MenuPermissionController {
  constructor(private menuPermissionService: MenuPermissionService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users for permission assignment' })
  async getUsers() {
    return this.menuPermissionService.getUsers();
  }

  @Get('menus')
  @ApiOperation({ summary: 'Get all available menus' })
  async getMenus() {
    return this.menuPermissionService.getMenus();
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user menu permissions' })
  async getUserPermissions(@Param('userId') userId: string) {
    return this.menuPermissionService.getUserPermissions(parseInt(userId));
  }

  @Post()
  @ApiOperation({ summary: 'Create or update menu permissions' })
  async upsertPermissions(@Body() permissions: any[]) {
    return this.menuPermissionService.upsertPermissions(permissions);
  }
}