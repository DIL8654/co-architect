import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../components';

const sampleDescription =
  'A B2B SaaS platform with React frontend, .NET API, cloud database, Blob Storage, no API gateway, no monitoring, no tenant isolation, no audit logging, no disaster recovery plan, and no secrets management.';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-65px)] max-w-5xl items-center px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <h1 className="text-5xl font-bold tracking-tight text-secondary-900">CoArchitect AI</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-secondary-600">
            Review a software architecture, calculate its Architecture Intelligence Score, and turn missing capabilities into clear recommendations.
          </p>
          <div className="mt-8 flex gap-3">
            <Button size="lg" onClick={() => navigate('/organizations')}>
              Start
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/organizations')}>
              Organizations
            </Button>
          </div>
        </div>

        <Card>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-secondary-500">Local MVP</p>
              <h2 className="mt-1 text-2xl font-bold text-secondary-900">No login required</h2>
            </div>
            <p className="text-sm leading-6 text-secondary-600">
              The hackathon MVP runs locally without login and can use cloud database, blob storage, and AI agent configuration when environment variables are provided.
            </p>
            <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-4 text-sm text-secondary-700">
              {sampleDescription}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
