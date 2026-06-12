import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, SparkIcon } from './index';
import type { ArchitectureAnalysisResult } from '../api/analysis';
import type { DiagramReviewSetup, DiagramReviewSetupInput, ReviewFramework, ReviewStandard } from '../api/diagrams';
import { formatScoreBandLabel } from '../lib/scoreBands';

interface AnalysisStep {
  id: number;
  label: string;
  summary: string;
}

interface RunAnalysisButtonProps {
  workspaceId: string;
  diagramId: string;
  reviewSetup?: DiagramReviewSetup;
  onAnalysisComplete?: (analysis: ArchitectureAnalysisResult) => void;
  disabled?: boolean;
}

const ANALYSIS_STEPS: AnalysisStep[] = [
  { id: 1, label: 'Intake Agent', summary: 'Normalizes diagram evidence, context, and quality priorities.' },
  { id: 2, label: 'Diagram Understanding Agent', summary: 'Extracts architecture cues and missing evidence.' },
  { id: 3, label: 'Framework Selection Agent', summary: 'Resolves review frameworks and additional standards.' },
  { id: 4, label: 'Context Enrichment Agent', summary: 'Builds the shared architecture intelligence context.' },
  { id: 5, label: 'Foundry IQ Retrieval', summary: 'Retrieves framework, standards, principle, and trade-off grounding.' },
  { id: 6, label: 'Foundry Expert', summary: 'Runs one cost-aware Azure Foundry expert call when enabled.' },
  { id: 7, label: 'Framework Specialists', summary: 'Applies specialist review lenses in application orchestration.' },
  { id: 8, label: 'Trade-off Balancing Agent', summary: 'Balances risks, priorities, cost, and delivery constraints.' },
  { id: 9, label: 'Architecture Scoring Agent', summary: 'Suggests maturity evidence without calculating the final score.' },
  { id: 10, label: 'ADR Generation Agent', summary: 'Prepares decision-record evidence and consequences.' },
  { id: 11, label: 'Critic / Verifier Agent', summary: 'Checks grounding, evidence, uncertainty, and score ownership.' },
  { id: 12, label: 'Recommendation Composer Agent', summary: 'Composes the final architecture review report.' },
];

const FRAMEWORK_OPTIONS: Array<{ value: ReviewFramework; label: string }> = [
  { value: 'AzureWellArchitected', label: 'Azure Well-Architected' },
  { value: 'AwsWellArchitected', label: 'AWS Well-Architected' },
  { value: 'Iso25010', label: 'ISO/IEC 25010' },
  { value: 'OwaspAsvs', label: 'OWASP ASVS' },
];

const STANDARD_OPTIONS: Array<{ value: ReviewStandard; label: string }> = [
  { value: 'Iso27001', label: 'ISO 27001' },
  { value: 'Gdpr', label: 'GDPR' },
  { value: 'Soc2', label: 'SOC 2' },
  { value: 'Togaf', label: 'TOGAF' },
  { value: 'Safe', label: 'SAFe' },
];

const DEFAULT_WEIGHTS = [
  { key: 'security', label: 'Security', weight: 25 },
  { key: 'availability', label: 'Availability', weight: 20 },
  { key: 'scalability', label: 'Scalability', weight: 15 },
  { key: 'cost', label: 'Cost', weight: 10 },
  { key: 'maintainability', label: 'Maintainability', weight: 10 },
  { key: 'compliance', label: 'Compliance', weight: 10 },
  { key: 'deliverySpeed', label: 'Delivery Speed', weight: 10 },
];

