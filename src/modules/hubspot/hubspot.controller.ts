import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { HubspotService } from './hubspot.service';
import { mapRowToHubspotProperty } from 'src/utils/hubspot-property.mapper';

@Controller('hubspot')
export class HubspotController {
  constructor(private readonly hubspotService: HubspotService) {}

  @Post('properties/create-from-excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSheet(
    @UploadedFile() file: any,
    @Headers('x-hubspot-api-key') apiKey: string,
  ) {
    if (!file) throw new BadRequestException('Excel file is required');
    if (!apiKey)
      throw new BadRequestException('HubSpot API key header is required');

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
        }) as any[];

        for (const row of rows) {
          const property = mapRowToHubspotProperty(row);
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
      console.error('Error uploading Excel sheet', error);
      throw new BadRequestException(
        'Failed to process Excel file: ' + error.message,
      );
    }
  }
}
