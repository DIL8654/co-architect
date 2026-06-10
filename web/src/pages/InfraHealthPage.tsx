import { useQuery } from '@tanstack/react-query';
import { Badge, Breadcrumbs, Button, ErrorState, LoadingState } from '../components';
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
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
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
    <div className="page-shell">
      <section className="page-header">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Health' }]} />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="page-title">Infrastructure Health</h1>
            <p className="page-description">
              Verify the runtime connectivity required for architecture review. Last checked {new Date(data.checkedAt).toLocaleString()}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={statusVariant[data.status]}>{data.status}</Badge>
            <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? 'Checking...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="kpi-tile">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Overall</p>
          <p className="mt-2 text-2xl font-semibold text-secondary-950 dark:text-white">{data.status}</p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Checks</p>
          <p className="mt-2 text-2xl font-semibold text-secondary-950 dark:text-white">{data.checks.length}</p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Healthy</p>
          <p className="mt-2 text-2xl font-semibold text-secondary-950 dark:text-white">
            {data.checks.filter((item) => item.status === 'healthy').length}
          </p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Attention</p>
          <p className="mt-2 text-2xl font-semibold text-secondary-950 dark:text-white">
            {data.checks.filter((item) => item.status !== 'healthy').length}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-[#dde1e6] bg-white dark:border-white/10 dark:bg-[#08101d]">
        <table className="w-full">
          <thead className="border-b border-[#dde1e6] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Service</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Provider</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Message</th>
            </tr>
          </thead>
          <tbody>
            {data.checks.map((check) => (
              <tr key={check.name} className="border-b border-[#eef1f4] align-top last:border-0 dark:border-white/10">
                <td className="px-4 py-4 text-sm font-medium text-secondary-950 dark:text-white">{titleForCheck(check)}</td>
                <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">{check.provider}</td>
                <td className="px-4 py-4"><Badge variant={statusVariant[check.status]}>{check.status}</Badge></td>
                <td className="px-4 py-4 text-sm leading-6 text-secondary-700 dark:text-secondary-200">{check.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
