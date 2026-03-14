import { PartialType } from '@nestjs/mapped-types';
import { CreatePartyScreenRateDto } from './create-party-screen-rate.dto';

export class UpdatePartyScreenRateDto extends PartialType(CreatePartyScreenRateDto) {}