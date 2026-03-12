import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsBoolean()
  enableItemWiseProcess: boolean;

  @IsOptional()
  @IsString()
  defaultHsnCode?: string;
}
