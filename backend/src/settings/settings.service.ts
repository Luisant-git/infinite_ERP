import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(tenantId: number) {
    let settings = await this.prisma.settings.findUnique({
      where: { tenantId }
    });
    if (!settings) {
      settings = await this.prisma.settings.create({
        data: { tenantId, enableItemWiseProcess: false },
      });
    }
    return settings;
  }

  async updateSettings(tenantId: number, updateSettingsDto: UpdateSettingsDto) {
    return this.prisma.settings.upsert({
      where: { tenantId },
      update: updateSettingsDto,
      create: { tenantId, ...updateSettingsDto },
    });
  }
}