export const RunAnalysisButton = React.forwardRef<HTMLButtonElement, RunAnalysisButtonProps>(
  ({ workspaceId, diagramId, reviewSetup, onAnalysisComplete, disabled }, ref) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<ArchitectureAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [setup, setSetup] = useState<DiagramReviewSetupInput>(() => toInput(reviewSetup));

    const totalWeight = setup.qualityAttributeWeights.reduce((sum, weight) => sum + Number(weight.weight || 0), 0);
    const groundingReadiness = useMemo(() => buildGroundingReadiness(setup), [setup]);

    const openModal = () => {
      setSetup(toInput(reviewSetup));
      setAnalysisResult(null);
      setError(null);
      setIsOpen(true);
    };

    const runAnalysis = async () => {
      if (totalWeight !== 100) {
        setError('Quality attribute weights must total exactly 100 before analysis starts.');
        return;
      }

      setIsRunning(true);
      setError(null);
      setAnalysisResult(null);

      try {
        const { analysisApi } = await import('../api/analysis');
        const result = await analysisApi.runAnalysis(workspaceId, diagramId, {
          reviewSetup: setup,
          persistReviewSetup: true,
        });
        setAnalysisResult(result);
        onAnalysisComplete?.(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to run analysis');
      } finally {
        setIsRunning(false);
      }
    };

    const handleClose = () => {
      if (!isRunning) {
        setIsOpen(false);
      }
    };

    return (
      <>
        <Button
          ref={ref}
          onClick={openModal}
          disabled={disabled || isRunning}
          isLoading={isRunning}
          icon={!isRunning ? <SparkIcon className="h-4 w-4" /> : undefined}
        >
          {isRunning ? 'Running Analysis...' : 'Run AI Analysis'}
        </Button>

        <Modal isOpen={isOpen} onClose={handleClose} title="Run Architecture Review" size="xl">
          <div className="max-h-[78vh] overflow-y-auto pr-1">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-5">
                <section className="rounded-xl border border-[#dde1e6] bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Review Setup</p>
                      <h3 className="mt-1 text-base font-semibold text-secondary-950 dark:text-white">Confirm criteria before agents run</h3>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${totalWeight === 100 ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400' : totalWeight > 100 ? 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300' : 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300'}`}>
                      Weights {totalWeight}%
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <CompactField label="Business domain" value={setup.businessDomain ?? ''} onChange={(value) => setSetup({ ...setup, businessDomain: value })} />
                    <CompactField label="Data sensitivity" value={setup.dataSensitivity ?? ''} onChange={(value) => setSetup({ ...setup, dataSensitivity: value })} />
                    <CompactField label="Expected traffic" value={setup.expectedTraffic ?? ''} onChange={(value) => setSetup({ ...setup, expectedTraffic: value })} />
                    <CompactField label="Compliance needs" value={setup.complianceNeeds ?? ''} onChange={(value) => setSetup({ ...setup, complianceNeeds: value })} />
                  </div>

                  <div className="mt-4">
                    <label className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Current pain points</label>
                    <textarea
                      value={setup.currentPainPoints ?? ''}
                      onChange={(event) => setSetup({ ...setup, currentPainPoints: event.target.value })}
                      className="mt-1 min-h-[72px] w-full rounded-lg border border-[#dde1e6] bg-white px-3 py-2 text-sm text-secondary-950 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-[#08101d] dark:text-white"
                      placeholder="Known risks, constraints, incidents, or concerns"
                    />
                  </div>
                </section>

                <section className="rounded-xl border border-[#dde1e6] bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Frameworks and Standards</p>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <CheckboxGroup
                      title="Primary review frameworks"
                      options={FRAMEWORK_OPTIONS}
                      values={setup.requestedFrameworks}
                      onChange={(values) => setSetup({ ...setup, frameworkSelectionMode: 'Manual', requestedFrameworks: values as ReviewFramework[] })}
                    />
                    <CheckboxGroup
                      title="Additional standards"
                      options={STANDARD_OPTIONS}
                      values={setup.requestedStandards}
                      onChange={(values) => setSetup({ ...setup, frameworkSelectionMode: 'Manual', requestedStandards: values as ReviewStandard[] })}
                    />
                  </div>
                </section>

                <section className="rounded-xl border border-[#dde1e6] bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Quality Attribute Weights</p>
                      <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-300">The application scoring engine uses these weights after AI suggests maturity evidence.</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setSetup({ ...setup, qualityAttributeWeights: DEFAULT_WEIGHTS })}>
                      Reset
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {setup.qualityAttributeWeights.map((weight, index) => (
                      <label key={weight.key} className="flex items-center justify-between gap-3 rounded-lg border border-[#eef1f4] px-3 py-2 dark:border-white/10">
                        <span className="text-sm font-medium text-secondary-800 dark:text-secondary-100">{weight.label}</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={weight.weight}
                          onChange={(event) => {
                            const next = [...setup.qualityAttributeWeights];
                            next[index] = { ...weight, weight: Number(event.target.value) };
                            setSetup({ ...setup, qualityAttributeWeights: next });
                          }}
                          className="h-8 w-16 rounded-md border border-[#dde1e6] bg-white px-2 text-right text-sm text-secondary-950 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-[#08101d] dark:text-white"
                        />
                      </label>
                    ))}
                  </div>
                  {totalWeight > 100 ? <p className="mt-3 text-sm font-semibold text-error-700 dark:text-error-300">Total weight is above 100%. Reduce one or more values before running analysis.</p> : null}
                  {totalWeight < 100 ? <p className="mt-3 text-sm font-semibold text-warning-700 dark:text-warning-300">Total weight must equal 100% before running analysis.</p> : null}
                </section>
              </div>

              <aside className="space-y-5">
                <section className="rounded-xl border border-[#dde1e6] bg-[#fafafa] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Foundry IQ Grounding Readiness</p>
                  <div className="mt-3 space-y-2">
                    {groundingReadiness.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm dark:bg-white/[0.04]">
                        <span className="font-medium text-secondary-800 dark:text-secondary-100">{item.label}</span>
                        <span className={item.count > 0 ? 'font-semibold text-success-700 dark:text-success-400' : 'font-semibold text-warning-700 dark:text-warning-300'}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-secondary-600 dark:text-secondary-300">
                    This preview estimates the knowledge sources that will be requested. The completed analysis will show exact retrieved citations.
                  </p>
                </section>

                <section className="rounded-xl border border-[#dde1e6] bg-[#fafafa] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Agentic Orchestration</p>
                  <p className="mt-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">
                    CoArchitect uses application-led multi-agent orchestration with one cost-aware Azure Foundry expert call when the AzureFoundry provider is enabled.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-secondary-600 dark:text-secondary-300">
                    This may call Azure Foundry when AzureFoundry provider is enabled.
                  </p>
                </section>

                <AnalysisPipeline isRunning={isRunning} isComplete={Boolean(analysisResult)} hasError={Boolean(error)} />
              </aside>
            </div>

            {error ? (
              <div className="mt-5 rounded-xl border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/25 dark:bg-error-500/10 dark:text-error-200">
                {error}
              </div>
            ) : null}

            {analysisResult ? (
              <div className="mt-5 rounded-xl border border-success-200 bg-success-50 p-4 dark:border-success-500/20 dark:bg-success-500/10">
                <p className="text-sm font-semibold text-success-900 dark:text-success-300">Analysis complete</p>
                <p className="mt-1 text-sm text-success-800 dark:text-success-200">
                  {analysisResult.finalScore !== undefined ? `Score ${analysisResult.finalScore.toFixed(1)}/100` : 'Review completed'} {analysisResult.scoreBand ? `· ${formatScoreBandLabel(analysisResult.scoreBand)}` : ''}
                </p>
                <p className="mt-2 text-xs text-success-700 dark:text-success-300">Final score calculated by CoArchitect scoring engine.</p>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[#e5e7eb] pt-4 dark:border-white/10">
              <Button variant="secondary" onClick={handleClose} disabled={isRunning}>
                Close
              </Button>
              {analysisResult ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    navigate(`/workspaces/${workspaceId}/diagrams/${diagramId}/analysis-runs/${analysisResult.id}`);
                    setIsOpen(false);
                  }}
                >
                  Open Workbench
                </Button>
              ) : (
                <Button variant="primary" onClick={runAnalysis} isLoading={isRunning} disabled={isRunning || totalWeight !== 100}>
                  Start Analysis
                </Button>
              )}
            </div>
          </div>
        </Modal>
      </>
    );
  }
);

RunAnalysisButton.displayName = 'RunAnalysisButton';

function toInput(setup?: DiagramReviewSetup): DiagramReviewSetupInput {
  return {
    businessDomain: setup?.reviewContext.businessDomain ?? '',
    targetUsers: setup?.reviewContext.targetUsers ?? '',
    expectedTraffic: setup?.reviewContext.expectedTraffic ?? '',
    dataSensitivity: setup?.reviewContext.dataSensitivity ?? '',
    cloudProviderPreference: setup?.reviewContext.cloudProviderPreference ?? '',
    complianceNeeds: setup?.reviewContext.complianceNeeds ?? '',
    currentPainPoints: setup?.reviewContext.currentPainPoints ?? '',
    frameworkSelectionMode: setup?.frameworkSelection.mode ?? 'AutoDetect',
    requestedFrameworks: setup?.frameworkSelection.requestedFrameworks?.length
      ? setup.frameworkSelection.requestedFrameworks
      : setup?.frameworkSelection.selectedFrameworks ?? [],
    requestedStandards: setup?.frameworkSelection.requestedStandards?.length
      ? setup.frameworkSelection.requestedStandards
      : setup?.frameworkSelection.selectedStandards ?? [],
    qualityAttributeWeights: setup?.qualityAttributeWeights?.length ? setup.qualityAttributeWeights : DEFAULT_WEIGHTS,
  };
}

function buildGroundingReadiness(setup: DiagramReviewSetupInput) {
  const complianceText = `${setup.complianceNeeds ?? ''} ${setup.dataSensitivity ?? ''}`.toLowerCase();
  return [
    { label: 'Frameworks', count: Math.max(setup.requestedFrameworks.length, setup.frameworkSelectionMode === 'AutoDetect' ? 2 : 0) },
    { label: 'Standards', count: setup.requestedStandards.length },
    { label: 'Compliance cues', count: complianceText.includes('gdpr') || complianceText.includes('pii') || complianceText.includes('audit') ? 1 : 0 },
    { label: 'Principle groups', count: setup.qualityAttributeWeights.filter((weight) => weight.weight > 0).slice(0, 4).length },
    { label: 'Trade-off focus', count: setup.qualityAttributeWeights.filter((weight) => weight.weight >= 10).slice(0, 4).length },
  ];
}

function CompactField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-9 w-full rounded-lg border border-[#dde1e6] bg-white px-3 text-sm text-secondary-950 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-[#08101d] dark:text-white"
      />
    </label>
  );
}

function CheckboxGroup<T extends string>({
  title,
  options,
  values,
  onChange,
}: {
  title: string;
  options: Array<{ value: T; label: string }>;
  values: T[];
  onChange: (values: T[]) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-secondary-950 dark:text-white">{title}</p>
      <div className="mt-2 space-y-2">
        {options.map((option) => {
          const checked = values.includes(option.value);
          return (
            <label key={option.value} className="flex items-center gap-2 rounded-lg border border-[#eef1f4] px-3 py-2 text-sm dark:border-white/10">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(checked ? values.filter((value) => value !== option.value) : [...values, option.value])}
              />
              <span className="text-secondary-800 dark:text-secondary-100">{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function AnalysisPipeline({ isRunning, isComplete, hasError }: { isRunning: boolean; isComplete: boolean; hasError: boolean }) {
  return (
    <section className="rounded-xl border border-[#dde1e6] bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Workflow Preview</p>
      <div className="mt-4 space-y-0">
        {ANALYSIS_STEPS.map((step, index) => {
          const status = hasError ? 'error' : isComplete ? 'done' : isRunning ? 'running' : 'pending';
          return (
            <div key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
              <div className="relative flex w-6 shrink-0 justify-center">
                {index < ANALYSIS_STEPS.length - 1 ? <span className="absolute top-5 h-[calc(100%-8px)] w-px bg-[#d7dce2] dark:bg-white/10" /> : null}
                <span className={`relative z-10 mt-1 h-3.5 w-3.5 rounded-full border-2 ${getNodeClass(status)}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-secondary-950 dark:text-white">{step.label}</p>
                <p className="mt-1 text-xs leading-5 text-secondary-600 dark:text-secondary-300">{step.summary}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function getNodeClass(status: 'pending' | 'running' | 'done' | 'error') {
  if (status === 'done') return 'border-success-500 bg-success-500';
  if (status === 'running') return 'border-primary-500 bg-primary-100 dark:bg-cyan-400/20';
  if (status === 'error') return 'border-error-500 bg-error-500';
  return 'border-secondary-300 bg-white dark:border-white/20 dark:bg-[#08101d]';
}
