export class CreateDesignDto {
  refNo?: string;
  date?: Date;
  customerId?: number;
  designNo: string;
  designName: string;
  typeOfPrint?: string;
  noOfColor?: number;
  noOfPrint?: number;
  commercialRate?: number;
  description?: string;
  remarks?: string;
  imagePath?: string;
  isActive?: boolean;
}
