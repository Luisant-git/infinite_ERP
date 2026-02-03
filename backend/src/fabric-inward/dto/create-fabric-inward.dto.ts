import { IsString, IsInt, IsOptional, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class FabricInwardDetailDto {
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
  @IsInt()
  designId?: number;

  @IsOptional()
  @IsString()
  designName?: string;

  @IsOptional()
  @IsInt()
  noOfColor?: number;

  @IsOptional()
  @IsInt()
  productionNotRequired?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsInt()
  rolls?: number;

  @IsOptional()
  @IsInt()
  uomId?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

class FabricInwardProcessDto {
  @IsString()
  processName: string;

  @IsOptional()
  @IsNumber()
  rate?: number;

  @IsOptional()
  @IsInt()
  wetCondition?: number;

  @IsOptional()
  @IsInt()
  productionNotRequired?: number;

  @IsOptional()
  @IsInt()
  productionClose?: number;
}

export class CreateFabricInwardDto {
  @IsOptional()
  @IsInt()
  partyId?: number;

  @IsOptional()
  @IsString()
  pdcNo?: string;

  @IsOptional()
  pdcDate?: Date;

  @IsOptional()
  @IsInt()
  dyeingPartyId?: number;

  @IsOptional()
  @IsString()
  dyeingDcNo?: string;

  @IsOptional()
  dyeingDcDate?: Date;

  @IsOptional()
  @IsString()
  orderNo?: string;

  @IsOptional()
  @IsString()
  dcType?: string;

  @IsOptional()
  @IsString()
  fabricType?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  vehicleNo?: string;

  @IsOptional()
  grnDate?: Date;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FabricInwardDetailDto)
  details?: FabricInwardDetailDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FabricInwardProcessDto)
  processes?: FabricInwardProcessDto[];
}
