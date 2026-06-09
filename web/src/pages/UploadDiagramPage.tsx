import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, ErrorState } from '../components';
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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-secondary-900 mb-6">Upload Architecture Diagram</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary-900">
            Select Image *
          </label>
          <div
            className="border-2 border-dashed border-secondary-300 rounded-lg p-8 text-center hover:border-primary-500 transition"
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
              <div className="text-4xl mb-2">📁</div>
              <p className="text-secondary-900 font-medium">
                {selectedFile ? selectedFile.name : 'Drag and drop an image here'}
              </p>
              <p className="text-secondary-600 text-sm mt-1">
                or click to browse. You can also submit a text-only architecture description.
              </p>
            </label>
          </div>
          {errors.file && <p className="text-error-600 text-sm">{errors.file}</p>}
        </div>

        {/* File Preview */}
        {filePreview && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-900">Preview</label>
            <img
              src={filePreview}
              alt="Preview"
              className="max-h-64 rounded-lg border border-secondary-300"
            />
          </div>
        )}

        {/* Diagram Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary-900">
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
            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={uploadMutation.isPending}
          />
          {errors.name && <p className="text-error-600 text-sm">{errors.name}</p>}
        </div>

        {/* Architecture Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary-900">
            Architecture Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the architecture, key components, and design patterns..."
            rows={5}
            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            disabled={uploadMutation.isPending}
          />
          <p className="text-secondary-600 text-xs">Optional - provide context for AI analysis</p>
        </div>

        {/* Submit Error */}
        {errors.submit && <p className="text-error-600 text-sm p-3 bg-error-50 rounded">{errors.submit}</p>}

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
          >
            Save Diagram
          </Button>
        </div>
      </form>
    </div>
  );
}
