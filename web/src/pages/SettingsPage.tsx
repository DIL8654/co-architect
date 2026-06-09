import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, ErrorState, LoadingState, SettingsIcon } from '../components';
import { getAiFoundrySettings, saveAiFoundrySettings } from '../api/settings';
import { getErrorMessage } from '../api/axios';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['ai-foundry-settings'],
    queryFn: getAiFoundrySettings,
  });

  const [form, setForm] = useState({
    projectEndpoint: '',
    agentId: '',
    modelDeployment: '',
    apiVersion: '',
    apiKey: '',
    clearApiKey: false,
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!data) return;
    setForm((current) => ({
      ...current,
      projectEndpoint: data.projectEndpoint ?? '',
      agentId: data.agentId ?? '',
      modelDeployment: data.modelDeployment ?? '',
      apiVersion: data.apiVersion ?? '',
      apiKey: '',
      clearApiKey: false,
    }));
  }, [data]);

  const mutation = useMutation({
    mutationFn: saveAiFoundrySettings,
    onSuccess: (saved) => {
      queryClient.setQueryData(['ai-foundry-settings'], saved);
      setForm((current) => ({ ...current, apiKey: '', clearApiKey: false }));
      setMessage('AI Foundry settings saved.');
    },
    onError: (saveError) => {
      setMessage(getErrorMessage(saveError));
    },
  });

  if (isLoading) return <LoadingState message="Loading settings..." />;

  if (isError) {
    return (
      <ErrorState
        title="Failed to load settings"
        message={getErrorMessage(error)}
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  const update = (field: keyof typeof form, value: string | boolean) => {
    setMessage('');
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate({
      projectEndpoint: form.projectEndpoint.trim(),
      agentId: form.agentId.trim(),
      modelDeployment: form.modelDeployment.trim(),
      apiVersion: form.apiVersion.trim(),
      apiKey: form.apiKey.trim() || undefined,
      clearApiKey: form.clearApiKey,
    });
  };

  return (
    <div className="page-shell">
      <section className="page-header">
        <div className="flex items-center gap-4">
          <div className="glow-icon">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-description mt-2">
              Save Azure AI Foundry connection settings in the application database for local runs. The API key is write-only after save.
            </p>
          </div>
        </div>
      </section>

      <Card header="Use Your Own Azure AI Foundry">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Field
              label="Project endpoint"
              value={form.projectEndpoint}
              onChange={(value) => update('projectEndpoint', value)}
              placeholder="https://.../responses"
              required
            />
            <Field
              label="Agent id"
              value={form.agentId}
              onChange={(value) => update('agentId', value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              required
            />
            <Field
              label="Model deployment"
              value={form.modelDeployment}
              onChange={(value) => update('modelDeployment', value)}
              placeholder="gpt-4.1-mini"
              required
            />
            <Field
              label="API version"
              value={form.apiVersion}
              onChange={(value) => update('apiVersion', value)}
              placeholder="2025-05-15-preview"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-secondary-800 dark:text-secondary-100">
              API key
            </label>
            <input
              type="password"
              value={form.apiKey}
              onChange={(event) => update('apiKey', event.target.value)}
              placeholder={data?.hasApiKey ? `Saved key ${data.apiKeyPreview ?? ''}` : 'Paste API key'}
              className="w-full rounded-xl border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <p className="mt-2 text-xs text-secondary-500 dark:text-secondary-400">
              Leave blank to keep the saved key. The server never returns the full key to the browser.
            </p>
          </div>

          <label className="flex items-center gap-3 text-sm text-secondary-700 dark:text-secondary-300">
            <input
              type="checkbox"
              checked={form.clearApiKey}
              onChange={(event) => update('clearApiKey', event.target.checked)}
              className="h-4 w-4 rounded border-secondary-300 text-primary-600"
            />
            Clear saved API key on save
          </label>

          {message && (
            <div className="rounded-xl border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm text-secondary-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-secondary-200">
              {message}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" isLoading={mutation.isPending}>
              Save settings
            </Button>
            <Button type="button" variant="secondary" onClick={() => window.location.assign('/health')}>
              Check health
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-secondary-800 dark:text-secondary-100">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-secondary-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
    </label>
  );
}
