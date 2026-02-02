import { IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class CreateProcessDto {
  @IsString()
  processName: string;

  @IsOptional()
  @IsString()
  tallyName?: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsNumber()
  productionExcess?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  notRequiredRate?: boolean;

  @IsOptional()
  @IsBoolean()
  wetCondition?: boolean;
}
