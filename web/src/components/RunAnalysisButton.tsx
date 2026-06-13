import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ChevronDownIcon, ChevronRightIcon, Modal, SparkIcon } from './index';
import type { ArchitectureAnalysisResult } from '../api/analysis';
import { getErrorMessage, getHttpStatus, getRetryAfterSeconds } from '../api/axios';
import type { DiagramReviewSetup, DiagramReviewSetupInput, ReviewFramework, ReviewStandard } from '../api/diagrams';
import { formatScoreBandLabel } from '../lib/scoreBands';

interface AnalysisStep {
  id: number;
  label: string;
  summary: string;
}

type ModalWorkflowStepStatus = 'pending' | 'active' | 'completed' | 'error';

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
    const [openSections, setOpenSections] = useState({
      context: true,
      frameworks: false,
      weights: false,
    });
    const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
    const [errorStepIndex, setErrorStepIndex] = useState<number | null>(null);
    const activeStepIndexRef = useRef<number | null>(null);
    const workflowScrollerRef = useRef<HTMLDivElement | null>(null);
    const workflowStepRefs = useRef<Array<HTMLDivElement | null>>([]);

    const totalWeight = setup.qualityAttributeWeights.reduce((sum, weight) => sum + Number(weight.weight || 0), 0);

    const openModal = () => {
      setSetup(toInput(reviewSetup));
      setAnalysisResult(null);
      setError(null);
      setOpenSections({ context: true, frameworks: false, weights: false });
      setActiveStepIndex(null);
      setErrorStepIndex(null);
      setIsOpen(true);
    };

    useEffect(() => {
      activeStepIndexRef.current = activeStepIndex;
    }, [activeStepIndex]);

    useEffect(() => {
      if (!isRunning && errorStepIndex === null) {
        return;
      }

      const targetIndex = errorStepIndex ?? activeStepIndex;
      if (targetIndex === null) {
        return;
      }

      const container = workflowScrollerRef.current;
      const step = workflowStepRefs.current[targetIndex];
      if (!container || !step) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const stepRect = step.getBoundingClientRect();
      const margin = 56;

      const isOutOfViewLeft = stepRect.left < containerRect.left + margin;
      const isOutOfViewRight = stepRect.right > containerRect.right - margin;

      if (!isOutOfViewLeft && !isOutOfViewRight) {
        return;
      }

      const desiredLeft = step.offsetLeft - Math.max(24, container.clientWidth * 0.2);
      const maxLeft = Math.max(0, container.scrollWidth - container.clientWidth);
      const nextLeft = Math.min(Math.max(0, desiredLeft), maxLeft);

      if (typeof container.scrollTo === 'function') {
        container.scrollTo({
          left: nextLeft,
          behavior: 'smooth',
        });
        return;
      }

      container.scrollLeft = nextLeft;
    }, [activeStepIndex, errorStepIndex, isRunning]);

    useEffect(() => {
      if (!isRunning) {
        return undefined;
      }

      const timer = window.setInterval(() => {
        setActiveStepIndex((current) => {
          if (current === null) {
            return 0;
          }

          if (current >= ANALYSIS_STEPS.length - 1) {
            return current;
          }

          return current + 1;
        });
      }, 650);

      return () => window.clearInterval(timer);
    }, [isRunning]);

    const runAnalysis = async () => {
      if (totalWeight !== 100) {
        setError('Quality attribute weights must total exactly 100 before analysis starts.');
        return;
      }

      setIsRunning(true);
      setError(null);
      setAnalysisResult(null);
      setErrorStepIndex(null);
      setActiveStepIndex(0);

      try {
        const { analysisApi } = await import('../api/analysis');
        const result = await analysisApi.runAnalysis(workspaceId, diagramId, {
          reviewSetup: setup,
          persistReviewSetup: true,
        });
        setActiveStepIndex(ANALYSIS_STEPS.length - 1);
        setAnalysisResult(result);
        onAnalysisComplete?.(result);
      } catch (err) {
        const status = getHttpStatus(err);
        if (status === 429) {
          const retryAfterSeconds = getRetryAfterSeconds(err);
          const retryHint = retryAfterSeconds
            ? ` Try again in about ${retryAfterSeconds} seconds.`
            : ' Please wait a minute before starting another review.';
          setError(`Architecture review is temporarily limited. This public MVP uses cost-sensitive AI analysis to stay available for everyone.${retryHint}`);
        } else {
          setError(getErrorMessage(err));
        }
        setErrorStepIndex(activeStepIndexRef.current ?? 0);
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

        <Modal isOpen={isOpen} onClose={handleClose} title="Run Architecture Review" size="2xl">
          <div className="max-h-[80vh] overflow-y-auto pr-1">
            <div className="space-y-3.5">
              <AnalysisPipeline
                isRunning={isRunning}
                isComplete={Boolean(analysisResult)}
                activeStepIndex={activeStepIndex}
                errorStepIndex={errorStepIndex}
                scrollContainerRef={workflowScrollerRef}
                stepRefs={workflowStepRefs}
              />

              <section className="rounded-xl border border-[#dde1e6] bg-white p-2.5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex flex-wrap items-start justify-between gap-2.5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-500">Review Setup</p>
                    <h3 className="mt-1 text-sm font-semibold text-secondary-950 dark:text-white">Confirm criteria before agents run</h3>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${totalWeight === 100 ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400' : totalWeight > 100 ? 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300' : 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300'}`}>
                    Weights {totalWeight}%
                  </span>
                </div>

                <div className="mt-3 space-y-2.5">
                  <AccordionSection
                    title="Business and Operating Context"
                    isOpen={openSections.context}
                    onToggle={() => setOpenSections((current) => ({ ...current, context: !current.context }))}
                  >
                    <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                      <CompactField label="Business domain" value={setup.businessDomain ?? ''} onChange={(value) => setSetup({ ...setup, businessDomain: value })} />
                      <CompactField label="Data sensitivity" value={setup.dataSensitivity ?? ''} onChange={(value) => setSetup({ ...setup, dataSensitivity: value })} />
                      <CompactField label="Expected traffic" value={setup.expectedTraffic ?? ''} onChange={(value) => setSetup({ ...setup, expectedTraffic: value })} />
                      <CompactField label="Compliance needs" value={setup.complianceNeeds ?? ''} onChange={(value) => setSetup({ ...setup, complianceNeeds: value })} />
                    </div>
                    <div className="mt-2.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-secondary-500">Current pain points</label>
                      <textarea
                        value={setup.currentPainPoints ?? ''}
                        onChange={(event) => setSetup({ ...setup, currentPainPoints: event.target.value })}
                        className="mt-1 min-h-[48px] w-full rounded-lg border border-[#dde1e6] bg-white px-3 py-2 text-sm text-secondary-950 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-[#08101d] dark:text-white"
                        placeholder="Known risks, constraints, incidents, or concerns"
                      />
                    </div>
                  </AccordionSection>

                  <AccordionSection
                    title="Frameworks and Standards"
                    isOpen={openSections.frameworks}
                    onToggle={() => setOpenSections((current) => ({ ...current, frameworks: !current.frameworks }))}
                  >
                    <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <CheckboxGroup
                        title="Primary review frameworks"
                        options={FRAMEWORK_OPTIONS}
                        values={setup.requestedFrameworks}
                        onChange={(values) => setSetup({ ...setup, frameworkSelectionMode: 'Manual', requestedFrameworks: values as ReviewFramework[] })}
                        compact
                        horizontal
                      />
                      <CheckboxGroup
                        title="Additional standards"
                        options={STANDARD_OPTIONS}
                        values={setup.requestedStandards}
                        onChange={(values) => setSetup({ ...setup, frameworkSelectionMode: 'Manual', requestedStandards: values as ReviewStandard[] })}
                        compact
                        horizontal
                      />
                    </div>
                  </AccordionSection>

                  <AccordionSection
                    title="Quality Attribute Weights"
                    isOpen={openSections.weights}
                    onToggle={() => setOpenSections((current) => ({ ...current, weights: !current.weights }))}
                    headerAction={
                      <Button variant="secondary" size="sm" onClick={() => setSetup({ ...setup, qualityAttributeWeights: DEFAULT_WEIGHTS })}>
                        Reset
                      </Button>
                    }
                  >
                    <p className="text-[11px] leading-4 text-secondary-600 dark:text-secondary-300">Final score is calculated by the application scoring engine.</p>
                    <div className="mt-2.5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      {setup.qualityAttributeWeights.map((weight, index) => (
                        <label key={weight.key} className="flex min-h-[34px] items-center justify-between gap-3 rounded-lg border border-[#eef1f4] bg-white px-3 py-1.5 dark:border-white/10 dark:bg-[#08101d]">
                          <span className="text-xs font-medium text-secondary-800 dark:text-secondary-100">{weight.label}</span>
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
                            className="h-7 w-14 rounded-md border border-[#dde1e6] bg-white px-2 text-right text-xs text-secondary-950 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-[#08101d] dark:text-white"
                          />
                        </label>
                      ))}
                    </div>
                  </AccordionSection>
                </div>

                <div className="mt-2.5 min-h-[20px]">
                  {totalWeight > 100 ? <p className="text-sm font-semibold text-error-700 dark:text-error-300">Total weight is above 100%. Reduce one or more values before running analysis.</p> : null}
                  {totalWeight < 100 ? <p className="text-sm font-semibold text-warning-700 dark:text-warning-300">Total weight must equal 100% before running analysis.</p> : null}
                </div>
              </section>
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
                    navigate(`/app/workspaces/${workspaceId}/diagrams/${diagramId}/analysis-runs/${analysisResult.id}`);
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

