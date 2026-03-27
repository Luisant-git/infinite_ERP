import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateSettingsDto {
  @IsBoolean()
  enableItemWiseProcess: boolean;

  @IsOptional()
  @IsBoolean()
  enableProcessWeightBill?: boolean;

  @IsOptional()
  @IsString()
  defaultHsnCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  excessPercentage?: number;
}
