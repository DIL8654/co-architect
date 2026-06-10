import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, LogoMark } from '../components';
import { useLocalProfileStore } from '../stores/useLocalProfileStore';

export function LocalSetupPage() {
  const navigate = useNavigate();
  const setProfile = useLocalProfileStore((state) => state.setProfile);
  const [displayName, setDisplayName] = useState('');
  const [organizationLabel, setOrganizationLabel] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!displayName.trim()) {
      setError('Display name is required.');
      return;
    }

    setProfile({
      displayName: displayName.trim(),
      organizationLabel: organizationLabel.trim(),
    });
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] px-4 py-10 dark:bg-[#060b16]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center">
        <section className="w-full max-w-xl rounded-2xl border border-[#dde1e6] bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#08101d] dark:shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <div className="flex items-center gap-4">
            <span className="logo-shell">
              <LogoMark className="h-10 w-10" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-secondary-500">Local setup</p>
              <h1 className="mt-1 text-2xl font-bold text-secondary-950 dark:text-white">Set up your CoArchitect workspace</h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-secondary-600 dark:text-secondary-300">
            This lightweight setup is only for local identification during the hackathon demo. It does not create an
            organization object or enable authentication.
          </p>

          <div className="mt-8 space-y-5">
            <label className="block">
              <span className="form-label">Display name</span>
              <input
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setError('');
                }}
                placeholder="Jane Architect"
                className="form-input"
                autoFocus
              />
            </label>

            <label className="block">
              <span className="form-label">Organization label (optional)</span>
              <input
                value={organizationLabel}
                onChange={(event) => setOrganizationLabel(event.target.value)}
                placeholder="Northwind Platform Team"
                className="form-input"
              />
            </label>

            {error ? (
              <div className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/25 dark:bg-error-500/10 dark:text-error-200">
                {error}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button onClick={handleContinue}>Continue to CoArchitect</Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
