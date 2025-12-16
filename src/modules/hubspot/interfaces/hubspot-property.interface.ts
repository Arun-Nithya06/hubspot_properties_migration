export interface HubSpotProperty {
  objectType: string;
  groupName: string;
  name: string;
  label: string;
  type: string;
  fieldType?: string;
  options?: { label: string; value: string }[];
}

export interface PropertyLog {
  name: string;
  objectType: string;
  groupName: string;
  status: 'success' | 'failed' | 'exists';
  error?: string;
}
