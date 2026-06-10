import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Breadcrumbs, Button, ErrorState, LoadingState } from '../components';
import { getErrorMessage } from '../api/axios';
import { getAiFoundrySettings, saveAiFoundrySettings } from '../api/settings';
import { useLocalProfileStore } from '../stores/useLocalProfileStore';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const displayName = useLocalProfileStore((state) => state.displayName);
  const organizationLabel = useLocalProfileStore((state) => state.organizationLabel);
  const setProfile = useLocalProfileStore((state) => state.setProfile);
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
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    organizationLabel: '',
  });
  const [profileMessage, setProfileMessage] = useState('');

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

  useEffect(() => {
    setProfileForm({
      displayName,
      organizationLabel,
    });
  }, [displayName, organizationLabel]);

  const mutation = useMutation({
    mutationFn: saveAiFoundrySettings,
    onSuccess: (saved) => {
      queryClient.setQueryData(['ai-foundry-settings'], saved);
      setForm((current) => ({ ...current, apiKey: '', clearApiKey: false }));
      setMessage('Azure AI Foundry settings saved.');
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

  const handleProfileSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!profileForm.displayName.trim()) {
      setProfileMessage('Display name is required.');
      return;
    }

    setProfile({
      displayName: profileForm.displayName,
      organizationLabel: profileForm.organizationLabel,
    });
    setProfileMessage('Local profile saved.');
  };

  return (
    <div className="page-shell">
      <section className="page-header">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Settings' }]} />
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">
            Store Azure AI Foundry connection details used by the local and hosted architecture review flow.
          </p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="panel">
            <div className="panel-header">Local profile</div>
            <form className="panel-body space-y-5" onSubmit={handleProfileSubmit}>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field
                  label="Display name"
                  value={profileForm.displayName}
                  onChange={(value) => {
                    setProfileMessage('');
                    setProfileForm((current) => ({ ...current, displayName: value }));
                  }}
                  placeholder="Jane Architect"
                  required
                />
                <Field
                  label="Organization label"
                  value={profileForm.organizationLabel}
                  onChange={(value) => {
                    setProfileMessage('');
                    setProfileForm((current) => ({ ...current, organizationLabel: value }));
                  }}
                  placeholder="Northwind Platform Team"
                />
              </div>

              {profileMessage ? (
                <div className="panel-muted px-4 py-3 text-sm text-secondary-700 dark:text-secondary-200">{profileMessage}</div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit">Save Profile</Button>
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel-header">Azure AI Foundry Configuration</div>
            <form className="panel-body space-y-5" onSubmit={handleSubmit}>
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
                <label className="form-label">API key</label>
                <input
                  type="password"
                  value={form.apiKey}
                  onChange={(event) => update('apiKey', event.target.value)}
                  placeholder={data?.hasApiKey ? `Saved key ${data.apiKeyPreview ?? ''}` : 'Paste API key'}
                  className="form-input"
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
                  className="form-checkbox"
                />
                Clear saved API key on save
              </label>

              {message ? (
                <div className="panel-muted px-4 py-3 text-sm text-secondary-700 dark:text-secondary-200">{message}</div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" isLoading={mutation.isPending}>
                  Save Settings
                </Button>
                <Button type="button" variant="secondary" onClick={() => window.location.assign('/health')}>
                  Check Health
                </Button>
              </div>
            </form>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="panel p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Usage</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">
              <li>Use one project endpoint per environment.</li>
              <li>Keep the API key blank when you only want to update metadata.</li>
              <li>Run Health after saving to confirm connectivity.</li>
            </ul>
          </section>

          <section className="panel p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Saved State</p>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-secondary-500">Endpoint</dt>
                <dd className="text-secondary-900 dark:text-white">{data?.projectEndpoint || 'Not configured'}</dd>
              </div>
              <div>
                <dt className="text-secondary-500">Agent</dt>
                <dd className="text-secondary-900 dark:text-white">{data?.agentId || 'Not configured'}</dd>
              </div>
              <div>
                <dt className="text-secondary-500">API key</dt>
                <dd className="text-secondary-900 dark:text-white">{data?.hasApiKey ? data.apiKeyPreview : 'Not saved'}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
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
      <span className="form-label">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="form-input"
      />
    </label>
  );
}
