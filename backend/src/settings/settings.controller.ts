import { Controller, Get, Put, Body, Headers } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings(@Headers('tenant-id') tenantId: string) {
    return this.settingsService.getSettings(+tenantId);
  }

  @Put()
  updateSettings(
    @Headers('tenant-id') tenantId: string,
    @Body() updateSettingsDto: UpdateSettingsDto
  ) {
    return this.settingsService.updateSettings(+tenantId, updateSettingsDto);
  }
}
