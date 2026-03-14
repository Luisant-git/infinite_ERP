import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePartyScreenRateDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  partyId: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  screenRate: number;
}