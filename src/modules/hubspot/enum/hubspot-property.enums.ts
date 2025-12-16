/**
 * HubSpot Property & Field Type Enums
 * Used for property creation via HubSpot API
 */

/** Field types supported by HubSpot */
export enum HubspotFieldTypeEnum {
  BOOLEAN_CHECKBOX = 'booleancheckbox',
  CALCULATION_EQUATION = 'calculation_equation',
  CHECKBOX = 'checkbox',
  DATE = 'date',
  FILE = 'file',
  HTML = 'html',
  NUMBER = 'number',
  PHONENUMBER = 'phonenumber',
  RADIO = 'radio',
  SELECT = 'select',
  TEXT = 'text',
  TEXTAREA = 'textarea',
}

/** HubSpot property data types */
export enum HubspotPropertyTypeEnum {
  STRING = 'string',
  NUMBER = 'number',
  BOOL = 'bool',
  DATE = 'date',
  DATETIME = 'datetime',
  ENUMERATION = 'enumeration',
}

/** Raw / source types (Excel, Sheet, Input) */
export enum HubspotRawTypeEnum {
  PHONE = 'phone',
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  ENUMERATION = 'enumeration',
}

/** Generic Yes / No enum */
export enum YesNoEnum {
  YES = 'yes',
  NO = 'no',
}
