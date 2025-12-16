import { Injectable, Logger } from '@nestjs/common';
import { HubspotAPIService } from './hubspot-api.service';
import { HubSpotProperty } from './interfaces/hubspot-property.interface';
import * as fs from 'fs';
import * as path from 'path';

type LogStatus = 'success' | 'exists' | 'failed';

@Injectable()
export class HubspotService {
  private readonly logger = new Logger(HubspotService.name);
  private propertyCache = new Map<string, Set<string>>();
  private currentLogFile: string | null = null;

  constructor(private readonly hubspotAPIService: HubspotAPIService) {}

  /** Set HubSpot API key/token */
  public async setApiKey(apiKey: string) {
    this.logger.log(`[ENTER] setApiKey`);
    await this.hubspotAPIService.setApiKey(apiKey);
    this.logger.log(`[EXIT] setApiKey`);
  }

  /**
   * Generate a unique log file per execution based on token + timestamp
   */
  private generateLogFile(sheet: string, tokenOrHubId: string): string {
    if (this.currentLogFile) return this.currentLogFile; // reuse for same execution

    // Ensure the directory exists
    const logDir = path.resolve(process.cwd(), 'src/temp/logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true }); // create nested folders if needed
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${tokenOrHubId}-${sheet}-${timestamp}.log.json`;
    const filePath = path.join(logDir, fileName);

    this.currentLogFile = filePath;
    return filePath;
  }

  /**
   * Append log entry to the current execution log file
   */
  private appendLog(
    sheet: string,
    tokenOrHubId: string,
    data: { name: string; status: LogStatus; error?: string },
  ) {
    const filePath = this.generateLogFile(sheet, tokenOrHubId);
    let logs: any[] = [];

    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        logs = content ? JSON.parse(content) : [];
      } catch {
        this.logger.warn(
          `[LOG PARSE ERROR] Resetting invalid log file ${filePath}`,
        );
        logs = [];
      }
    }

    logs.push({ ...data, time: new Date().toISOString() });
    fs.writeFileSync(filePath, JSON.stringify(logs, null, 2));
    this.logger.log(`[LOG] ${data.name} status:${data.status}`);
  }

  /** Ensure HubSpot property group exists */
  private async ensureGroup(objectType: string, groupName: string) {
    const groups = await this.hubspotAPIService.getGroups(objectType);
    const exists = groups.results.some((g) => g.name === groupName);

    if (!exists) {
      await this.hubspotAPIService.createGroup(objectType, groupName);
      this.logger.log(`[CREATED] GROUP:${groupName}`);
    } else {
      this.logger.log(`[EXISTS] GROUP:${groupName}`);
    }
  }

  /** Check if property exists in cache or HubSpot */
  private async propertyExists(objectType: string, propertyName: string) {
    if (!this.propertyCache.has(objectType)) {
      const props = await this.hubspotAPIService.getProperties(objectType);
      this.propertyCache.set(
        objectType,
        new Set(props.results.map((p) => p.name)),
      );
    }
    return this.propertyCache.get(objectType)!.has(propertyName);
  }

  /** Create or update HubSpot property */
  async createOrUpdateProperty(
    prop: HubSpotProperty,
    sheet: string,
    token: string,
  ): Promise<void> {
    this.logger.log(`[ENTER] createOrUpdateProperty name:${prop.name}`);
    let hubspotAccountId;

    try {
      await this.hubspotAPIService.setApiKey(token);
      const accountInfo = await this.hubspotAPIService.getAccountInfo(token);
      hubspotAccountId = accountInfo.portalId || accountInfo.hubId;

      await this.ensureGroup(prop.objectType, prop.groupName);

      const exists = await this.propertyExists(prop.objectType, prop.name);

      if (exists) {
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

        this.logger.log(`[UPDATED] ${prop.name}`);
        this.appendLog(sheet, hubspotAccountId, {
          name: prop.name,
          status: 'success',
        });
      } else {
        await this.hubspotAPIService.createProperty(prop.objectType, {
          name: prop.name,
          label: prop.label,
          type: prop.type,
          fieldType: prop.fieldType,
          groupName: prop.groupName,
          options: prop.options?.length ? prop.options : undefined,
        });

        // Update cache
        if (!this.propertyCache.has(prop.objectType)) {
          this.propertyCache.set(prop.objectType, new Set());
        }
        this.propertyCache.get(prop.objectType)!.add(prop.name);

        this.logger.log(`[CREATED] ${prop.name}`);
        this.appendLog(sheet, hubspotAccountId, {
          name: prop.name,
          status: 'success',
        });
      }
    } catch (error: any) {
      this.logger.error(`[FAILED] ${prop.name} error:${error.message}`);
      this.appendLog(sheet, hubspotAccountId, {
        name: prop.name,
        status: 'failed',
        error: error.message,
      });
    } finally {
      this.logger.log(`[EXIT] createOrUpdateProperty name:${prop.name}`);
    }
  }
}
