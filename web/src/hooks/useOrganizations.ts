import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { organizationApi } from '../api/organizations';

export function useCreateOrganization() {
  return useMutation({
    mutationFn: (data: { name: string; slug: string }) =>
      organizationApi.createOrganization(data),
  });
}

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationApi.listOrganizations(),
  });
}

export function useCheckSlug(slug: string) {
  return useQuery({
    queryKey: ['slug-available', slug],
    queryFn: () => organizationApi.checkSlugAvailable(slug),
    enabled: slug.length > 0,
  });
}
