import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HubspotPropertyOptionDto {
  @ApiProperty({ example: 'Red' })
  label: string;

  @ApiProperty({ example: 'red' })
  value: string;
}

export class HubspotPropertyDto {
  @ApiProperty({ example: 'contacts' })
  objectType: string;

  @ApiProperty({ example: 'custom_information' })
  groupName: string;

  @ApiProperty({ example: 'favorite_color' })
  name: string;

  @ApiProperty({ example: 'Favorite Color' })
  label: string;

  @ApiProperty({ example: 'enumeration' })
  type: string;

  @ApiPropertyOptional({ example: 'select' })
  fieldType?: string;

  @ApiPropertyOptional({
    type: [HubspotPropertyOptionDto],
    description: 'Dropdown options for enumeration properties',
  })
  options?: HubspotPropertyOptionDto[];
}
