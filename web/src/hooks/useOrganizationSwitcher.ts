import { useEffect, useState } from 'react';

export function useOrganizationSwitcher() {
  const [organizationId, setOrganizationId] = useState<string>(() => {
    const storedOrganizationId = localStorage.getItem('currentOrganizationId');
    if (storedOrganizationId) {
      return storedOrganizationId;
    }

    return '';
  });

  useEffect(() => {
    if (organizationId) {
      localStorage.setItem('currentOrganizationId', organizationId);
      return;
    }

    localStorage.removeItem('currentOrganizationId');
  }, [organizationId]);

  return {
    organizationId,
    setOrganizationId,
  };
}
