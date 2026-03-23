import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDecimal, IsDateString } from 'class-validator';

export class CreatePartyOpeningDto {
  @IsNotEmpty()
  @IsNumber()
  partyId: number;

  @IsOptional()
  @IsString()
  billNo?: string;

  @IsOptional()
  @IsDateString()
  billDate?: string;

  @IsOptional()
  debitAmount?: number;

  @IsOptional()
  creditAmount?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}
