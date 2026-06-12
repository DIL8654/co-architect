import { Link } from 'react-router-dom';
import { DiagramIcon, DocsIcon, SparkIcon, WorkspaceIcon } from '../components';

const workflow = [
  {
    title: 'Upload architecture evidence',
    description: 'Create a workspace, add a diagram or architecture description, and capture the operating context.',
    icon: WorkspaceIcon,
  },
  {
    title: 'Run grounded analysis',
    description: 'Application-led agent orchestration combines Foundry IQ-style context with one cost-aware Foundry expert call.',
    icon: SparkIcon,
  },
  {
    title: 'Inspect findings and trade-offs',
    description: 'Review Architecture Intelligence Score, framework rationale, risks, trade-offs, and recommendation priorities.',
    icon: DiagramIcon,
  },
  {
    title: 'Generate ADRs',
    description: 'Turn review evidence into decision records with version history and grounded context.',
    icon: DocsIcon,
  },
];

const pillars = [
  {
    title: 'Grounded reasoning',
    description: 'Reviews are grounded in architecture frameworks, standards, principles, and trade-off guidance.',
  },
  {
    title: 'Enterprise review flow',
    description: 'The product is organized around workspaces, diagrams, analysis runs, findings, and ADRs.',
  },
  {
    title: 'Cost-aware AI usage',
    description: 'CoArchitect keeps the current runtime practical with one external Foundry expert call and local orchestration around it.',
  },
];

export function PublicHomePage() {
  return (
    <div className="public-page">
      <section className="public-hero">
        <div className="public-hero-copy">
          <p className="public-eyebrow">Architecture review for engineering teams</p>
          <h1 className="public-hero-title">Turn diagrams into grounded architecture decisions.</h1>
          <p className="public-hero-text">
            CoArchitect AI helps teams review architecture diagrams and descriptions through multi-agent reasoning, standards-backed findings, and decision-ready ADRs.
          </p>
          <div className="public-hero-actions">
            <Link to="/app" className="public-cta">
              Try Now
            </Link>
            <Link to="/product" className="public-secondary-cta">
              View Product
            </Link>
          </div>
        </div>

        <div className="public-showcase-card">
          <div className="public-showcase-window">
            <div className="public-window-header">
              <span>Architecture Intelligence</span>
              <span>Score calculated in app</span>
            </div>
            <div className="public-metric-row">
              <div>
                <p className="public-metric-label">Architecture Intelligence Score</p>
                <p className="public-metric-value">74.6</p>
              </div>
              <div className="public-status-pill">Production Candidate</div>
            </div>
            <div className="public-mini-grid">
              <MiniPanel title="Frameworks" lines={['Azure Well-Architected', 'OWASP ASVS', 'ISO/IEC 25010']} />
              <MiniPanel title="Standards used" lines={['ISO 27001', 'GDPR', 'SOC 2']} />
              <MiniPanel title="Top gap" lines={['API gateway and ingress policy are still missing.']} />
              <MiniPanel title="ADR signal" lines={['Queue-based processing adopted with retry and dead-letter strategy.']} />
            </div>
          </div>
        </div>
      </section>

      <section className="public-band">
        <div className="public-section-heading">
          <p className="public-eyebrow">How it works</p>
          <h2 className="public-section-title">A simple path from architecture evidence to decisions.</h2>
        </div>
        <div className="public-workflow-grid">
          {workflow.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="public-workflow-card">
                <span className="public-workflow-icon">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="public-card-title">{item.title}</h3>
                <p className="public-card-text">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="public-band public-band-alt">
        <div className="public-section-heading">
          <p className="public-eyebrow">Why teams use it</p>
          <h2 className="public-section-title">A workbench for architecture reasoning, not just prompt output.</h2>
        </div>
        <div className="public-pillars-grid">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="public-pillar-card">
              <h3 className="public-card-title">{pillar.title}</h3>
              <p className="public-card-text">{pillar.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-band">
        <div className="public-credibility-row">
          <div>
            <p className="public-eyebrow">Built for the current MVP</p>
            <h2 className="public-section-title">Foundry AI integration with a grounded intelligence layer.</h2>
          </div>
          <p className="public-card-text max-w-2xl">
            The current runtime combines Azure AI Foundry Agent Service, a Foundry IQ-style knowledge layer, TiDB-backed product data, and application-owned scoring so teams can see why recommendations were made.
          </p>
        </div>
      </section>
    </div>
  );
}

function MiniPanel({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="public-mini-panel">
      <p className="public-mini-title">{title}</p>
      {lines.map((line) => (
        <p key={line} className="public-mini-line">
          {line}
        </p>
      ))}
    </div>
  );
}
