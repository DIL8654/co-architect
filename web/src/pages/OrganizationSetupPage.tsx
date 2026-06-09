import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingIcon, Button, Card, PlusIcon, Spinner } from '../components';
import { useCreateOrganization, useCheckSlug } from '../hooks/useOrganizations';

interface FormData {
  name: string;
  slug: string;
}

interface FormErrors {
  name?: string;
  slug?: string;
}

export function OrganizationSetupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({ name: '', slug: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const createMutation = useCreateOrganization();
  const slugQuery = useCheckSlug(formData.slug);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData((prev) => ({ ...prev, slug }));
    if (errors.slug) setErrors((prev) => ({ ...prev, slug: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (formData.slug.length < 3) {
      newErrors.slug = 'Slug must be at least 3 characters';
    }

    if (slugQuery.data === false) {
      newErrors.slug = 'This slug is already taken';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const organization = await createMutation.mutateAsync({
        name: formData.name,
        slug: formData.slug,
      });
      navigate(`/orgs/${organization.id}/workspaces`);
    } catch (error) {
      setErrors({ slug: 'Failed to create organization' });
    }
  };

  return (
    <div className="page-shell max-w-2xl">
      <section className="page-header">
        <div className="flex items-center gap-4">
          <div className="glow-icon">
            <BuildingIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">Create Organization</h1>
            <p className="page-description mt-2">Start the architecture review workspace with a simple organization boundary.</p>
          </div>
        </div>
      </section>

      <Card className="mx-auto w-full max-w-md" header="Create Organization">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-secondary-900 dark:text-secondary-100">
              Organization Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Acme Corp"
              className="w-full rounded-xl border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={createMutation.isPending}
            />
            {errors.name && <p className="text-error-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-secondary-900 dark:text-secondary-100">
              Slug
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.slug}
                onChange={handleSlugChange}
                placeholder="acme-corp"
                className="flex-1 rounded-xl border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={createMutation.isPending}
              />
              {formData.slug && slugQuery.isLoading && <Spinner size="sm" />}
            </div>
            {errors.slug && <p className="text-error-600 text-sm mt-1">{errors.slug}</p>}
            {formData.slug && !errors.slug && slugQuery.data && (
              <p className="mt-1 text-sm text-success-600">Slug available</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/organizations')}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || slugQuery.data === false}
              isLoading={createMutation.isPending}
              icon={<PlusIcon className="h-4 w-4" />}
            >
              Create
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
