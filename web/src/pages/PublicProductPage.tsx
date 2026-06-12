import { Link } from 'react-router-dom';

const showcaseSections = [
  {
    eyebrow: 'Dashboard',
    title: 'Open a workspace and move straight into architecture review.',
    description: 'The app keeps workspaces, diagrams, scores, findings, and ADRs in one engineering-focused surface.',
    details: ['Workspace-centric navigation', 'Demo journeys and recent diagrams', 'Fast access to analysis and ADR history'],
  },
  {
    eyebrow: 'Diagram Workbench',
    title: 'Use one working screen for evidence, intelligence, findings, trade-offs, and ADRs.',
    description: 'The diagram page is the main workbench. Teams stay in context while switching between evidence, recommendations, run history, and decision records.',
    details: ['Tabbed diagram workbench', 'Visible score strip and freshness', 'Grounded context and agent workflow'],
  },
  {
    eyebrow: 'Agent Workflow',
    title: 'Make orchestration visible to users and judges.',
    description: 'CoArchitect shows the reasoning chain rather than hiding it behind a single result blob.',
    details: ['Intake, enrichment, retrieval, specialists, critic, composer', 'Application-led orchestration', 'One cost-aware Azure Foundry expert call'],
  },
  {
    eyebrow: 'ADR Workflow',
    title: 'Capture decisions with standards, trade-offs, and version history.',
    description: 'ADRs are linked back to analysis findings and can evolve as the architecture changes.',
    details: ['ADR preview, markdown, HTML, history', 'Grounded context used', 'Versioned decision records'],
  },
];

const groundingSources = [
  'Azure Well-Architected Framework',
  'AWS Well-Architected Framework',
  'ISO/IEC 25010',
  'OWASP ASVS',
  'ISO 27001, GDPR, and SOC 2 guidance',
  'TOGAF and SAFe governance cues',
  'Architecture principles and trade-off catalog',
  'Workspace review history and ADR history',
];

const demoJourneys = [
  {
    title: 'Automated Video Analysis Platform',
    description: 'Media ingestion, queued processing, AI enrichment, and metadata APIs.',
    image: '/demo/automate-video-analysis-architecture.png',
  },
  {
    title: 'Custom Document Processing Platform',
    description: 'Document upload, extraction, human review, and compliance-aware workflows.',
    image: '/demo/custom-document-processing-architecture.png',
  },
];

