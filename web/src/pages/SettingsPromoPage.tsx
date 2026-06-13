import { Breadcrumbs, LogoMark } from '../components';

const PROMO_MOTTO = 'Ground Architecture Decisions in Evidence, Context, And AI Reasoning.';
const PROMO_SUPPORT = 'CoArchitect AI helps teams review diagrams, expose trade-offs, and turn architecture analysis into clear decision records.';

export function SettingsPromoPage() {
  return (
    <div className="page-shell">
      <section className="page-header">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Settings', to: '/app/settings' }, { label: 'Promo' }]} />
        <div>
          <h1 className="page-title">Promo Capture</h1>
          <p className="page-description">A screenshot-ready brand surface for quick product promotion and demo assets.</p>
        </div>
      </section>

      <section className="promo-hero">
        <div className="promo-hero-glow" aria-hidden="true" />
        <div className="promo-hero-content">
          <span className="promo-badge">CoArchitect AI</span>
          <LogoMark className="promo-logo" />
          <h2 className="promo-title">{PROMO_MOTTO}</h2>
          <p className="promo-copy">{PROMO_SUPPORT}</p>
        </div>
      </section>
    </div>
  );
}
