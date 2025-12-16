import { BadRequestException } from '@nestjs/common';
import {
  HubspotRawTypeEnum,
  HubspotPropertyTypeEnum,
  HubspotFieldTypeEnum,
  YesNoEnum,
} from 'src/modules/hubspot/enum/hubspot-property.enums';
import { HubSpotProperty } from 'src/modules/hubspot/interfaces/hubspot-property.interface';

export const mapRowToHubspotProperty = (row: any): HubSpotProperty => {
  const rawType = row['Type']?.toLowerCase() as HubspotRawTypeEnum;
  const multipleRaw = row['Multiple'];
  const isMulti = multipleRaw
    ? typeof multipleRaw === 'boolean'
      ? multipleRaw
      : multipleRaw.toString().trim().toLowerCase() ===
        YesNoEnum.YES.toLowerCase()
    : false;

  let type: HubspotPropertyTypeEnum;
  let fieldType: HubspotFieldTypeEnum;

  switch (rawType) {
    case HubspotRawTypeEnum.PHONE:
      type = HubspotPropertyTypeEnum.STRING;
      fieldType = HubspotFieldTypeEnum.PHONENUMBER;
      break;

    case HubspotRawTypeEnum.TEXT:
      type = HubspotPropertyTypeEnum.STRING;
      fieldType = HubspotFieldTypeEnum.TEXTAREA;
      break;

    case HubspotRawTypeEnum.NUMBER:
      type = HubspotPropertyTypeEnum.NUMBER;
      fieldType = HubspotFieldTypeEnum.NUMBER;
      break;

    case HubspotRawTypeEnum.BOOLEAN:
      type = HubspotPropertyTypeEnum.BOOL;
      fieldType = HubspotFieldTypeEnum.BOOLEAN_CHECKBOX;
      break;

    case HubspotRawTypeEnum.DATE:
      type = HubspotPropertyTypeEnum.DATE;
      fieldType = HubspotFieldTypeEnum.DATE;
      break;

    case HubspotRawTypeEnum.DATETIME:
      type = HubspotPropertyTypeEnum.DATETIME;
      fieldType = HubspotFieldTypeEnum.DATE;
      break;

    case HubspotRawTypeEnum.ENUMERATION:
      type = HubspotPropertyTypeEnum.ENUMERATION;
      fieldType = isMulti
        ? HubspotFieldTypeEnum.CHECKBOX
        : HubspotFieldTypeEnum.SELECT;
      break;

    default:
      throw new BadRequestException(
        `Unsupported property type: ${row['Type']}`,
      );
  }

  return {
    objectType: row['Object Type'],
    groupName: row['Group Name'],
    name: row['Property Name'],
    label: row['Label'],
    type,
    fieldType,
    options:
      rawType === HubspotRawTypeEnum.ENUMERATION
        ? parseDropdownOptions(row['Dropdown Values'])
        : rawType === HubspotRawTypeEnum.BOOLEAN
          ? [
              { label: 'True', value: 'true' },
              { label: 'False', value: 'false' },
            ]
          : undefined,
  };
};

export const parseDropdownOptions = (value?: string) => {
  if (!value) return [];

  return value
    .split(/[,;]/) // split by comma OR semicolon
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => ({
      label: v,
      value: v.toLowerCase().replace(/\s+/g, '_'),
    }));
};
