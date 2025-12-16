import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HubspotExcelRowDto {
  @ApiProperty({
    example: 'contacts',
    description: 'HubSpot object type (contacts, companies, deals, tickets)',
  })
  objectType: string;

  @ApiProperty({
    example: 'custom_information',
    description: 'Property group name in HubSpot',
  })
  groupName: string;

  @ApiProperty({
    example: 'favorite_color',
    description: 'Internal property name',
  })
  propertyName: string;

  @ApiProperty({
    example: 'Favorite Color',
    description: 'Property label shown in HubSpot UI',
  })
  label: string;

  @ApiProperty({
    example: 'enumeration',
    description: 'HubSpot property data type',
  })
  type: string;

  @ApiPropertyOptional({
    example: 'select',
    description: 'UI field type (select, text, textarea, checkbox, radio)',
  })
  fieldType?: string;

  @ApiPropertyOptional({
    example: 'Red, Blue; Green',
    description: 'Comma or semicolon separated dropdown values',
  })
  dropdownValues?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the property allows multiple values (true/false)',
  })
  multiple?: boolean;
}
