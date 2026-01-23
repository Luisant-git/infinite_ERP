import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiProperty({ example: 'password123' })
  password: string;

  @ApiPropertyOptional({ example: false })
  adminUser?: boolean;

  @ApiPropertyOptional({ example: false })
  dcClose?: boolean;

  @ApiPropertyOptional({ example: true })
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1 })
  concernId?: number;
}