export function PublicProductPage() {
  return (
    <div className="public-page">
      <section className="public-band">
        <div className="public-section-heading">
          <p className="public-eyebrow">Product</p>
          <h1 className="public-section-title">A compact architecture reasoning platform for engineering teams.</h1>
          <p className="public-card-text max-w-3xl">
            CoArchitect AI reviews architecture diagrams and descriptions, shows how the agent workflow reasoned about them, and turns recommendations into decision records.
          </p>
        </div>
      </section>

      <section className="public-showcase-stack">
        {showcaseSections.map((section, index) => (
          <article key={section.title} className={`public-showcase-band ${index % 2 === 1 ? 'alt' : ''}`}>
            <div className="public-showcase-copy">
              <p className="public-eyebrow">{section.eyebrow}</p>
              <h2 className="public-section-title">{section.title}</h2>
              <p className="public-card-text">{section.description}</p>
              <div className="public-bullet-list">
                {section.details.map((detail) => (
                  <div key={detail} className="public-bullet-item">
                    {detail}
                  </div>
                ))}
              </div>
            </div>
            <div className="public-ui-preview">
              <PreviewMock section={section.eyebrow} />
            </div>
          </article>
        ))}
      </section>

      <section className="public-band">
        <div className="public-section-heading">
          <p className="public-eyebrow">Real demo journeys</p>
          <h2 className="public-section-title">The product walkthrough is built around real architecture diagrams.</h2>
          <p className="public-card-text max-w-3xl">
            These are the same synthetic diagrams used in the in-app demo flow, so the public site previews the actual review scenarios rather than abstract placeholders.
          </p>
        </div>
        <div className="public-demo-grid">
          {demoJourneys.map((journey) => (
            <article key={journey.title} className="public-demo-card">
              <div className="public-demo-image-frame">
                <img src={journey.image} alt={journey.title} className="public-demo-image" />
              </div>
              <div className="public-demo-copy">
                <h3 className="public-card-title">{journey.title}</h3>
                <p className="public-card-text">{journey.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="public-band public-band-alt">
        <div className="public-section-heading">
          <p className="public-eyebrow">Foundry IQ-style grounding</p>
          <h2 className="public-section-title">Recommendations are tied back to architecture knowledge and workspace memory.</h2>
        </div>
        <div className="public-grounding-grid">
          {groundingSources.map((source) => (
            <div key={source} className="public-grounding-card">
              {source}
            </div>
          ))}
        </div>
      </section>

      <section className="public-band">
        <div className="public-cta-band">
          <div>
            <p className="public-eyebrow">Try the app</p>
            <h2 className="public-section-title">Open the product and run a review.</h2>
          </div>
          <div className="public-hero-actions">
            <Link to="/app" className="public-cta">
              Try Now
            </Link>
            <Link to="/app/docs" className="public-secondary-cta">
              Knowledge Base
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function PreviewMock({ section }: { section: string }) {
  if (section === 'Dashboard') {
    return (
      <div className="public-preview-window">
        <div className="public-preview-toolbar">
          <span>Dashboard</span>
          <span>Latest journeys</span>
        </div>
        <div className="public-preview-grid public-preview-grid-dense">
          <div className="public-preview-panel tall">
            <div className="public-preview-kpi">74.6</div>
            <div className="public-preview-meta">Architecture Intelligence Score</div>
            <div className="public-preview-stat-stack">
              <div className="public-preview-stat-row">
                <span className="public-preview-stat-label">Active reviews</span>
                <span className="public-preview-stat-value">3</span>
              </div>
              <div className="public-preview-stat-row">
                <span className="public-preview-stat-label">ADRs tracked</span>
                <span className="public-preview-stat-value">7</span>
              </div>
            </div>
          </div>
          <div className="public-preview-panel">
            <p className="public-preview-section-label">Recent finding</p>
            <p className="public-preview-title">Missing API gateway and ingress policy</p>
            <p className="public-preview-copy">Public endpoints are exposed without a consistent gateway, rate policy, or edge security layer.</p>
          </div>
          <div className="public-preview-panel wide">
            <p className="public-preview-section-label">Top workspaces</p>
            <div className="public-preview-table">
              <div className="public-preview-table-row">
                <span>Automated Video Analysis</span>
                <span>78.2</span>
              </div>
              <div className="public-preview-table-row">
                <span>Custom Document Processing</span>
                <span>71.4</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'Diagram Workbench') {
    return (
      <div className="public-preview-window">
        <div className="public-preview-toolbar">
          <span>Diagram Workbench</span>
          <span>Architecture Intelligence</span>
        </div>
        <div className="public-workbench-preview">
          <div className="public-preview-canvas">
            <div className="public-preview-canvas-badge">Automated Video Analysis Architecture</div>
            <div className="public-preview-canvas-node primary">API</div>
            <div className="public-preview-canvas-node secondary">Blob Storage</div>
            <div className="public-preview-canvas-node tertiary">AI Pipeline</div>
          </div>
          <div className="public-preview-sidebar">
            <div className="public-preview-chip">Score 78.2</div>
            <p className="public-preview-title">Production Candidate</p>
            <div className="public-preview-chip-row">
              <span className="public-preview-chip">Azure WAF</span>
              <span className="public-preview-chip">OWASP ASVS</span>
            </div>
            <div className="public-preview-chip-row">
              <span className="public-preview-chip">ISO 27001</span>
              <span className="public-preview-chip">GDPR</span>
            </div>
            <p className="public-preview-copy">Queue isolation, retry handling, observability, and lifecycle controls are the highest-priority improvements.</p>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'Agent Workflow') {
    return (
      <div className="public-preview-window">
        <div className="public-preview-toolbar">
          <span>Agent Workflow</span>
          <span>12 stages</span>
        </div>
        <div className="public-pipeline-preview">
          {[
            ['Intake', 'completed'],
            ['Context Enrichment', 'completed'],
            ['Foundry IQ Retrieval', 'completed'],
            ['Framework Specialists', 'active'],
            ['Critic', 'pending'],
            ['Composer', 'pending'],
          ].map(([step, status]) => (
            <div key={step} className="public-pipeline-step">
              <span className={`public-pipeline-dot ${status === 'completed' || status === 'active' ? 'active' : ''} ${status === 'active' ? 'live' : ''}`} />
              <div>
                <p className="public-pipeline-title">{step}</p>
                <p className="public-preview-meta">
                  {status === 'completed' ? 'Completed with grounded context' : status === 'active' ? 'Running specialist review' : 'Waiting for prior stages'}
                </p>
              </div>
              <span className={`public-preview-status ${status}`}>{status === 'active' ? 'Running' : status === 'completed' ? 'Done' : 'Pending'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="public-preview-window">
      <div className="public-preview-toolbar">
        <span>ADR</span>
        <span>Version history</span>
      </div>
      <div className="space-y-3">
        <div className="public-preview-panel">
          <p className="public-preview-section-label">ADR</p>
          <p className="public-preview-title">Use Queue-Based Processing for Video Analysis</p>
          <p className="public-preview-copy">Adopt asynchronous queue-based workload isolation with retry, dead-letter handling, and operator visibility.</p>
        </div>
        <div className="public-preview-history">
          {['v3', 'v2', 'v1'].map((version) => (
            <div key={version} className="public-preview-history-row">
              <span className="public-preview-chip">{version}</span>
              <div className="min-w-0 flex-1">
                <p className="public-preview-history-title">
                  {version === 'v3' ? 'Added observability and cost controls' : version === 'v2' ? 'Added retry and dead-letter strategy' : 'Initial queue-based processing decision'}
                </p>
                <p className="public-preview-meta">Status: Accepted</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
