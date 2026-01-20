import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePartyTypeDto {
  @ApiProperty({ example: 1 })
  tenantId: number;

  @ApiProperty({ example: 'Customer' })
  partyTypeName: string;

  @ApiPropertyOptional({ example: true })
  isActive?: boolean;
}