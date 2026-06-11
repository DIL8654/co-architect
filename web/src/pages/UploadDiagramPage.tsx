import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Badge,
  Breadcrumbs,
  Button,
  ErrorState,
  ReviewSetupSummary,
  UploadIcon,
} from '../components';
import { frameworkSelectionApi } from '../api/frameworkSelection';
import {
  type DiagramReviewSetup,
  type DiagramReviewSetupInput,
  type FrameworkSelectionMode,
  type QualityAttributeWeight,
  type ReviewFramework,
} from '../api/diagrams';
import { useUploadDiagram } from '../hooks/useDiagrams';
import { SAMPLE_ARCHITECTURE_DESCRIPTION, SAMPLE_DIAGRAM_NAME, SAMPLE_REVIEW_CONTEXT } from '../lib/sampleArchitecture';

const SUPPORTED_FORMATS = ['png', 'jpg', 'jpeg', 'svg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const FRAMEWORK_OPTIONS: Array<{ value: ReviewFramework; label: string; summary: string }> = [
  { value: 'AzureWellArchitected', label: 'Azure Well-Architected', summary: 'Reliability, security, cost, performance, and operations for Azure-oriented systems.' },
  { value: 'AwsWellArchitected', label: 'AWS Well-Architected', summary: 'Operational, reliability, security, cost, and sustainability review for AWS systems.' },
  { value: 'Iso25010', label: 'ISO/IEC 25010', summary: 'System quality attributes such as maintainability, usability, compatibility, and reliability.' },
  { value: 'OwaspAsvs', label: 'OWASP ASVS', summary: 'Application and API security requirements for web-facing or sensitive systems.' },
];

const DEFAULT_WEIGHTS: QualityAttributeWeight[] = [
  { key: 'security', label: 'Security', weight: 25 },
  { key: 'availability', label: 'Availability', weight: 20 },
  { key: 'scalability', label: 'Scalability', weight: 15 },
  { key: 'cost', label: 'Cost', weight: 10 },
  { key: 'maintainability', label: 'Maintainability', weight: 10 },
  { key: 'compliance', label: 'Compliance', weight: 10 },
  { key: 'deliverySpeed', label: 'Delivery Speed', weight: 10 },
];

const INITIAL_PREVIEW: DiagramReviewSetup = {
  reviewContext: {},
  frameworkSelection: {
    mode: 'AutoDetect',
    confidenceScore: 0,
    requestedFrameworks: [],
    selectedFrameworks: [],
    selectionRationale: [],
  },
  qualityAttributeWeights: DEFAULT_WEIGHTS,
};

