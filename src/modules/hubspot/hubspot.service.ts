import { Injectable, Logger } from '@nestjs/common';
import { HubspotAPIService } from './hubspot-api.service';
import { HubSpotProperty } from './interfaces/hubspot.inerface';
import * as fs from 'fs';
import * as path from 'path';

type LogStatus = 'success' | 'exists' | 'failed';

@Injectable()
export class HubspotService {
  private readonly logger = new Logger(HubspotService.name);
  private propertyCache = new Map<string, Set<string>>();

  constructor(private readonly hubspotAPIService: HubspotAPIService) {}

  /** Set HubSpot API key/token */
  public async setApiKey(apiKey: string) {
    this.logger.log(`[ENTER] setApiKey`);
    await this.hubspotAPIService.setApiKey(apiKey);
    this.logger.log(`[EXIT] setApiKey`);
  }
  /**
   * Write log entry for property operation for given sheet
   * @param sheet
   * @returns
   */
  private logFile(sheet: string): string {
    return path.resolve(process.cwd(), `hubspot-${sheet}.log.json`);
  }

  /**
   * write log entry
   * @param sheet
   * @param data
   */
  private logWrite(
    sheet: string,
    data: { name: string; status: LogStatus; error?: string },
  ) {
    const file = this.logFile(sheet);
    let logs: any[] = [];

    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        logs = content ? JSON.parse(content) : [];
      } catch (err) {
        this.logger.warn(
          `[LOG PARSE ERROR] Log file ${file} is invalid. Resetting logs.`,
        );
        logs = [];
      }
    }

    logs.push({ ...data, time: new Date().toISOString() });
    fs.writeFileSync(file, JSON.stringify(logs, null, 2));
    this.logger.log(`${data.name} status=${data.status}`);
  }

  /**
   * Ensure hubspot property group exists
   * @param objectType
   * @param groupName
   */
  private async ensureGroup(
    objectType: string,
    groupName: string,
  ): Promise<void> {
    const groups = await this.hubspotAPIService.getGroups(objectType);
    const exists = groups.results.some((g) => g.name === groupName);

    if (!exists) {
      await this.hubspotAPIService.createGroup(objectType, groupName);
      this.logger.log(`[CREATED] GROUP ${groupName}`);
    } else {
      this.logger.log(`[EXISTS] GROUP ${groupName}`);
    }
  }

  /**
   * Check if property exists in cache or HubSpot
   * @param objectType
   * @param propertyName
   * @returns
   */
  private async propertyExists(
    objectType: string,
    propertyName: string,
  ): Promise<boolean> {
    if (!this.propertyCache.has(objectType)) {
      const props = await this.hubspotAPIService.getProperties(objectType);
      this.propertyCache.set(
        objectType,
        new Set(props.results.map((p) => p.name)),
      );
    }
    return this.propertyCache.get(objectType)!.has(propertyName);
  }

  /**
   * Create or update HubSpot property
   * @param prop
   * @param sheet
   * @param token
   * @returns
   */
  async createOrUpdateProperty(
    prop: HubSpotProperty,
    sheet: string,
    token: string,
  ): Promise<void> {
    this.logger.log(`createOrUpdateProperty name=${prop.name}`);

    try {
      await this.hubspotAPIService.setApiKey(token);

      await this.ensureGroup(prop.objectType, prop.groupName);

      if (await this.propertyExists(prop.objectType, prop.name)) {
        this.logger.log(`updating .. ${prop.name} already exists`);
        await this.hubspotAPIService.updateProperty(
          prop.objectType,
          prop.name,
          {
            label: prop.label,
            type: prop.type,
            fieldType: prop.fieldType,
            groupName: prop.groupName,
            options: prop.options?.length ? prop.options : undefined,
          },
        );
        this.logger.log(`UPDATED ${prop.name}`);
        this.logWrite(sheet, { name: prop.name, status: 'success' });
        return;
      }

      // Create new property if it doesn't exist
      await this.hubspotAPIService.createProperty(prop.objectType, {
        name: prop.name,
        label: prop.label,
        type: prop.type,
        fieldType: prop.fieldType,
        groupName: prop.groupName,
        options: prop.options?.length ? prop.options : undefined,
      });

      // Update cache
      if (!this.propertyCache.has(prop.objectType))
        this.propertyCache.set(prop.objectType, new Set());
      this.propertyCache.get(prop.objectType)!.add(prop.name);

      this.logger.log(`CREATED ${prop.name}`);
      this.logWrite(sheet, { name: prop.name, status: 'success' });
    } catch (e: any) {
      this.logger.error(` ${prop.name} error=${e.message}`);
      this.logWrite(sheet, {
        name: prop.name,
        status: 'failed',
        error: e.message,
      });
    } finally {
      this.logger.log(`Exit createOrUpdateProperty name=${prop.name}`);
    }
  }
}
