import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PartyContactDto {
  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiPropertyOptional({ example: '9876543210' })
  mobileNo?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: 1 })
  whatsappRequired?: number;

  @ApiPropertyOptional({ example: 0 })
  mailRequired?: number;
}