export function UploadDiagramPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sampleAppliedRef = useRef(false);

  const [diagramName, setDiagramName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filePreview, setFilePreview] = useState('');
  const [frameworkSelectionMode, setFrameworkSelectionMode] = useState<FrameworkSelectionMode>('AutoDetect');
  const [requestedFrameworks, setRequestedFrameworks] = useState<ReviewFramework[]>([]);
  const [businessDomain, setBusinessDomain] = useState('');
  const [targetUsers, setTargetUsers] = useState('');
  const [expectedTraffic, setExpectedTraffic] = useState('');
  const [dataSensitivity, setDataSensitivity] = useState('');
  const [cloudProviderPreference, setCloudProviderPreference] = useState('');
  const [complianceNeeds, setComplianceNeeds] = useState('');
  const [currentPainPoints, setCurrentPainPoints] = useState('');
  const [qualityAttributeWeights, setQualityAttributeWeights] = useState<QualityAttributeWeight[]>(DEFAULT_WEIGHTS);
  const [preview, setPreview] = useState<DiagramReviewSetup>(INITIAL_PREVIEW);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const uploadMutation = useUploadDiagram();

  useEffect(() => {
    if (sampleAppliedRef.current || searchParams.get('sample') !== '1') {
      return;
    }

    sampleAppliedRef.current = true;
    setDiagramName(SAMPLE_DIAGRAM_NAME);
    setDescription(SAMPLE_ARCHITECTURE_DESCRIPTION);
    setBusinessDomain(SAMPLE_REVIEW_CONTEXT.businessDomain);
    setTargetUsers(SAMPLE_REVIEW_CONTEXT.targetUsers);
    setExpectedTraffic(SAMPLE_REVIEW_CONTEXT.expectedTraffic);
    setDataSensitivity(SAMPLE_REVIEW_CONTEXT.dataSensitivity);
    setCloudProviderPreference(SAMPLE_REVIEW_CONTEXT.cloudProviderPreference);
    setComplianceNeeds(SAMPLE_REVIEW_CONTEXT.complianceNeeds);
    setCurrentPainPoints(SAMPLE_REVIEW_CONTEXT.currentPainPoints);
    setFrameworkSelectionMode('AutoDetect');
    setRequestedFrameworks([]);
    setQualityAttributeWeights(DEFAULT_WEIGHTS);
  }, [searchParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      setIsPreviewLoading(true);
      try {
        const nextPreview = await frameworkSelectionApi.preview({
          description,
          reviewSetup: buildReviewSetup(),
        });
        setPreview(nextPreview);
      } catch {
        setPreview({
          reviewContext: {
            businessDomain: businessDomain.trim() || undefined,
            targetUsers: targetUsers.trim() || undefined,
            expectedTraffic: expectedTraffic.trim() || undefined,
            dataSensitivity: dataSensitivity.trim() || undefined,
            cloudProviderPreference: cloudProviderPreference || undefined,
            complianceNeeds: complianceNeeds.trim() || undefined,
            currentPainPoints: currentPainPoints.trim() || undefined,
          },
          frameworkSelection: {
            mode: frameworkSelectionMode,
            detectedCloudProvider: cloudProviderPreference || undefined,
            confidenceScore: 0,
            requestedFrameworks,
            selectedFrameworks: frameworkSelectionMode === 'Manual' ? requestedFrameworks : [],
            selectionRationale: frameworkSelectionMode === 'Manual' ? ['Framework preview is unavailable, but your manual selection will be saved.'] : [],
          },
          qualityAttributeWeights,
        });
      } finally {
        setIsPreviewLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [
    description,
    businessDomain,
    targetUsers,
    expectedTraffic,
    dataSensitivity,
    cloudProviderPreference,
    complianceNeeds,
    currentPainPoints,
    frameworkSelectionMode,
    requestedFrameworks,
    qualityAttributeWeights,
  ]);

  if (!workspaceId) {
    return <ErrorState title="Invalid workspace" message="Please select a valid workspace." />;
  }

  function buildReviewSetup(): DiagramReviewSetupInput {
    return {
      businessDomain: businessDomain.trim() || undefined,
      targetUsers: targetUsers.trim() || undefined,
      expectedTraffic: expectedTraffic.trim() || undefined,
      dataSensitivity: dataSensitivity.trim() || undefined,
      cloudProviderPreference: cloudProviderPreference || undefined,
      complianceNeeds: complianceNeeds.trim() || undefined,
      currentPainPoints: currentPainPoints.trim() || undefined,
      frameworkSelectionMode,
      requestedFrameworks,
      qualityAttributeWeights,
    };
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const nextErrors: Record<string, string> = {};
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !SUPPORTED_FORMATS.includes(fileExtension)) {
      nextErrors.file = `Unsupported format. Supported: ${SUPPORTED_FORMATS.join(', ')}`;
    }

    if (file.size > MAX_FILE_SIZE) {
      nextErrors.file = 'File size must be less than 10MB';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSelectedFile(null);
      setFilePreview('');
      return;
    }

    setSelectedFile(file);
    setErrors((current) => ({ ...current, file: '' }));

    if (fileExtension && ['svg', 'png', 'jpg', 'jpeg'].includes(fileExtension)) {
      const reader = new FileReader();
      reader.onload = (event) => setFilePreview((event.target?.result as string) ?? '');
      reader.readAsDataURL(file);
    }

    if (!diagramName) {
      setDiagramName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!diagramName.trim()) {
      nextErrors.name = 'Diagram name is required';
    }

    if (!selectedFile && !description.trim()) {
      nextErrors.file = 'Add a description or select a file';
    }

    if (frameworkSelectionMode === 'Manual' && requestedFrameworks.length === 0) {
      nextErrors.frameworks = 'Select at least one review framework in manual mode';
    }

    const totalWeight = qualityAttributeWeights.reduce((total, item) => total + item.weight, 0);
    if (totalWeight !== 100) {
      nextErrors.weights = 'Quality attribute weights must total 100%';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const diagram = await uploadMutation.mutateAsync({
        workspaceId,
        name: diagramName.trim(),
        description: description.trim() || undefined,
        file: selectedFile ?? undefined,
        reviewSetup: buildReviewSetup(),
      });

      navigate(`/workspaces/${workspaceId}/diagrams/${diagram.id}`);
    } catch {
      setErrors((current) => ({ ...current, submit: 'Failed to save the architecture review setup.' }));
    }
  };

  const handleWeightChange = (key: string, nextValue: number) => {
    setQualityAttributeWeights((current) =>
      current.map((weight) => (weight.key === key ? { ...weight, weight: Number.isFinite(nextValue) ? Math.max(0, nextValue) : 0 } : weight)),
    );
  };

  const toggleFramework = (framework: ReviewFramework) => {
    setRequestedFrameworks((current) =>
      current.includes(framework) ? current.filter((value) => value !== framework) : [...current, framework],
    );
  };

  const totalWeight = qualityAttributeWeights.reduce((total, item) => total + item.weight, 0);

  return (
    <div className="page-shell">
      <section className="page-header">
        <Breadcrumbs
          items={[
            { label: 'Workspaces', to: '/workspaces' },
            { label: 'Diagrams', to: `/workspaces/${workspaceId}/diagrams` },
            { label: 'Upload' },
          ]}
        />
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="page-title">New Architecture Review</h1>
            <p className="page-description">Upload a diagram, add business context, choose review frameworks, and set quality priorities before analysis.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={totalWeight === 100 ? 'success' : 'warning'}>{totalWeight}% configured</Badge>
            {isPreviewLoading && <Badge variant="secondary">Updating framework preview</Badge>}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="panel">
            <div className="panel-header">Architecture Input</div>
            <div className="panel-body space-y-5">
              <div className="space-y-2">
                <label className="form-label">Diagram Image</label>
                <div
                  className="rounded-xl border-2 border-dashed border-[#d7dce2] bg-[#fafafa] p-8 text-center transition hover:border-primary-500 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-cyan-300"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handleFileChange({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
                    }
                  }}
                >
                  <input
                    id="file-input"
                    type="file"
                    onChange={handleFileChange}
                    accept={SUPPORTED_FORMATS.map((format) => `.${format}`).join(',')}
                    className="hidden"
                    disabled={uploadMutation.isPending}
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <span className="glow-icon mx-auto mb-4">
                      <UploadIcon className="h-5 w-5" />
                    </span>
                    <p className="font-semibold text-secondary-950 dark:text-white">
                      {selectedFile ? selectedFile.name : 'Drag and drop a diagram or click to browse'}
                    </p>
                    <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-300">
                      PNG, JPG, JPEG, or SVG. Text-only architecture reviews are also supported.
                    </p>
                  </label>
                </div>
                {errors.file && <p className="text-sm text-error-600">{errors.file}</p>}
              </div>

              {filePreview && (
                <div className="space-y-2">
                  <label className="form-label">Preview</label>
                  <img src={filePreview} alt="Diagram preview" className="max-h-64 rounded-xl border border-[#d7dce2] dark:border-white/10" />
                </div>
              )}

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="form-label">Diagram Name *</label>
                  <input
                    type="text"
                    value={diagramName}
                    onChange={(e) => setDiagramName(e.target.value)}
                    placeholder="E.g., B2B SaaS Platform Architecture"
                    className="form-input"
                    disabled={uploadMutation.isPending}
                  />
                  {errors.name && <p className="text-sm text-error-600">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="form-label">Cloud Provider Preference</label>
                  <select
                    value={cloudProviderPreference}
                    onChange={(e) => setCloudProviderPreference(e.target.value)}
                    className="form-select"
                    disabled={uploadMutation.isPending}
                  >
                    <option value="">No preference</option>
                    <option value="Azure">Azure</option>
                    <option value="AWS">AWS</option>
                    <option value="Cloud-neutral">Cloud-neutral</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="form-label">Architecture Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the architecture, integrations, trust boundaries, constraints, and current gaps..."
                  rows={6}
                  className="form-textarea"
                  disabled={uploadMutation.isPending}
                />
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">Business And Operating Context</div>
            <div className="panel-body grid gap-4 lg:grid-cols-2">
              <TextField label="Business Domain" value={businessDomain} onChange={setBusinessDomain} placeholder="B2B SaaS, public sector, internal platform" />
              <TextField label="Target Users" value={targetUsers} onChange={setTargetUsers} placeholder="External tenants, admins, operations teams" />
              <TextField label="Expected Traffic" value={expectedTraffic} onChange={setExpectedTraffic} placeholder="Low, steady, bursty, global, seasonal" />
              <TextField label="Data Sensitivity" value={dataSensitivity} onChange={setDataSensitivity} placeholder="PII, regulated, internal only, public" />
              <TextField label="Compliance Needs" value={complianceNeeds} onChange={setComplianceNeeds} placeholder="SOC 2, GDPR, audit logging, retention" />
              <TextField label="Current Pain Points" value={currentPainPoints} onChange={setCurrentPainPoints} placeholder="No monitoring, weak isolation, high cost" />
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">Framework Selection</div>
            <div className="panel-body space-y-5">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFrameworkSelectionMode('AutoDetect')}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    frameworkSelectionMode === 'AutoDetect'
                      ? 'bg-primary-600 text-white'
                      : 'border border-[#d7dce2] bg-white text-secondary-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-secondary-200'
                  }`}
                >
                  Auto-detect
                </button>
                <button
                  type="button"
                  onClick={() => setFrameworkSelectionMode('Manual')}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    frameworkSelectionMode === 'Manual'
                      ? 'bg-primary-600 text-white'
                      : 'border border-[#d7dce2] bg-white text-secondary-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-secondary-200'
                  }`}
                >
                  Choose manually
                </button>
              </div>

              <div className="grid gap-3">
                {FRAMEWORK_OPTIONS.map((option) => {
                  const isChecked = requestedFrameworks.includes(option.value);
                  const isSuggested = preview.frameworkSelection.selectedFrameworks.includes(option.value);

                  return (
                    <label
                      key={option.value}
                      className={`rounded-xl border p-4 transition ${
                        isSuggested
                          ? 'border-primary-200 bg-primary-50/60 dark:border-cyan-300/30 dark:bg-cyan-400/10'
                          : 'border-[#dde1e6] bg-white dark:border-white/10 dark:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFramework(option.value)}
                          disabled={frameworkSelectionMode !== 'Manual' || uploadMutation.isPending}
                          className="mt-1"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-secondary-950 dark:text-white">{option.label}</p>
                            {isSuggested && <Badge variant="primary">Suggested</Badge>}
                          </div>
                          <p className="mt-1 text-sm leading-6 text-secondary-600 dark:text-secondary-300">{option.summary}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {errors.frameworks && <p className="text-sm text-error-600">{errors.frameworks}</p>}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">Quality Attribute Weights</div>
            <div className="panel-body space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm leading-6 text-secondary-600 dark:text-secondary-300">
                  Tune how the future reasoning agents should balance recommendations for this architecture review.
                </p>
                <Button type="button" size="sm" variant="secondary" onClick={() => setQualityAttributeWeights(DEFAULT_WEIGHTS)}>
                  Reset defaults
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {qualityAttributeWeights.map((weight) => (
                  <div key={weight.key} className="panel-muted p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="font-semibold text-secondary-950 dark:text-white">{weight.label}</label>
                      <span className="text-xs text-secondary-500 dark:text-secondary-400">{weight.weight}%</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={weight.weight}
                      onChange={(e) => handleWeightChange(weight.key, Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                ))}
              </div>

              <div className="panel-muted flex items-center justify-between gap-3 px-4 py-3">
                <p className="text-sm font-semibold text-secondary-950 dark:text-white">Total</p>
                <Badge variant={totalWeight === 100 ? 'success' : 'warning'}>{totalWeight}%</Badge>
              </div>
              {errors.weights && <p className="text-sm text-error-600">{errors.weights}</p>}
            </div>
          </section>

          {errors.submit && <p className="rounded-xl bg-error-50 p-3 text-sm text-error-700 dark:bg-error-500/10 dark:text-error-200">{errors.submit}</p>}

          <div className="flex gap-2 pb-8">
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate(`/workspaces/${workspaceId}/diagrams`)}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={uploadMutation.isPending} icon={<UploadIcon className="h-4 w-4" />}>
              Save Diagram Review
            </Button>
          </div>
        </form>

        <div className="space-y-6">
          <section className="panel p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Preview</p>
            <p className="mt-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">
              Framework selection, rationale, and quality priorities update live as you add architecture context.
            </p>
          </section>
          <ReviewSetupSummary reviewSetup={preview} />
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <label className="form-label">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-input"
      />
    </div>
  );
}
