import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'ABARNIKA KNITS' })
  companyName: string;

  @ApiProperty({ example: '2025-2026' })
  financialYear: string;
}