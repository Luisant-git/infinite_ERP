import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDecimal, IsDateString, IsBoolean } from 'class-validator';

export class CreateCollectionDto {
  @IsNotEmpty()
  @IsString()
  refNo: string;

  @IsNotEmpty()
  @IsDateString()
  refDate: string;

  @IsNotEmpty()
  @IsNumber()
  partyId: number;

  @IsNotEmpty()
  amount: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsNotEmpty()
  @IsString()
  mode: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  ourBankName?: string;

  @IsOptional()
  @IsString()
  chequeNo?: string;

  @IsOptional()
  @IsDateString()
  chequeDate?: string;

  @IsOptional()
  @IsBoolean()
  chequeReturn?: boolean;

  @IsOptional()
  returnCharges?: number;
}
