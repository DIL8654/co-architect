import { Outlet, useNavigate } from 'react-router-dom';

export function AppLayout() {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="top-nav">
        <button type="button" className="brand" onClick={() => navigate('/')}>
          CoArchitect AI
        </button>
        <nav className="top-nav-items">
          <button type="button" onClick={() => navigate('/organizations')}>
            Organizations
          </button>
          <button type="button" onClick={() => navigate('/organizations/new')}>
            New Organization
          </button>
          <button type="button" onClick={() => navigate('/health')}>
            Health
          </button>
        </nav>
      </header>

      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}
