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
  type ReviewStandard,
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
const STANDARD_OPTIONS: Array<{ value: ReviewStandard; label: string; summary: string }> = [
  { value: 'Iso27001', label: 'ISO 27001', summary: 'Security governance, control design, risk treatment, access control, and operational security evidence.' },
  { value: 'Gdpr', label: 'GDPR', summary: 'Privacy, retention, deletion, personal-data handling, and European data-protection responsibilities.' },
  { value: 'Soc2', label: 'SOC 2', summary: 'Trust-service controls for security, availability, confidentiality, and audit-ready operations.' },
  { value: 'Togaf', label: 'TOGAF', summary: 'Architecture governance, capability planning, roadmap thinking, and enterprise change coordination.' },
  { value: 'Safe', label: 'SAFe', summary: 'Value streams, platform-team coordination, release alignment, and scaled delivery architecture guidance.' },
];

const BUSINESS_DOMAIN_OPTIONS = ['SaaS', 'FinTech', 'Healthcare', 'Media', 'E-commerce', 'Enterprise Platform'] as const;
const TARGET_USER_OPTIONS = ['External customers', 'Enterprise tenants', 'Internal employees', 'Operations and admins', 'Partners and integrators'] as const;
const EXPECTED_TRAFFIC_OPTIONS = ['Low / steady', 'Moderate', 'High', 'Bursty', 'Global / multi-region'] as const;
const DATA_SENSITIVITY_OPTIONS = ['Public', 'Internal', 'Confidential', 'PII / regulated'] as const;
const COMPLIANCE_OPTIONS = ['None', 'GDPR', 'SOC 2', 'ISO 27001', 'Audit logging / retention'] as const;

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
    requestedStandards: [],
    selectedStandards: [],
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
  const [requestedStandards, setRequestedStandards] = useState<ReviewStandard[]>([]);
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
    setRequestedStandards([]);
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
            businessDomain: businessDomain || undefined,
            targetUsers: targetUsers || undefined,
            expectedTraffic: expectedTraffic || undefined,
            dataSensitivity: dataSensitivity || undefined,
            cloudProviderPreference: cloudProviderPreference || undefined,
            complianceNeeds: complianceNeeds || undefined,
            currentPainPoints: currentPainPoints.trim() || undefined,
          },
          frameworkSelection: {
            mode: frameworkSelectionMode,
            detectedCloudProvider: cloudProviderPreference || undefined,
            confidenceScore: 0,
            requestedFrameworks,
            requestedStandards,
            selectedFrameworks: frameworkSelectionMode === 'Manual' ? requestedFrameworks : [],
            selectedStandards: frameworkSelectionMode === 'Manual' ? requestedStandards : [],
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
    requestedStandards,
    qualityAttributeWeights,
  ]);

  if (!workspaceId) {
    return <ErrorState title="Invalid workspace" message="Please select a valid workspace." />;
  }

  function buildReviewSetup(): DiagramReviewSetupInput {
    return {
      businessDomain: businessDomain || undefined,
      targetUsers: targetUsers || undefined,
      expectedTraffic: expectedTraffic || undefined,
      dataSensitivity: dataSensitivity || undefined,
      cloudProviderPreference: cloudProviderPreference || undefined,
      complianceNeeds: complianceNeeds || undefined,
      currentPainPoints: currentPainPoints.trim() || undefined,
      frameworkSelectionMode,
      requestedFrameworks,
      requestedStandards,
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

    if (frameworkSelectionMode === 'Manual' && requestedFrameworks.length === 0 && requestedStandards.length === 0) {
      nextErrors.frameworks = 'Select at least one review framework or standard in manual mode';
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

  const toggleStandard = (standard: ReviewStandard) => {
    setRequestedStandards((current) =>
      current.includes(standard) ? current.filter((value) => value !== standard) : [...current, standard],
    );
  };

  const totalWeight = qualityAttributeWeights.reduce((total, item) => total + item.weight, 0);
  const previewFrameworkSelection = preview.frameworkSelection ?? INITIAL_PREVIEW.frameworkSelection;
  const suggestedFrameworks = previewFrameworkSelection.selectedFrameworks ?? [];
  const suggestedStandards = previewFrameworkSelection.selectedStandards ?? [];
  const weightStatus = totalWeight === 100 ? 'success' : totalWeight > 100 ? 'error' : 'warning';
  const weightTone =
    weightStatus === 'success'
      ? 'border-success-200 bg-success-50 text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-400'
      : weightStatus === 'error'
        ? 'border-error-200 bg-error-50 text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-300'
        : 'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-300';

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
            <p className="page-description">Define review criteria first, then add architecture evidence and save the diagram for analysis.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={weightStatus === 'success' ? 'success' : weightStatus === 'error' ? 'error' : 'warning'}>{totalWeight}% configured</Badge>
            {isPreviewLoading && <Badge variant="secondary">Updating framework preview</Badge>}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="panel">
            <div className="panel-header">Review Criteria</div>
            <div className="panel-body space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <SelectField label="Business Domain" value={businessDomain} onChange={setBusinessDomain} options={BUSINESS_DOMAIN_OPTIONS} placeholder="Select domain" />
                <SelectField label="Target Users" value={targetUsers} onChange={setTargetUsers} options={TARGET_USER_OPTIONS} placeholder="Select users" />
                <SelectField label="Expected Traffic" value={expectedTraffic} onChange={setExpectedTraffic} options={EXPECTED_TRAFFIC_OPTIONS} placeholder="Select traffic" />
                <SelectField label="Data Sensitivity" value={dataSensitivity} onChange={setDataSensitivity} options={DATA_SENSITIVITY_OPTIONS} placeholder="Select sensitivity" />
                <SelectField label="Cloud Provider Preference" value={cloudProviderPreference} onChange={setCloudProviderPreference} options={['Azure', 'AWS', 'Cloud-neutral']} placeholder="No preference" />
                <SelectField label="Compliance Needs" value={complianceNeeds} onChange={setComplianceNeeds} options={COMPLIANCE_OPTIONS} placeholder="Select compliance" />
              </div>

              <div className="space-y-2">
                <label className="form-label">Current Pain Points</label>
                <textarea
                  value={currentPainPoints}
                  onChange={(e) => setCurrentPainPoints(e.target.value)}
                  placeholder="No monitoring, weak isolation, high cost, unclear secrets management..."
                  rows={3}
                  className="form-textarea min-h-[84px]"
                  disabled={uploadMutation.isPending}
                />
              </div>

              <div className="rounded-xl border border-[#dde1e6] bg-[#fafafa] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Quality Attribute Weights</p>
                    <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-300">
                      Keep the total at exactly 100% so the review priorities stay balanced and explainable.
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setQualityAttributeWeights(DEFAULT_WEIGHTS)}>
                    Reset defaults
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {qualityAttributeWeights.map((weight) => (
                    <CompactWeightField
                      key={weight.key}
                      label={weight.label}
                      value={weight.weight}
                      onChange={(nextValue) => handleWeightChange(weight.key, nextValue)}
                    />
                  ))}
                </div>

                <div className={`mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm font-medium ${weightTone}`}>
                  <span>Total configured</span>
                  <span>{totalWeight}%</span>
                </div>

                {totalWeight > 100 ? (
                  <p className="mt-2 text-sm text-error-600 dark:text-error-300">Weights exceed 100%. Reduce one or more values before saving.</p>
                ) : null}
                {totalWeight < 100 ? (
                  <p className="mt-2 text-sm text-warning-700 dark:text-warning-300">Weights must total 100% before saving this review setup.</p>
                ) : null}
                {errors.weights && <p className="mt-2 text-sm text-error-600 dark:text-error-300">{errors.weights}</p>}
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">Framework Selection</div>
            <div className="panel-body space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFrameworkSelectionMode('AutoDetect')}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
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
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    frameworkSelectionMode === 'Manual'
                      ? 'bg-primary-600 text-white'
                      : 'border border-[#d7dce2] bg-white text-secondary-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-secondary-200'
                  }`}
                >
                  Choose manually
                </button>
              </div>

              <div className="grid gap-2">
                <div className="mb-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Primary Review Frameworks</p>
                  <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-300">These drive the main specialist review lenses in the analysis flow.</p>
                </div>
                {FRAMEWORK_OPTIONS.map((option) => {
                  const isChecked = requestedFrameworks.includes(option.value);
                  const isSuggested = suggestedFrameworks.includes(option.value);

                  return (
                    <label
                      key={option.value}
                      className={`rounded-lg border p-3 transition ${
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
                            {isSuggested ? <Badge variant="primary">Suggested</Badge> : null}
                          </div>
                          <p className="mt-1 text-sm leading-6 text-secondary-600 dark:text-secondary-300">{option.summary}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="grid gap-2">
                <div className="mb-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Additional Standards and Governance Criteria</p>
                  <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-300">These shape Foundry IQ grounding, compliance reasoning, and governance recommendations without creating extra specialist agents.</p>
                </div>
                {STANDARD_OPTIONS.map((option) => {
                  const isChecked = requestedStandards.includes(option.value);
                  const isSuggested = suggestedStandards.includes(option.value);

                  return (
                    <label
                      key={option.value}
                      className={`rounded-lg border p-3 transition ${
                        isSuggested
                          ? 'border-primary-200 bg-primary-50/60 dark:border-cyan-300/30 dark:bg-cyan-400/10'
                          : 'border-[#dde1e6] bg-white dark:border-white/10 dark:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStandard(option.value)}
                          disabled={frameworkSelectionMode !== 'Manual' || uploadMutation.isPending}
                          className="mt-1"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-secondary-950 dark:text-white">{option.label}</p>
                            {isSuggested ? <Badge variant="primary">Suggested</Badge> : null}
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
            <div className="panel-header">Architecture Input</div>
            <div className="panel-body space-y-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-2">
                  <label className="form-label">Diagram Image</label>
                  <div
                    className="rounded-xl border-2 border-dashed border-[#d7dce2] bg-[#fafafa] p-6 text-center transition hover:border-primary-500 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-cyan-300"
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
                      <span className="glow-icon mx-auto mb-3">
                        <UploadIcon className="h-5 w-5" />
                      </span>
                      <p className="font-semibold text-secondary-950 dark:text-white">
                        {selectedFile ? selectedFile.name : 'Drag and drop a diagram or click to browse'}
                      </p>
                      <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-300">
                        PNG, JPG, JPEG, or SVG. Text-only reviews are also supported.
                      </p>
                    </label>
                  </div>
                  {errors.file && <p className="text-sm text-error-600">{errors.file}</p>}
                </div>

                <div className="space-y-3">
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

                  {filePreview ? (
                    <div className="space-y-2">
                      <label className="form-label">Preview</label>
                      <img src={filePreview} alt="Diagram preview" className="max-h-56 rounded-xl border border-[#d7dce2] dark:border-white/10" />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#dde1e6] bg-[#fafafa] px-4 py-3 text-sm text-secondary-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-secondary-300">
                      Add an image or use the description field below for a text-only architecture review.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="form-label">Architecture Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the architecture, integrations, trust boundaries, constraints, and current gaps..."
                  rows={5}
                  className="form-textarea"
                  disabled={uploadMutation.isPending}
                />
              </div>
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

        <div className="space-y-5">
          <section className="panel p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Preview</p>
            <p className="mt-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">
              Framework selection, rationale, and quality priorities update live as you tune review criteria.
            </p>
          </section>
          <ReviewSetupSummary reviewSetup={preview} />
        </div>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
}) {
  const fieldId = `review-criteria-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="form-label">{label}</label>
      <select id={fieldId} value={value} onChange={(e) => onChange(e.target.value)} className="form-select h-9 py-1.5 text-sm">
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function CompactWeightField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (nextValue: number) => void;
}) {
  const fieldId = `weight-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <div className="rounded-lg border border-[#dde1e6] bg-white px-3 py-2 dark:border-white/10 dark:bg-[#08101d]">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={fieldId} className="text-sm font-semibold text-secondary-950 dark:text-white">{label}</label>
        <input
          id={fieldId}
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-8 w-20 rounded-md border border-[#d7dce2] bg-[#fafafa] px-2 text-right text-sm text-secondary-950 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
        />
      </div>
    </div>
  );
}
