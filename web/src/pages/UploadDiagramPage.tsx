import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Breadcrumbs, Button, DiagramIcon, ErrorState, UploadIcon } from '../components';
import { useUploadDiagram } from '../hooks/useDiagrams';

const SUPPORTED_FORMATS = ['png', 'jpg', 'jpeg', 'svg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function UploadDiagramPage() {
  const { orgId, organizationId, workspaceId } = useParams<{ orgId: string; organizationId: string; workspaceId: string }>();
  const resolvedOrgId = orgId ?? organizationId;
  const navigate = useNavigate();

  const [diagramName, setDiagramName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filePreview, setFilePreview] = useState<string>('');

  const uploadMutation = useUploadDiagram();

  if (!workspaceId || !resolvedOrgId) {
    return (
      <ErrorState
        title="Invalid workspace"
        message="Please select a valid organization and workspace."
      />
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const errors: Record<string, string> = {};

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !SUPPORTED_FORMATS.includes(fileExtension)) {
      errors.file = `Unsupported format. Supported: ${SUPPORTED_FORMATS.join(', ')}`;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      errors.file = 'File size must be less than 10MB';
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      setSelectedFile(null);
      setFilePreview('');
      return;
    }

    setSelectedFile(file);
    setErrors({});

    // Generate preview
    if (fileExtension && (fileExtension === 'svg' || ['png', 'jpg', 'jpeg'].includes(fileExtension))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Auto-fill name from filename if empty
    if (!diagramName) {
      setDiagramName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!diagramName.trim()) {
      newErrors.name = 'Diagram name is required';
    }

    if (!selectedFile && !description.trim()) {
      newErrors.file = 'Add a description or select a file';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !workspaceId) return;

    try {
      const diagram = await uploadMutation.mutateAsync({
        organizationId: resolvedOrgId,
        workspaceId,
        name: diagramName.trim(),
        description: description.trim() || undefined,
        file: selectedFile ?? undefined,
      });

      navigate(`/orgs/${resolvedOrgId}/diagrams/${diagram.id}`);
    } catch (error) {
      setErrors({ submit: 'Failed to upload diagram' });
    }
  };

  return (
    <div className="page-shell max-w-3xl">
      <section className="page-header">
        <Breadcrumbs
          items={[
            { label: 'Organizations', to: '/organizations' },
            { label: 'Workspaces', to: `/orgs/${resolvedOrgId}/workspaces` },
            { label: 'Diagrams', to: `/orgs/${resolvedOrgId}/workspaces/${workspaceId}/diagrams` },
            { label: 'Upload' },
          ]}
        />
        <div className="flex items-center gap-4">
          <div className="glow-icon">
            <DiagramIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">Upload Architecture Diagram</h1>
            <p className="page-description mt-2">Add a diagram image, a text architecture description, or both.</p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-secondary-200 bg-white/[0.88] p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-secondary-900 dark:text-secondary-100">
            Select Image *
          </label>
          <div
            className="rounded-2xl border-2 border-dashed border-secondary-300 bg-secondary-50/70 p-8 text-center transition hover:border-primary-500 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-cyan-300"
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-primary-500', 'bg-primary-50');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('border-primary-500', 'bg-primary-50');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-primary-500', 'bg-primary-50');
              const file = e.dataTransfer.files?.[0];
              if (file) {
                handleFileChange({
                  target: { files: e.dataTransfer.files },
                } as any);
              }
            }}
          >
            <input
              type="file"
              onChange={handleFileChange}
              accept={SUPPORTED_FORMATS.map((f) => `.${f}`).join(',')}
              className="hidden"
              id="file-input"
              disabled={uploadMutation.isPending}
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <span className="glow-icon mx-auto mb-4">
                <UploadIcon className="h-5 w-5" />
              </span>
              <p className="font-semibold text-secondary-950 dark:text-white">
                {selectedFile ? selectedFile.name : 'Drag and drop an image here'}
              </p>
              <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-300">
                or click to browse. You can also submit a text-only architecture description.
              </p>
            </label>
          </div>
          {errors.file && <p className="text-error-600 text-sm">{errors.file}</p>}
        </div>

        {/* File Preview */}
        {filePreview && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-secondary-900 dark:text-secondary-100">Preview</label>
            <img
              src={filePreview}
              alt="Preview"
              className="max-h-64 rounded-2xl border border-secondary-300 dark:border-white/10"
            />
          </div>
        )}

        {/* Diagram Name */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-secondary-900 dark:text-secondary-100">
            Diagram Name *
          </label>
          <input
            type="text"
            value={diagramName}
            onChange={(e) => {
              setDiagramName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            placeholder="E.g., Microservices Architecture v1.0"
            className="w-full rounded-xl border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={uploadMutation.isPending}
          />
          {errors.name && <p className="text-error-600 text-sm">{errors.name}</p>}
        </div>

        {/* Architecture Description */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-secondary-900 dark:text-secondary-100">
            Architecture Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the architecture, key components, and design patterns..."
            rows={5}
            className="w-full resize-none rounded-xl border border-secondary-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={uploadMutation.isPending}
          />
          <p className="text-xs text-secondary-600 dark:text-secondary-400">Optional - provide context for AI analysis</p>
        </div>

        {/* Submit Error */}
        {errors.submit && <p className="rounded-xl bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-200">{errors.submit}</p>}

        {/* Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate(`/orgs/${resolvedOrgId}/workspaces/${workspaceId}/diagrams`)}
            disabled={uploadMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={uploadMutation.isPending}
            disabled={!selectedFile && !description.trim()}
            icon={<UploadIcon className="h-4 w-4" />}
          >
            Save Diagram
          </Button>
        </div>
      </form>
    </div>
  );
}
