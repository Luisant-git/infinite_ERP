import { PartialType } from '@nestjs/swagger';
import { CreatePartyOpeningDto } from './create-party-opening.dto';

export class UpdatePartyOpeningDto extends PartialType(CreatePartyOpeningDto) {}
