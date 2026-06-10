import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LocalProfileState {
  isConfigured: boolean;
  displayName: string;
  organizationLabel: string;
  setProfile: (profile: { displayName: string; organizationLabel?: string }) => void;
  clearProfile: () => void;
}

export const useLocalProfileStore = create<LocalProfileState>()(
  persist(
    (set) => ({
      isConfigured: false,
      displayName: '',
      organizationLabel: '',
      setProfile: ({ displayName, organizationLabel }) =>
        set({
          isConfigured: true,
          displayName: displayName.trim(),
          organizationLabel: organizationLabel?.trim() ?? '',
        }),
      clearProfile: () =>
        set({
          isConfigured: false,
          displayName: '',
          organizationLabel: '',
        }),
    }),
    {
      name: 'coarchitect.local-profile',
    },
  ),
);
