import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConcernContactDto {
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

export class CreateConcernDto {
  @ApiProperty({ example: 'ABC Suppliers' })
  partyName: string;

  @ApiPropertyOptional({ example: 'V001' })
  vendorCode?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  address1?: string;

  @ApiPropertyOptional({ example: 'Suite 100' })
  address2?: string;

  @ApiPropertyOptional({ example: 'Business District' })
  address3?: string;

  @ApiPropertyOptional({ example: 'Near Mall' })
  address4?: string;

  @ApiPropertyOptional({ example: '400001' })
  pincode?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  district?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  state?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  mobileNo?: string;

  @ApiPropertyOptional({ example: '0226543210' })
  phoneNo?: string;

  @ApiPropertyOptional({ example: 'abc@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'ABCDE1234F' })
  panNo?: string;

  @ApiPropertyOptional({ example: 'ABC Suppliers Tally' })
  tallyAccName?: string;

  @ApiProperty({ example: '27ABCDE1234F1Z5' })
  gstNo: string;

  @ApiPropertyOptional({ example: 30 })
  creditDays?: number;

  @ApiPropertyOptional({ example: '1234567890' })
  accountNo?: string;

  @ApiPropertyOptional({ example: 'HDFC Bank' })
  bank?: string;

  @ApiPropertyOptional({ example: 'HDFC0001234' })
  ifscCode?: string;

  @ApiPropertyOptional({ example: 'Mumbai Branch' })
  branch?: string;

  @ApiPropertyOptional({ example: 1 })
  active?: number;

  @ApiPropertyOptional({ type: [ConcernContactDto] })
  contacts?: ConcernContactDto[];
}