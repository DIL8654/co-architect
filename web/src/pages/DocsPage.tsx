import { useState } from 'react';
import { Breadcrumbs, Card, SegmentedTabs } from '../components';

type KnowledgeTab = 'overview' | 'frameworks' | 'principles' | 'tradeoffs' | 'adr' | 'foundry';

export function DocsPage() {
  const [activeTab, setActiveTab] = useState<KnowledgeTab>('overview');
  const workflowRows = [
    ['Create workspace', 'Define the top-level architecture review boundary and activate it in the sidebar tree.'],
    ['Upload diagram', 'Add image evidence or a written architecture description to the selected workspace.'],
    ['Configure context', 'Choose auto-detection or manual frameworks, then tune quality attribute priorities.'],
    ['Run analysis', 'Send the architecture context to the configured reasoning agent and scoring pipeline.'],
    ['Review findings', 'Inspect missing controls, dimension scores, trade-offs, comments, grounding citations, and ADR output.'],
  ];

  const capabilityRows = [
    ['Architecture Intelligence Score', 'Final score calculated by the application scoring engine.'],
    ['Framework-aware review', 'Framework selection preview with Azure, AWS, ISO/IEC 25010, and OWASP ASVS support.'],
    ['Trade-off analysis', 'Structured pros, cons, and alternatives in a dedicated review table.'],
    ['ADR versioning', 'Persisted ADRs with markdown, HTML preview, and regeneration history.'],
    ['Infrastructure health', 'Connectivity checks for database, storage, and Azure AI Foundry configuration.'],
  ];

  const frameworkRows = [
    ['Azure Well-Architected', 'Reliability, security, cost optimization, operational excellence, and performance efficiency for Azure-oriented systems.'],
    ['AWS Well-Architected', 'Operational excellence, security, reliability, performance efficiency, cost optimization, and sustainability for AWS-oriented systems.'],
    ['ISO/IEC 25010', 'Product quality attributes such as maintainability, reliability, usability, portability, and performance efficiency.'],
    ['OWASP ASVS', 'Application and API security controls for authentication, access control, validation, cryptography, and data protection.'],
  ];

  const principleRows = [
    ['Security', 'Protect sensitive data, identity boundaries, secrets, and administrative operations.'],
    ['Reliability', 'Design for failure, recovery, observability, and resilient dependencies.'],
    ['Scalability', 'Separate workloads, apply asynchronous patterns, and avoid hidden bottlenecks.'],
    ['Maintainability', 'Keep decisions understandable, testable, and evolvable through ADRs and clear boundaries.'],
  ];

  const tradeoffRows = [
    ['Cost vs Reliability', 'Balance cheaper runtime choices with availability, backup, retry, and disaster recovery requirements.'],
    ['Simplicity vs Scalability', 'Avoid premature complexity while identifying the point where queues, partitioning, and autoscale become necessary.'],
    ['Security vs Usability', 'Protect users and data without making operational workflows impossible to execute.'],
    ['Managed Service vs Self-Hosted', 'Compare operational burden, lock-in, cost, compliance, and platform leverage.'],
  ];

  return (
    <div className="page-shell">
      <section className="page-header">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Documentation' }]} />
        <div>
          <h1 className="page-title">Documentation</h1>
          <p className="page-description">
            A concise product guide for the current unauthenticated architecture workbench and local demo flow.
          </p>
        </div>
      </section>

      <main className="space-y-5">
        <div className="panel p-2">
          <SegmentedTabs
            items={[
              { value: 'overview', label: 'Overview' },
              { value: 'frameworks', label: 'Frameworks' },
              { value: 'principles', label: 'Architecture Principles' },
              { value: 'tradeoffs', label: 'Trade-off Catalog' },
              { value: 'adr', label: 'ADR Templates' },
              { value: 'foundry', label: 'Foundry IQ' },
            ]}
            activeValue={activeTab}
            onChange={(value) => setActiveTab(value as KnowledgeTab)}
          />
        </div>

        {activeTab === 'overview' ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card header="Overview">
            <div id="overview" className="space-y-3 text-sm leading-7 text-secondary-700 dark:text-secondary-200">
              <p>
                CoArchitect AI is an architecture reasoning workbench for organizing workspaces, running multi-framework analysis, reviewing trade-offs, and shaping architecture decision records.
              </p>
              <p>
                The current product flow is intentionally unauthenticated so teams can focus on architecture quality, AI review behavior, and demo execution without login friction.
              </p>
            </div>
          </Card>

          <Card header="Workflow">
            <div id="workflow" className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#dde1e6] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Step</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">What Happens</th>
                  </tr>
                </thead>
                <tbody>
                  {workflowRows.map(([step, description]) => (
                    <tr key={step} className="border-b border-[#eef1f4] last:border-0 dark:border-white/10">
                      <td className="px-4 py-4 text-sm font-medium text-secondary-950 dark:text-white">{step}</td>
                      <td className="px-4 py-4 text-sm text-secondary-700 dark:text-secondary-200">{description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          </div>
        ) : null}

        {activeTab === 'frameworks' ? (
          <KnowledgeTable title="Framework Knowledge" rows={frameworkRows} />
        ) : null}

        {activeTab === 'principles' ? (
          <KnowledgeTable title="Architecture Principles" rows={principleRows} />
        ) : null}

        {activeTab === 'tradeoffs' ? (
          <KnowledgeTable title="Trade-off Catalog" rows={tradeoffRows} />
        ) : null}

        {activeTab === 'adr' ? (
          <Card header="ADR Templates">
            <div className="space-y-3 text-sm leading-7 text-secondary-700 dark:text-secondary-200">
              <p>
                ADR generation uses a consistent template: context, decision, alternatives, trade-offs, consequences, risks, frameworks used, related findings, and version history.
              </p>
              <p>
                Demo ADRs are persisted with multiple versions so evaluators can inspect how decisions evolve as recommendations mature.
              </p>
            </div>
          </Card>
        ) : null}

        {activeTab === 'foundry' ? (
          <div className="space-y-5">
            <Card header="Foundry IQ-style Intelligence Layer">
              <div className="space-y-3 text-sm leading-7 text-secondary-700 dark:text-secondary-200">
                <p>
                  Agents use a shared context bundle before reasoning. The bundle combines framework summaries, architecture principles, trade-off guidance, ADR templates, workspace memory, prior findings, and citations.
                </p>
                <p>
                  Seeded demo analyses include captured Foundry IQ context so recommendations can be inspected without rerunning Azure Foundry.
                </p>
              </div>
            </Card>
            <Card header="Grounded Context Categories">
              <div className="grid gap-3 md:grid-cols-3">
                {['Framework knowledge', 'Architecture principles', 'Trade-off catalog', 'ADR templates', 'Workspace memory', 'Citation references'].map((item) => (
                  <div key={item} className="rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-3 text-sm font-medium text-secondary-900 dark:border-white/10 dark:bg-white/[0.03] dark:text-white">
                    {item}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'overview' ? (
          <>
          <Card header="Capabilities">
            <div id="capabilities" className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#dde1e6] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Capability</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Current Behavior</th>
                  </tr>
                </thead>
                <tbody>
                  {capabilityRows.map(([name, description]) => (
                    <tr key={name} className="border-b border-[#eef1f4] last:border-0 dark:border-white/10">
                      <td className="px-4 py-4 text-sm font-medium text-secondary-950 dark:text-white">{name}</td>
                      <td className="px-4 py-4 text-sm text-secondary-700 dark:text-secondary-200">{description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card header="Operational Notes">
            <div id="notes" className="space-y-3 text-sm leading-7 text-secondary-700 dark:text-secondary-200">
              <p>
                Health checks are available under Settings so you can confirm infrastructure connectivity before the demo flow starts.
              </p>
              <p>
                Azure AI Foundry settings are stored in the application database for local runs. The API key remains write-only after save.
              </p>
              <p>
                ADR generation creates persisted decision records with version history. PDF export remains a future enhancement.
              </p>
            </div>
          </Card>
          </>
        ) : null}
      </main>
    </div>
  );
}

function KnowledgeTable({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <Card header={title}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-[#dde1e6] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Source</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">How agents use it</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, description]) => (
              <tr key={name} className="border-b border-[#eef1f4] last:border-0 dark:border-white/10">
                <td className="px-4 py-4 text-sm font-medium text-secondary-950 dark:text-white">{name}</td>
                <td className="px-4 py-4 text-sm leading-6 text-secondary-700 dark:text-secondary-200">{description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
