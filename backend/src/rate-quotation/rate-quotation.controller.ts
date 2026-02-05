import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, Headers } from '@nestjs/common';
import { RateQuotationService } from './rate-quotation.service';
import * as jwt from 'jsonwebtoken';

@Controller('rate-quotations')
export class RateQuotationController {
  constructor(private readonly rateQuotationService: RateQuotationService) {}

  private getUserFromToken(authorization: string): any {
    if (!authorization) return {};
    const token = authorization.replace('Bearer ', '');
    try {
      return jwt.decode(token) || {};
    } catch {
      return {};
    }
  }

  @Get('next-quot-no')
  async getNextQuotNo(@Headers('tenant-id') tenantId: string) {
    return this.rateQuotationService.getNextQuotNo(parseInt(tenantId));
  }

  @Get()
  async findAll(
    @Headers('tenant-id') tenantId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.rateQuotationService.findAll(
      parseInt(tenantId),
      search,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10
    );
  }

  @Post()
  async create(
    @Headers('tenant-id') tenantId: string,
    @Headers('concern-id') concernId: string,
    @Headers('authorization') authorization: string,
    @Body() data: any
  ) {
    const user = this.getUserFromToken(authorization);
    return this.rateQuotationService.create(
      parseInt(tenantId), 
      parseInt(concernId), 
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
    return this.rateQuotationService.update(parseInt(id), { ...data, modifiedBy: user.username });
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Headers('authorization') authorization: string
  ) {
    const user = this.getUserFromToken(authorization);
    return this.rateQuotationService.delete(parseInt(id), user.username || 'system');
  }
}
