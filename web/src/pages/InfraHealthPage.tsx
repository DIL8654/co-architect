import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, ErrorState, HealthIcon, LoadingState } from '../components';
import { infraHealthApi, type InfraHealthCheck } from '../api/infraHealth';

const statusVariant = {
  healthy: 'success',
  degraded: 'warning',
  unhealthy: 'error',
  unknown: 'secondary',
} as const;

function titleForCheck(check: InfraHealthCheck) {
  switch (check.name) {
    case 'database':
      return 'Database';
    case 'blobStorage':
      return 'Blob Storage';
    case 'azureFoundry':
      return 'Azure AI Foundry';
    default:
      return check.name;
  }
}

export function InfraHealthPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['infra-health'],
    queryFn: () => infraHealthApi.getInfraHealth(),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <LoadingState message="Checking infrastructure..." />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Health check failed"
        message="Could not load infrastructure health from the API."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  return (
    <div className="page-shell max-w-5xl">
      <section className="page-header">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="glow-icon">
              <HealthIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="page-title">Infrastructure Health</h1>
              <p className="page-description mt-2">
                Last checked {new Date(data.checkedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={statusVariant[data.status]}>{data.status}</Badge>
            <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? 'Checking...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4">
        {data.checks.map((check) => (
          <Card key={check.name}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-secondary-950 dark:text-white">{titleForCheck(check)}</h2>
                <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">{check.provider}</p>
              </div>
              <Badge variant={statusVariant[check.status]}>{check.status}</Badge>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-secondary-700 dark:text-secondary-200">
              {check.message}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
