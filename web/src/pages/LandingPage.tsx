import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, DiagramIcon, HealthIcon, LogoMark, SettingsIcon, SparkIcon } from '../components';

const sampleDescription =
  'A B2B SaaS platform with React frontend, .NET API, cloud database, Blob Storage, no API gateway, no monitoring, no tenant isolation, no audit logging, no disaster recovery plan, and no secrets management.';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="page-shell flex min-h-[calc(100vh-120px)] items-center">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <div className="mb-6 flex items-center gap-4">
            <span className="logo-shell h-14 w-14">
              <LogoMark className="h-11 w-11" />
            </span>
            <span className="rounded-full border border-secondary-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-600 dark:border-white/10 dark:bg-white/5 dark:text-cyan-200">
              Enterprise architecture review
            </span>
          </div>
          <h1 className="max-w-4xl text-5xl font-bold tracking-normal text-secondary-950 dark:text-white">CoArchitect AI</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-secondary-600 dark:text-secondary-300">
            Review a software architecture, calculate its Architecture Intelligence Score, and turn missing capabilities into clear recommendations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('/organizations')} icon={<SparkIcon className="h-5 w-5" />}>
              Start
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
          </div>
        </div>

        <Card>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-secondary-500 dark:text-secondary-400">Local MVP</p>
              <h2 className="mt-1 text-2xl font-bold text-secondary-950 dark:text-white">Cloud-connected local flow</h2>
            </div>
            <p className="text-sm leading-6 text-secondary-600 dark:text-secondary-300">
              Run the frontend locally, keep the backend in Docker, and point the app at TiDB, Azure Blob Storage, and Azure AI Foundry.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniFeature icon={<DiagramIcon className="h-4 w-4" />} label="Diagrams" />
              <MiniFeature icon={<SettingsIcon className="h-4 w-4" />} label="Foundry" />
              <MiniFeature icon={<HealthIcon className="h-4 w-4" />} label="Health" />
            </div>
            <div className="rounded-2xl border border-secondary-200 bg-secondary-50/80 p-4 text-sm leading-6 text-secondary-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-secondary-300">
              {sampleDescription}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MiniFeature({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-secondary-200 bg-white px-3 py-2 text-sm font-semibold text-secondary-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-secondary-200">
      <span className="text-primary-600 dark:text-cyan-200">{icon}</span>
      {label}
    </div>
  );
}
