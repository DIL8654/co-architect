import { Link, NavLink, Outlet } from 'react-router-dom';
import { LogoMark, MoonIcon, SunIcon, SystemIcon } from '../components';
import { useTheme, type ThemeMode } from '../hooks/useTheme';

export function PublicSiteLayout() {
  const { theme, setTheme } = useTheme();
  const themeItems: Array<{ value: ThemeMode; label: string; icon: typeof SunIcon }> = [
    { value: 'dark', label: 'Dark mode', icon: MoonIcon },
    { value: 'light', label: 'Light mode', icon: SunIcon },
    { value: 'system', label: 'System mode', icon: SystemIcon },
  ];

  return (
    <div className="public-shell">
      <header className="public-header">
        <div className="public-header-inner">
          <NavLink to="/" className="public-brand" aria-label="CoArchitect AI public home">
            <span className="logo-shell">
              <LogoMark className="h-9 w-9" />
            </span>
            <span className="brand-copy">
              <span className="brand-title">CoArchitect AI</span>
              <span className="brand-subtitle">Architecture Reasoning Platform</span>
            </span>
          </NavLink>

          <div className="public-header-actions">
            <nav className="public-nav" aria-label="Public navigation">
              <NavLink to="/" end className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}>
                Home
              </NavLink>
              <NavLink to="/product" className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}>
                Product
              </NavLink>
            </nav>

            <Link to="/app" className="public-cta">
              Try Now
            </Link>
          </div>
        </div>
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="public-footer-inner">
          <div>
            <p className="public-footer-title">CoArchitect AI</p>
            <p className="public-footer-copy">Multi-agent architecture review, grounded analysis, and ADR generation.</p>
          </div>
          <div className="public-footer-actions">
            <div className="theme-switcher" aria-label="Theme mode">
              {themeItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.value}
                    type="button"
                    title={item.label}
                    aria-label={item.label}
                    className={`theme-button ${theme === item.value ? 'active' : ''}`}
                    onClick={() => setTheme(item.value)}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
            <Link to="/product" className="public-footer-link">
              Product
            </Link>
            <Link to="/app/docs" className="public-footer-link">
              Knowledge Base
            </Link>
            <Link to="/app" className="public-footer-link">
              Open App
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
