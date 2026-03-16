import { IsString, IsNumber, IsInt, IsOptional, IsBoolean } from 'class-validator';

export class CreateEinvoiceSettingsDto {
  @IsString()
  apiUrl: string;

  @IsString()
  aspId: string;

  @IsString()
  password: string;

  @IsString()
  authToken: string;

  @IsOptional()
  @IsInt()
  qrCodeSize?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEinvoiceSettingsDto extends CreateEinvoiceSettingsDto {}

export class GenerateEinvoiceDto {
  @IsInt()
  billId: number;
}

export class EinvoiceResponseDto {
  @IsOptional()
  @IsString()
  irnNo?: string;

  @IsOptional()
  @IsString()
  ackNo?: string;

  @IsOptional()
  ackDate?: Date;

  @IsOptional()
  @IsString()
  qrText?: string;

  @IsOptional()
  @IsString()
  ewbNo?: string;

  @IsOptional()
  ewbDate?: Date;

  @IsOptional()
  ewbValidDate?: Date;

  @IsOptional()
  @IsString()
  ewbAlert?: string;

  @IsOptional()
  @IsString()
  signedInvoice?: string;

  @IsOptional()
  @IsString()
  signedQrCode?: string;

  @IsInt()
  status: number;

  @IsOptional()
  @IsInt()
  isCanceled?: number;

  @IsOptional()
  @IsString()
  cancelReason?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsString()
  requestPayload?: string;

  @IsOptional()
  @IsString()
  responsePayload?: string;
}