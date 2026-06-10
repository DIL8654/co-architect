import { Breadcrumbs, Card } from '../components';

export function DocsPage() {
  const workflowRows = [
    ['Create organization', 'Define the top-level architecture boundary and activate it in the sidebar tree.'],
    ['Create workspace', 'Group product areas, platform domains, or review scopes under the organization.'],
    ['Upload diagram', 'Add image evidence or a written architecture description to the selected workspace.'],
    ['Run analysis', 'Send the architecture context to the configured reasoning agent and scoring pipeline.'],
    ['Review findings', 'Inspect missing controls, dimension scores, trade-offs, comments, and ADR draft output.'],
  ];

  const capabilityRows = [
    ['Architecture Intelligence Score', 'Final score calculated by the application scoring engine.'],
    ['Framework-aware review', 'Framework selection preview with Azure, AWS, ISO/IEC 25010, and OWASP ASVS support.'],
    ['Trade-off analysis', 'Structured pros, cons, and alternatives in a dedicated review table.'],
    ['ADR draft', 'Document-style preview with markdown and HTML views for downstream export work.'],
    ['Infrastructure health', 'Connectivity checks for database, storage, and Azure AI Foundry configuration.'],
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

      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="panel p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Contents</p>
          <nav className="mt-3 space-y-2 text-sm">
            <a href="#overview" className="block text-secondary-700 dark:text-secondary-200">Overview</a>
            <a href="#workflow" className="block text-secondary-700 dark:text-secondary-200">Workflow</a>
            <a href="#capabilities" className="block text-secondary-700 dark:text-secondary-200">Capabilities</a>
            <a href="#notes" className="block text-secondary-700 dark:text-secondary-200">Operational Notes</a>
          </nav>
        </aside>

        <main className="space-y-5">
          <Card header="Overview">
            <div id="overview" className="space-y-3 text-sm leading-7 text-secondary-700 dark:text-secondary-200">
              <p>
                CoArchitect AI is an architecture reasoning workbench for organizing diagrams, running multi-framework analysis, reviewing trade-offs, and shaping architecture decision records.
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
                ADR generation is currently a client-side document draft experience that prepares the UX for later persistence and export support.
              </p>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
