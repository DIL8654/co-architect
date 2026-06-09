import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, ErrorState, LoadingState } from '../components';
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
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-secondary-900">Infrastructure Health</h1>
          <p className="mt-2 text-secondary-600">
            Last checked {new Date(data.checkedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusVariant[data.status]}>{data.status}</Badge>
          <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Checking...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {data.checks.map((check) => (
          <Card key={check.name}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-secondary-900">{titleForCheck(check)}</h2>
                <p className="mt-1 text-sm text-secondary-500">{check.provider}</p>
              </div>
              <Badge variant={statusVariant[check.status]}>{check.status}</Badge>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-secondary-700">
              {check.message}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
