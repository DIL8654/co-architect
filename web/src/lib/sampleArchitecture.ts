export const SAMPLE_WORKSPACE_NAME = 'Hackathon Architecture Review';

export const SAMPLE_DIAGRAM_NAME = 'B2B SaaS Platform Review';

export const SAMPLE_ARCHITECTURE_DESCRIPTION = `A B2B SaaS platform with React frontend, .NET backend APIs, PostgreSQL/TiDB database, blob storage, background jobs, and enterprise customers in Europe.

The platform currently has no API gateway, no tenant isolation strategy, no audit logging, no disaster recovery plan, limited monitoring, and unclear secrets management.`;

export const SAMPLE_REVIEW_CONTEXT = {
  businessDomain: 'B2B SaaS',
  targetUsers: 'Enterprise customers and tenant administrators',
  expectedTraffic: 'Moderate traffic with enterprise onboarding spikes',
  dataSensitivity: 'PII and tenant-specific business data',
  cloudProviderPreference: 'Azure',
  complianceNeeds: 'GDPR, audit logging, tenant isolation, operational evidence',
  currentPainPoints: 'No API gateway, no tenant isolation, no audit logging, limited monitoring, no disaster recovery plan, unclear secrets management',
} as const;
