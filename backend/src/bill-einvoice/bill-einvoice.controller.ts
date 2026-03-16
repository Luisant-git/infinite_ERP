import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, Headers } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillEinvoiceService } from './bill-einvoice.service';
import { CreateEinvoiceSettingsDto, UpdateEinvoiceSettingsDto, GenerateEinvoiceDto } from './dto/bill-einvoice.dto';

@ApiTags('Bill E-invoice')
@Controller('bill-einvoice')
export class BillEinvoiceController {
  constructor(private readonly billEinvoiceService: BillEinvoiceService) {}

  // E-invoice Settings endpoints
  @Post('settings')
  @ApiOperation({ summary: 'Create E-invoice settings' })
  async createSettings(
    @Headers('tenant-id') tenantId: string,
    @Body() createDto: CreateEinvoiceSettingsDto,
  ) {
    return this.billEinvoiceService.createSettings(Number(tenantId), createDto);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get E-invoice settings' })
  async getSettings(@Headers('tenant-id') tenantId: string) {
    return this.billEinvoiceService.getSettings(Number(tenantId));
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update E-invoice settings' })
  async updateSettings(
    @Headers('tenant-id') tenantId: string,
    @Body() updateDto: UpdateEinvoiceSettingsDto,
  ) {
    return this.billEinvoiceService.updateSettings(Number(tenantId), updateDto);
  }

  @Delete('settings')
  @ApiOperation({ summary: 'Delete E-invoice settings' })
  async deleteSettings(@Headers('tenant-id') tenantId: string) {
    return this.billEinvoiceService.deleteSettings(Number(tenantId));
  }

  // Bill E-invoice endpoints
  @Get('bills')
  @ApiOperation({ summary: 'Get bills for E-invoice generation' })
  async getBillsForEinvoice(
    @Headers('tenant-id') tenantId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.billEinvoiceService.getBillsForEinvoice(
      Number(tenantId), 
      search, 
      Number(page) || 1, 
      Number(limit) || 10
    );
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate E-invoice for a bill' })
  async generateEinvoice(
    @Headers('tenant-id') tenantId: string,
    @Body() generateDto: GenerateEinvoiceDto,
  ) {
    return this.billEinvoiceService.generateEinvoice(Number(tenantId), generateDto);
  }

  @Get('status/:billId')
  @ApiOperation({ summary: 'Get E-invoice status for a bill' })
  async getEinvoiceStatus(@Param('billId', ParseIntPipe) billId: number) {
    return this.billEinvoiceService.getEinvoiceStatus(billId);
  }

  @Post('cancel/:billId')
  @ApiOperation({ summary: 'Cancel E-invoice for a bill' })
  async cancelEinvoice(
    @Headers('tenant-id') tenantId: string,
    @Param('billId', ParseIntPipe) billId: number,
    @Body('reason') reason: string,
  ) {
    return this.billEinvoiceService.cancelEinvoice(Number(tenantId), billId, reason);
  }
}