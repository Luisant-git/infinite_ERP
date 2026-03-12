import { IsString, IsNumber, IsInt, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFabricBillDetailDto {
  @IsOptional()
  @IsString()
  inwardNo?: string;

  @IsOptional()
  @IsInt()
  grnId?: number;

  @IsOptional()
  @IsString()
  pdcNo?: string;

  @IsOptional()
  @IsString()
  dcNo?: string;

  @IsOptional()
  @IsInt()
  dcId?: number;

  @IsOptional()
  dcDate?: Date;

  @IsOptional()
  @IsInt()
  fabricId?: number;

  @IsOptional()
  @IsInt()
  colorId?: number;

  @IsOptional()
  @IsInt()
  diaId?: number;

  @IsOptional()
  @IsString()
  gsm?: string;

  @IsOptional()
  @IsString()
  designNo?: string;

  @IsOptional()
  @IsString()
  designName?: string;

  @IsOptional()
  @IsInt()
  noOfColor?: number;

  @IsNumber()
  weight: number;

  @IsInt()
  rolls: number;

  @IsOptional()
  @IsInt()
  uomId?: number;

  @IsNumber()
  rate: number;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  processList?: string;

  @IsOptional()
  @IsString()
  process?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateFabricBillTaxDto {
  @IsInt()
  taxName: number;

  @IsNumber()
  taxPercentage: number;

  @IsNumber()
  taxAmount: number;
}

export class CreateFabricBillDto {
  @IsString()
  billNo: string;

  @IsOptional()
  @IsInt()
  partyId?: number;

  @IsOptional()
  @IsInt()
  invoiceTo?: number;

  @IsOptional()
  @IsInt()
  creditDays?: number;

  @IsOptional()
  @IsString()
  orderNo?: string;

  @IsOptional()
  @IsString()
  hsnCode?: string;

  @IsOptional()
  @IsString()
  ewayNo?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsNumber()
  totalQty: number;

  @IsInt()
  totalRolls: number;

  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  gstAmount?: number;

  @IsOptional()
  @IsNumber()
  otherCharges?: number;

  @IsOptional()
  @IsNumber()
  roundOff?: number;

  @IsOptional()
  @IsNumber()
  recAmount?: number;

  @IsOptional()
  @IsNumber()
  diffAmount?: number;

  @IsOptional()
  @IsNumber()
  grantAmount?: number;

  @IsNumber()
  netAmount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFabricBillDetailDto)
  details: CreateFabricBillDetailDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFabricBillTaxDto)
  taxes: CreateFabricBillTaxDto[];
}

export class UpdateFabricBillDto extends CreateFabricBillDto {}
