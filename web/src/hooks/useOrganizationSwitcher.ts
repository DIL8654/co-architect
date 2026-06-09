import { useState } from 'react';

export function useOrganizationSwitcher() {
  const [organizationId, setOrganizationId] = useState<string>(() => {
    const storedOrganizationId = localStorage.getItem('currentOrganizationId');
    if (storedOrganizationId) {
      return storedOrganizationId;
    }

    return '';
  });

  return {
    organizationId,
    setOrganizationId,
  };
}
