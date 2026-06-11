#!/usr/bin/env node

const baseUrl = (process.argv[2] || process.env.API_BASE_URL || 'http://localhost:5010').replace(/\/$/, '');
const suffix = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

const sampleDescription = `A B2B SaaS platform with React frontend, .NET backend APIs, PostgreSQL/TiDB database, blob storage, background jobs, and enterprise customers in Europe.

It currently has no API gateway, no tenant isolation strategy, no audit logging, no disaster recovery plan, limited monitoring, and unclear secrets management.`;

const reviewSetup = {
  businessDomain: 'B2B SaaS',
  targetUsers: 'Enterprise customers and tenant administrators',
  expectedTraffic: 'Moderate traffic with enterprise onboarding spikes',
  dataSensitivity: 'PII and tenant-specific business data',
  cloudProviderPreference: 'Azure',
  complianceNeeds: 'GDPR, audit logging, tenant isolation, operational evidence',
  currentPainPoints: 'No API gateway, no tenant isolation, no audit logging, limited monitoring, no disaster recovery plan, unclear secrets management',
  frameworkSelectionMode: 'AutoDetect',
  requestedFrameworks: [],
  qualityAttributeWeights: [
    { key: 'security', label: 'Security', weight: 25 },
    { key: 'availability', label: 'Availability', weight: 20 },
    { key: 'scalability', label: 'Scalability', weight: 15 },
    { key: 'cost', label: 'Cost', weight: 10 },
    { key: 'maintainability', label: 'Maintainability', weight: 10 },
    { key: 'compliance', label: 'Compliance', weight: 10 },
    { key: 'deliverySpeed', label: 'Delivery Speed', weight: 10 },
  ],
};

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const body = text && contentType.includes('application/json') ? JSON.parse(text) : text;

  if (!response.ok) {
    const detail = typeof body === 'object' && body !== null ? body.detail || body.title || JSON.stringify(body) : text;
    throw new Error(`${options.method || 'GET'} ${path} returned ${response.status}: ${detail}`);
  }

  return body;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log(`Running CoArchitect AI smoke flow against ${baseUrl}`);

  await request('/health');
  const infra = await request('/api/infra-health');
  assert(infra.status !== 'unhealthy', `Infrastructure status is ${infra.status}`);

  const workspace = await request('/api/workspaces', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: `Smoke Workspace ${suffix}` }),
  });
  assert(workspace.id, 'Workspace response did not include an id');

  const form = new FormData();
  form.append('workspaceId', workspace.id);
  form.append('name', `Smoke Architecture ${suffix}`);
  form.append('description', sampleDescription);
  form.append('reviewSetupJson', JSON.stringify(reviewSetup));

  const diagram = await request(`/api/workspaces/${workspace.id}/diagrams`, {
    method: 'POST',
    body: form,
  });
  assert(diagram.id, 'Diagram response did not include an id');

  const analysis = await request(`/api/workspaces/${workspace.id}/diagrams/${diagram.id}/analysis-runs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  assert(analysis.id, 'Analysis response did not include an id');
  assert(Array.isArray(analysis.agentTrace) && analysis.agentTrace.length > 0, 'Analysis response did not include agent trace');
  if (!analysis.foundryIqContext) {
    console.warn('Warning: analysis response did not include Foundry IQ context. Restart the API if it is running an older build.');
  }

  const adr = await request(`/api/workspaces/${workspace.id}/diagrams/${diagram.id}/adrs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  assert(adr.id, 'ADR response did not include an id');
  assert(adr.latestVersionNumber >= 1, 'ADR response did not include a version');

  console.log('Smoke flow passed.');
  console.log(`Workspace: ${workspace.id}`);
  console.log(`Diagram: ${diagram.id}`);
  console.log(`Analysis: ${analysis.id}`);
  console.log(`ADR: ${adr.id}`);
}

main().catch((error) => {
  console.error(error.cause?.message || error.message);
  process.exitCode = 1;
});
