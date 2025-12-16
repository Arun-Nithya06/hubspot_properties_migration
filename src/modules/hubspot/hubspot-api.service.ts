import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@hubspot/api-client';

@Injectable()
export class HubspotAPIService {
  private readonly logger = new Logger(HubspotAPIService.name);
  private hubspotClient: Client;

  constructor() {}

  /**
   * Set HubSpot API key dynamically
   * @param token
   */
  setApiKey(token: string) {
    this.hubspotClient = new Client({ accessToken: token });
    this.logger.debug(`HubSpot API key updated dynamically`);
  }

  /**
   * Get hubSpot property groups
   * @param objectType
   * @returns
   */

  async getGroups(objectType: string) {
    this.logger.debug(`getGroups objectType=${objectType}`);
    try {
      const result =
        await this.hubspotClient.crm.properties.groupsApi.getAll(objectType);
      this.logger.log(`getGroups found ${result.results.length} groups`);
      return result;
    } catch (e: any) {
      this.logger.error(
        `getGroups objectType=${objectType} error=${e.message}`,
      );
      throw e;
    }
  }

  /**
   * Create hubSpot property group
   * @param objectType
   * @param groupName
   * @returns
   */
  async createGroup(objectType: string, groupName: string) {
    this.logger.debug(
      `createGroup objectType=${objectType} groupName=${groupName}`,
    );
    try {
      const result = await this.hubspotClient.crm.properties.groupsApi.create(
        objectType,
        {
          name: groupName,
          label: groupName,
        },
      );
      this.logger.log(`createGroup ${groupName}`);
      return result;
    } catch (e: any) {
      this.logger.error(`createGroup ${groupName} error=${e.message}`);
      throw e;
    } finally {
      this.logger.log(`exit createGroup`);
    }
  }

  /**
   * Get hubSpot properties
   * @param objectType
   * @returns
   */
  async getProperties(objectType: string) {
    this.logger.debug(`getProperties objectType=${objectType}`);
    try {
      const result =
        await this.hubspotClient.crm.properties.coreApi.getAll(objectType);
      this.logger.log(
        `getProperties fetched ${result.results.length} properties`,
      );
      return result;
    } catch (e: any) {
      this.logger.error(
        `getProperties objectType=${objectType} error=${e.message}`,
      );
      throw e;
    }
  }

  /**
   * Create hubSpot property
   * @param objectType
   * @param payload
   * @returns
   */
  async createProperty(objectType: string, payload: any) {
    this.logger.debug(
      `createProperty objectType=${objectType} name=${payload.name}`,
    );
    try {
      const result = await this.hubspotClient.crm.properties.coreApi.create(
        objectType,
        payload,
      );
      this.logger.log(`createProperty ${payload.name}`);
      return result;
    } catch (e: any) {
      this.logger.error(` createProperty ${payload.name} error=${e.message}`);
      throw e;
    } finally {
      this.logger.log(`exit createProperty name=${payload.name}`);
    }
  }

  /**
   * Update hubSpot property
   * @param objectType
   * @param propertyName
   * @param payload
   * @returns
   */
  async updateProperty(objectType: string, propertyName: string, payload: any) {
    this.logger.debug(
      `updateProperty objectType=${objectType} name=${propertyName}`,
    );
    try {
      const result = await this.hubspotClient.crm.properties.coreApi.update(
        objectType,
        propertyName,
        payload,
      );
      this.logger.log(`updateProperty ${propertyName}`);
      return result;
    } catch (e: any) {
      this.logger.error(`updateProperty ${propertyName} error=${e.message}`);
      throw e;
    } finally {
      this.logger.log(`exit updateProperty name=${propertyName}`);
    }
  }
}
