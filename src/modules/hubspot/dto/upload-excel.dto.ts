import { ApiProperty } from '@nestjs/swagger';

export class UploadExcelDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Excel file containing HubSpot property definitions',
  })
  file: any;
}
