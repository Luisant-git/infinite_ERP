import { Controller, Get, Post, Put, Delete, Body, Param, Query, Headers } from '@nestjs/common';
import { FabricDcService } from './fabric-dc.service';
import * as jwt from 'jsonwebtoken';

@Controller('fabric-dc')
export class FabricDcController {
  constructor(private readonly fabricDcService: FabricDcService) {}

  private getUserFromToken(authorization: string): any {
    if (!authorization) return {};
    const token = authorization.replace('Bearer ', '');
    try {
      return jwt.decode(token) || {};
    } catch {
      return {};
    }
  }

  @Get('next-dc-no')
  async getNextDcNo(@Headers('tenant-id') tenantId: string) {
    return this.fabricDcService.getNextDcNo(parseInt(tenantId));
  }

  @Get()
  async findAll(
    @Headers('tenant-id') tenantId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.fabricDcService.findAll(
      parseInt(tenantId),
      search,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10
    );
  }

  @Post()
  async create(
    @Headers('tenant-id') tenantId: string,
    @Headers('authorization') authorization: string,
    @Body() data: any
  ) {
    const user = this.getUserFromToken(authorization);
    return this.fabricDcService.create(
      parseInt(tenantId), 
      data.concernId ? parseInt(data.concernId) : null, 
      { ...data, createdBy: user.username || 'system' }
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Headers('authorization') authorization: string,
    @Body() data: any
  ) {
    const user = this.getUserFromToken(authorization);
    return this.fabricDcService.update(parseInt(id), { ...data, modifiedBy: user.username });
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Headers('authorization') authorization: string
  ) {
    const user = this.getUserFromToken(authorization);
    return this.fabricDcService.delete(parseInt(id), user.username || 'system');
  }
}
