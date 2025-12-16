import { ApiProperty } from '@nestjs/swagger';

export class PropertySyncResponseDto {
  @ApiProperty({
    example: 'HubSpot property sync completed',
  })
  message: string;

  @ApiProperty({
    example: ['Contacts', 'Deals'],
    description: 'Processed Excel sheet names',
  })
  sheetsProcessed: string[];
}
