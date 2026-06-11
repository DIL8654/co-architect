import { useState } from 'react';
import { Breadcrumbs, Card, SegmentedTabs } from '../components';

type KnowledgeTab =
  | 'overview'
  | 'workflow'
  | 'capabilities'
  | 'frameworks'
  | 'principles'
  | 'tradeoffs'
  | 'adr'
  | 'foundry';

export function DocsPage() {
  const [activeTab, setActiveTab] = useState<KnowledgeTab>('overview');

  const workflowRows = [
    ['1. Add architecture evidence', 'Create a workspace, then add a diagram image or a written architecture description.'],
    ['2. Add review context', 'Tell the system about users, traffic, data sensitivity, cloud preference, and pain points.'],
    ['3. Choose frameworks', 'Use auto-detect or pick frameworks yourself. The system explains why each one was chosen.'],
    ['4. Gather grounded context', 'Foundry IQ pulls in framework notes, principles, trade-offs, ADR templates, and workspace history.'],
    ['5. Run the agent workflow', 'The planner, specialists, critic, and composer reason over the same grounded context bundle.'],
    ['6. Calculate the score', 'AI suggests maturity evidence, then application code calculates the final Architecture Intelligence Score.'],
    ['7. Review outcomes', 'Inspect findings, recommendations, trade-offs, analysis history, and agent workflow for each run.'],
    ['8. Generate ADRs', 'Turn the review into a decision record with versions, HTML preview, and printable export.'],
  ];

  const capabilityRows = [
    ['Workspace-centric navigation', 'The product is organized around workspaces and diagrams, not organization setup screens.'],
    ['Architecture review', 'Analyze image-based diagrams and text descriptions in one workbench.'],
    ['Framework-aware reasoning', 'Use Azure Well-Architected, AWS Well-Architected, ISO/IEC 25010, and OWASP ASVS.'],
    ['Foundry IQ grounding', 'Ground recommendations with knowledge sources, principles, trade-offs, and workspace memory.'],
    ['Architecture Intelligence Score', 'Show the final score, score band, and dimension breakdown in every completed review.'],
    ['Agent workflow trace', 'Inspect how the agents worked step by step for each analysis run.'],
    ['ADR version history', 'Generate ADRs, regenerate them, and review version history in the same diagram workbench.'],
    ['Browser-print export', 'Export diagram reviews and ADRs through clean printable views for Save as PDF.'],
  ];

  const frameworkRows = [
    ['Azure Well-Architected', 'Used when the architecture mentions Azure services or Azure-style platform choices.'],
    ['AWS Well-Architected', 'Used when the architecture shows AWS services or AWS-style platform patterns.'],
    ['ISO/IEC 25010', 'Used to review quality attributes like reliability, maintainability, and performance.'],
    ['OWASP ASVS', 'Used when the system has APIs, user data, security controls, or external access.'],
  ];

  const principleRows = [
    ['Simplicity', 'Keep the design understandable and avoid adding complexity without a clear reason.'],
    ['Scalability', 'Separate heavy workloads and remove bottlenecks before growth turns them into outages.'],
    ['Reliability', 'Design for failure, recovery, monitoring, backups, and disaster planning.'],
    ['Security', 'Protect users, secrets, data, and administrative actions.'],
    ['Maintainability', 'Make the architecture easier to change through clear boundaries and ADRs.'],
    ['Cost Optimization', 'Control spend without weakening the core reliability or security posture.'],
    ['Operational Excellence', 'Improve deployment, observability, incident handling, and day-to-day operations.'],
  ];

  const tradeoffRows = [
    ['Cost vs Reliability', 'Cheaper choices can increase failure risk if backup, retry, or recovery work is skipped.'],
    ['Simplicity vs Scalability', 'A simple design is easier to ship, but some systems need queues, caching, or partitioning to grow safely.'],
    ['Security vs Usability', 'Strong controls protect users, but they should still allow teams to work efficiently.'],
    ['Speed vs Governance', 'Fast delivery helps teams move, but missing standards can create expensive rework later.'],
    ['Build vs Buy', 'Custom systems give flexibility, while managed services reduce operational effort.'],
    ['Managed Service vs Self-Hosted', 'Managed platforms trade operational simplicity for platform dependency and pricing trade-offs.'],
  ];

  return (
    <div className="page-shell">
      <section className="page-header">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Knowledge Base' }]} />
        <div>
          <h1 className="page-title">Knowledge Base</h1>
          <p className="page-description">
            A simple guide to how CoArchitect AI reviews architecture, calculates scores, and turns findings into ADRs.
          </p>
        </div>
      </section>

      <main className="space-y-5">
        <div className="panel p-2">
          <SegmentedTabs
            items={[
              { value: 'overview', label: 'Overview' },
              { value: 'workflow', label: 'Workflow' },
              { value: 'capabilities', label: 'Capabilities' },
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
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_360px]">
            <Card header="What CoArchitect AI Does">
              <div className="space-y-3 text-sm leading-7 text-secondary-700 dark:text-secondary-200">
                <p>
                  CoArchitect AI is an architecture review workbench. You add a diagram or an architecture description, run analysis, and inspect the reasoning, score, findings, trade-offs, and ADRs in one place.
                </p>
                <p>
                  A workspace is the top-level container. A diagram is one piece of architecture evidence inside that workspace. Each analysis run becomes part of the history for that diagram.
                </p>
                <p>
                  The product exists to help teams make architecture decisions faster, with clearer reasoning and better documentation.
                </p>
              </div>
            </Card>

            <Card header="How Scoring Works">
              <div className="space-y-3 text-sm leading-7 text-secondary-700 dark:text-secondary-200">
                <p>
                  The AI does not invent the final score by itself. It suggests maturity evidence for each dimension, such as security or reliability.
                </p>
                <p>
                  Then the application scoring service calculates the final Architecture Intelligence Score using the stored weighting model.
                </p>
                <p>
                  This keeps the score explainable, repeatable, and safer than asking the model to make up a number on its own.
                </p>
              </div>
            </Card>

            <Card header="Operational Notes">
              <div className="space-y-3 text-sm leading-7 text-secondary-700 dark:text-secondary-200">
                <p>Local development works with the mock provider, so you can test the full review flow without Azure credentials.</p>
                <p>When Azure AI Foundry is configured, the runtime can use one cost-aware expert call while keeping the rest of the orchestration in application code.</p>
                <p>Exports currently use browser-print layouts. Open the printable view and use Save as PDF from the browser.</p>
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'workflow' ? <KnowledgeTable title="Analysis Workflow" rows={workflowRows} firstColumnLabel="Step" secondColumnLabel="What happens" /> : null}

        {activeTab === 'capabilities' ? <KnowledgeTable title="Current Capabilities" rows={capabilityRows} firstColumnLabel="Capability" secondColumnLabel="Current behavior" /> : null}

        {activeTab === 'frameworks' ? <KnowledgeTable title="Framework Knowledge" rows={frameworkRows} /> : null}

        {activeTab === 'principles' ? <KnowledgeTable title="Architecture Principles" rows={principleRows} /> : null}

        {activeTab === 'tradeoffs' ? <KnowledgeTable title="Trade-off Catalog" rows={tradeoffRows} /> : null}

        {activeTab === 'adr' ? (
          <Card header="ADR Templates">
            <div className="space-y-3 text-sm leading-7 text-secondary-700 dark:text-secondary-200">
              <p>
                ADR generation follows a simple structure: context, decision, alternatives, trade-offs, consequences, risks, frameworks used, and related findings.
              </p>
              <p>
                Each regeneration creates a new version, so teams can see how the decision changed over time.
              </p>
              <p>
                The current export flow uses a printable browser view. It is built for clean Save as PDF output during reviews and demos.
              </p>
            </div>
          </Card>
        ) : null}

        {activeTab === 'foundry' ? (
          <div className="space-y-5">
            <Card header="What Foundry IQ Means Here">
              <div className="space-y-3 text-sm leading-7 text-secondary-700 dark:text-secondary-200">
                <p>
                  Foundry IQ is the grounded knowledge layer behind the agents. It gives them architecture context before they start reasoning.
                </p>
                <p>
                  Instead of relying only on a prompt, the agents read framework notes, architecture principles, trade-off guidance, ADR templates, workspace memory, and prior findings.
                </p>
              </div>
            </Card>

            <KnowledgeTable
              title="Foundry IQ Context Sources"
              rows={[
                ['Framework knowledge', 'Helps the system review Azure, AWS, quality, and security concerns with the right lens.'],
                ['Architecture principles', 'Helps recommendations stay aligned with things like simplicity, reliability, and maintainability.'],
                ['Trade-off catalog', 'Helps the trade-off agent explain what is gained and what is given up.'],
                ['ADR templates', 'Helps turn findings into a cleaner, more structured decision record.'],
                ['Workspace memory', 'Helps the system reuse previous findings, ADR history, and review context.'],
                ['Citation references', 'Helps judges and users see why a recommendation was made.'],
              ]}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}

function KnowledgeTable({
  title,
  rows,
  firstColumnLabel = 'Source',
  secondColumnLabel = 'How the system uses it',
}: {
  title: string;
  rows: string[][];
  firstColumnLabel?: string;
  secondColumnLabel?: string;
}) {
  return (
    <Card header={title}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-[#dde1e6] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">{firstColumnLabel}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">{secondColumnLabel}</th>
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