function CompactField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex min-w-0 flex-col">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-secondary-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-8 w-full rounded-lg border border-[#dde1e6] bg-white px-2.5 text-sm text-secondary-950 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-[#08101d] dark:text-white"
      />
    </label>
  );
}

function CheckboxGroup<T extends string>({
  title,
  options,
  values,
  onChange,
  compact = false,
  horizontal = false,
}: {
  title: string;
  options: Array<{ value: T; label: string }>;
  values: T[];
  onChange: (values: T[]) => void;
  compact?: boolean;
  horizontal?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-secondary-950 dark:text-white`}>{title}</p>
      <div className={`mt-2 ${horizontal ? 'flex flex-wrap gap-1.5' : compact ? 'space-y-1.5' : 'space-y-2'}`}>
        {options.map((option) => {
          const checked = values.includes(option.value);
          return (
            <label
              key={option.value}
              className={`flex min-h-[32px] items-center gap-2 rounded-lg border border-[#eef1f4] dark:border-white/10 ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'} ${horizontal ? 'shrink-0 bg-white dark:bg-[#08101d]' : ''}`}
            >
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

function AnalysisPipeline({
  isRunning,
  isComplete,
  activeStepIndex,
  errorStepIndex,
  scrollContainerRef,
  stepRefs,
}: {
  isRunning: boolean;
  isComplete: boolean;
  activeStepIndex: number | null;
  errorStepIndex: number | null;
  scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  stepRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
}) {
  return (
    <section className="rounded-xl border border-[#dde1e6] bg-white p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-500">Workflow Preview</p>
          <p className="mt-1 text-[11px] leading-4 text-secondary-600 dark:text-secondary-300">
            Application-led orchestration with one cost-aware Azure Foundry expert call when the AzureFoundry provider is enabled.
          </p>
        </div>
        <p className="text-[11px] text-secondary-500 dark:text-secondary-400">Animated preview of the review pipeline</p>
      </div>
      <div ref={scrollContainerRef} className="mt-3 overflow-x-auto pb-1">
        <div className="flex min-w-[1080px] items-start gap-0">
        {ANALYSIS_STEPS.map((step, index) => {
          const status = getModalWorkflowStepStatus({
            index,
            isComplete,
            activeStepIndex,
            errorStepIndex,
          });
          return (
            <div
              key={step.id}
              ref={(node) => {
                stepRefs.current[index] = node;
              }}
              data-testid={`workflow-step-${step.id}`}
              data-status={status}
              className={`workflow-step-active relative flex min-w-[132px] flex-1 flex-col items-center text-center ${status === 'active' ? 'workflow-step-active' : ''}`}
            >
              <div className="relative flex w-full items-center justify-center">
                {index < ANALYSIS_STEPS.length - 1 ? (
                  <span className={`absolute left-[calc(50%+14px)] right-[-50%] top-[6px] h-px ${getWorkflowConnectorClass(status)}`} />
                ) : null}
                <span className={`relative z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 ${getNodeClass(status)}`}>
                  {status === 'active' ? <span className="workflow-node-pulse" /> : null}
                </span>
              </div>
              <div className="mt-2 min-w-0 px-2">
                <p className={`text-xs font-semibold leading-5 ${status === 'active' ? 'text-primary-700 dark:text-cyan-200' : 'text-secondary-950 dark:text-white'}`}>
                  {getWorkflowStepLabel(step.label)}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-secondary-600 dark:text-secondary-300">{step.summary}</p>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </section>
  );
}

function AccordionSection({
  title,
  isOpen,
  onToggle,
  headerAction,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#eef1f4] bg-[#fafafa] dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 px-2.5 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={isOpen}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[#dde1e6] bg-white text-secondary-500 dark:border-white/10 dark:bg-[#08101d] dark:text-secondary-300">
            {isOpen ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-secondary-500">{title}</span>
        </button>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      {isOpen ? <div className="border-t border-[#eef1f4] px-2.5 py-2.5 dark:border-white/10">{children}</div> : null}
    </section>
  );
}

function getWorkflowStepLabel(label: string) {
  return label
    .replace(' Agent', '')
    .replace('Framework Specialists', 'Specialists')
    .replace('Recommendation Composer', 'Composer')
    .replace('Trade-off Balancing', 'Trade-offs')
    .replace('Context Enrichment', 'Enrichment');
}

function getModalWorkflowStepStatus({
  index,
  isComplete,
  activeStepIndex,
  errorStepIndex,
}: {
  index: number;
  isComplete: boolean;
  activeStepIndex: number | null;
  errorStepIndex: number | null;
}): ModalWorkflowStepStatus {
  if (errorStepIndex === index) {
    return 'error';
  }

  if (isComplete) {
    return 'completed';
  }

  if (activeStepIndex === null) {
    return 'pending';
  }

  if (index < activeStepIndex) {
    return 'completed';
  }

  if (index === activeStepIndex) {
    return 'active';
  }

  return 'pending';
}

function getNodeClass(status: ModalWorkflowStepStatus) {
  if (status === 'completed') return 'border-success-500 bg-success-500 shadow-[0_0_0_4px_rgba(34,197,94,0.12)]';
  if (status === 'active') return 'border-primary-500 bg-primary-100 dark:border-cyan-300 dark:bg-cyan-400/20 shadow-[0_0_0_5px_rgba(59,130,246,0.12)] dark:shadow-[0_0_0_5px_rgba(34,211,238,0.12)]';
  if (status === 'error') return 'border-error-500 bg-error-500 shadow-[0_0_0_4px_rgba(239,68,68,0.12)]';
  return 'border-secondary-300 bg-white dark:border-white/20 dark:bg-[#08101d]';
}

function getWorkflowConnectorClass(status: ModalWorkflowStepStatus) {
  if (status === 'completed') {
    return 'bg-success-300 dark:bg-success-500/60';
  }

  if (status === 'active') {
    return 'bg-primary-300 dark:bg-cyan-400/50';
  }

  if (status === 'error') {
    return 'bg-error-300 dark:bg-error-500/60';
  }

  return 'bg-[#d7dce2] dark:bg-white/10';
}
