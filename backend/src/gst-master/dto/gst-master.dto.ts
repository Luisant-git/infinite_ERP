import { IsString, IsNumber, IsInt, IsOptional, IsIn } from 'class-validator';

export class CreateGstMasterDto {
  @IsString()
  taxName: string;

  @IsNumber()
  taxPercent: number;

  @IsString()
  @IsIn(['SGST', 'CGST', 'IGST'])
  taxType: string;

  @IsOptional()
  @IsInt()
  isActive?: number;

  @IsOptional()
  @IsInt()
  isLoadDefault?: number;
}

export class UpdateGstMasterDto {
  @IsOptional()
  @IsString()
  taxName?: string;

  @IsOptional()
  @IsNumber()
  taxPercent?: number;

  @IsOptional()
  @IsString()
  @IsIn(['SGST', 'CGST', 'IGST'])
  taxType?: string;

  @IsOptional()
  @IsInt()
  isActive?: number;

  @IsOptional()
  @IsInt()
  isLoadDefault?: number;
}
