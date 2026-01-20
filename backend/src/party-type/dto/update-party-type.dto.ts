import { PartialType } from '@nestjs/swagger';
import { CreatePartyTypeDto } from './create-party-type.dto';

export class UpdatePartyTypeDto extends PartialType(CreatePartyTypeDto) {}