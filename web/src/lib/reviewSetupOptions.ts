export const BUSINESS_DOMAIN_OPTIONS = ['SaaS', 'FinTech', 'Healthcare', 'Media', 'E-commerce', 'Enterprise Platform'] as const;
export const TARGET_USER_OPTIONS = ['External customers', 'Enterprise tenants', 'Internal employees', 'Operations and admins', 'Partners and integrators'] as const;
export const EXPECTED_TRAFFIC_OPTIONS = ['Low / steady', 'Moderate', 'High', 'Bursty', 'Global / multi-region'] as const;
export const DATA_SENSITIVITY_OPTIONS = ['Public', 'Internal', 'Confidential', 'PII / regulated'] as const;
export const COMPLIANCE_OPTIONS = ['GDPR', 'SOC 2', 'ISO 27001', 'Audit logging / retention'] as const;
export const CLOUD_PROVIDER_OPTIONS = ['Azure', 'AWS', 'Cloud-neutral'] as const;

export function serializeMultiValueSelection(values: string[]) {
  return values.join(', ');
}

export function parseMultiValueSelection(value?: string | null) {
  if (!value) {
    return [] as string[];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
