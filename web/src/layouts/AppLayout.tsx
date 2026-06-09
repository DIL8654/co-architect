import { NavLink, Outlet } from 'react-router-dom';
import {
  BuildingIcon,
  DashboardIcon,
  DocsIcon,
  HealthIcon,
  LogoMark,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  SystemIcon,
  UserIcon,
} from '../components';
import { useTheme, type ThemeMode } from '../hooks/useTheme';

export function AppLayout() {
  const { theme, setTheme } = useTheme();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { to: '/organizations', label: 'Organizations', icon: BuildingIcon },
    { to: '/health', label: 'Infra Health', icon: HealthIcon },
    { to: '/docs', label: 'Docs', icon: DocsIcon },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const themeItems: Array<{ value: ThemeMode; label: string; icon: typeof SunIcon }> = [
    { value: 'dark', label: 'Dark mode', icon: MoonIcon },
    { value: 'light', label: 'Light mode', icon: SunIcon },
    { value: 'system', label: 'System mode', icon: SystemIcon },
  ];

  return (
    <div className="app-shell">
      <header className="top-nav">
        <NavLink to="/" className="brand" aria-label="CoArchitect AI home">
          <span className="logo-shell">
            <LogoMark className="h-9 w-9" />
          </span>
          <span>
            <span className="brand-title">CoArchitect AI</span>
            <span className="brand-subtitle">Architecture Intelligence</span>
          </span>
        </NavLink>

        <div className="header-actions">
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
          <div className="profile-chip" title="Local MVP user">
            <UserIcon className="h-5 w-5" />
          </div>
        </div>
      </header>

      <aside className="side-nav" aria-label="Primary navigation">
        <div className="side-nav-section">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `side-nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </aside>

      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}
