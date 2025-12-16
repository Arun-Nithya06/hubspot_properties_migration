import { IsString, IsNotEmpty } from 'class-validator';

export class HubspotApiKeyHeaderDto {
  @IsString()
  @IsNotEmpty()
  'x-hubspot-api-key': string;
}
