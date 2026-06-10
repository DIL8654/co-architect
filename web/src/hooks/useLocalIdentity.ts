import { useLocalProfileStore } from '../stores/useLocalProfileStore';

export interface LocalIdentity {
  isConfigured: boolean;
  tenantId: string;
  userId: string;
  email: string;
  displayName: string;
  organizationLabel: string;
  roles: string[];
}

export function useLocalIdentity(): LocalIdentity {
  const isConfigured = useLocalProfileStore((state) => state.isConfigured);
  const displayName = useLocalProfileStore((state) => state.displayName);
  const organizationLabel = useLocalProfileStore((state) => state.organizationLabel);

  return {
    isConfigured,
    tenantId: '00000000-0000-0000-0000-000000000101',
    userId: '00000000-0000-0000-0000-000000000001',
    email: 'local-admin@coarchitect.ai',
    displayName: displayName || 'CoArchitect Local Admin',
    organizationLabel,
    roles: ['coarchitect.admin', 'coarchitect.reader'],
  };
}
