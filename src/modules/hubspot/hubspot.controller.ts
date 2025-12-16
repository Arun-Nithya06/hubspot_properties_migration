import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import * as XLSX from 'xlsx';
import { HubspotService } from './hubspot.service';
import { mapRowToHubspotProperty } from 'src/utils/hubspot-property.mapper';
import {
  PropertySyncResponseDto,
  HubspotExcelRowDto,
  HubspotPropertyDto,
} from './dto';

@ApiTags('HubSpot')
@ApiSecurity('hubspot-api-key')
@Controller('hubspot')
export class HubspotController {
  constructor(private readonly hubspotService: HubspotService) {}

  @ApiExtraModels(HubspotExcelRowDto)
  @Post('properties/sync')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiHeader({
    name: 'x-hubspot-api-key',
    description: 'HubSpot Private App API Token',
    required: true,
  })
  @ApiOperation({
    summary: 'Create / Update HubSpot properties from Excel',
    description: `
Upload an Excel file where **each sheet represents a HubSpot object**
and **each row represents a property definition**.

---

### 🔐 Authentication
This endpoint requires a **HubSpot Private App API Token** passed in the
\`x-hubspot-api-key\` request header.

You can create a Private App in HubSpot by following the official guide:
[HubSpot Private App Documentation](https://developers.hubspot.com/docs/apps/legacy-apps/private-apps/overview)

---

### 🔑 Required HubSpot Scopes
Your Private App **must include** the following scopes:

- \`crm.objects.{objectType}.write\`
- \`crm.objects.{objectType}.read\`
- \`crm.schemas.{objectType}.write\`
- \`crm.schemas.{objectType}.read\`
- \`crm.schemas.contacts.write\`
- \`crm.schemas.contacts.read\`
- \`crm.schemas.companies.write\`
- \`crm.schemas.deals.write\`
- \`crm.schemas.tickets.write\`

> Enable only the scopes required for the objects you are syncing.

---

### 📄 Excel Column Mapping
| Column Name | Description |
|------------|------------|
| objectType | HubSpot object (contacts, companies, deals, tickets) |
| groupName | HubSpot property group |
| propertyName | Internal property name |
| label | Display label |
| type | Property type (string, number, enumeration, etc.) |
| fieldType | UI field type (select, text, textarea, checkbox, radio) |
| dropdownValues | Comma or semicolon separated dropdown values |
`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel file containing HubSpot property definitions',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'HubSpot properties created or updated successfully',
    type: PropertySyncResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing HubSpot API token',
  })
  @ApiResponse({
    status: 403,
    description: 'HubSpot API token does not have required scopes',
  })
  async uploadSheet(
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-hubspot-api-key') apiKey: string,
  ): Promise<PropertySyncResponseDto> {
    if (!file) {
      throw new BadRequestException('Excel file is required');
    }

    if (!apiKey) {
      throw new BadRequestException('HubSpot API key header is required');
    }

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
        }) as HubspotExcelRowDto[];

        for (const row of rows) {
          const property: HubspotPropertyDto = mapRowToHubspotProperty(row);
          await this.hubspotService.createOrUpdateProperty(
            property,
            sheetName,
            apiKey,
          );
        }
      }

      return {
        message: 'HubSpot property sync completed',
        sheetsProcessed: workbook.SheetNames,
      };
    } catch (error) {
      throw new BadRequestException(
        'Failed to process Excel file: ' + error.message,
      );
    }
  }
}
