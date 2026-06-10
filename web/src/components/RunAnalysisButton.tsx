import React, { useState, useEffect } from 'react';
import { Button, Modal, SparkIcon } from './index';
import type { ArchitectureAnalysisResult } from '../api/analysis';

interface AnalysisStep {
  id: number;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
}

interface RunAnalysisButtonProps {
  workspaceId: string;
  diagramId: string;
  onAnalysisComplete?: (analysis: ArchitectureAnalysisResult) => void;
  disabled?: boolean;
}

const ANALYSIS_STEPS: Omit<AnalysisStep, 'status'>[] = [
  { id: 1, label: 'Parsing Architecture' },
  { id: 2, label: 'Security Review' },
  { id: 3, label: 'Availability Review' },
  { id: 4, label: 'Scalability Review' },
  { id: 5, label: 'Tradeoff Analysis' },
  { id: 6, label: 'Recommendation Generation' },
  { id: 7, label: 'Score Calculation' },
];

const STEP_DURATION = 1200; // 1.2 seconds per step for smooth animation
const TOTAL_DURATION = ANALYSIS_STEPS.length * STEP_DURATION;

export const RunAnalysisButton = React.forwardRef<HTMLButtonElement, RunAnalysisButtonProps>(
  ({ workspaceId, diagramId, onAnalysisComplete, disabled }, ref) => {
    const [isRunning, setIsRunning] = useState(false);
    const [steps, setSteps] = useState<AnalysisStep[]>(
      ANALYSIS_STEPS.map((step) => ({ ...step, status: 'pending' as const }))
    );
    const [analysisResult, setAnalysisResult] = useState<ArchitectureAnalysisResult | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Animate through steps
    useEffect(() => {
      if (!isRunning) return;

      const timings = ANALYSIS_STEPS.map((_, index) => ({
        startTime: index * STEP_DURATION,
        endTime: (index + 1) * STEP_DURATION,
      }));

      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;

        setSteps((prevSteps) =>
          prevSteps.map((step, index) => {
            const timing = timings[index];

            if (elapsed < timing.startTime) {
              return { ...step, status: 'pending' as const };
            } else if (elapsed < timing.endTime) {
              return { ...step, status: 'in-progress' as const };
            } else {
              return { ...step, status: 'completed' as const };
            }
          })
        );

        if (elapsed >= TOTAL_DURATION) {
          clearInterval(interval);
          runAnalysisAPI();
        }
      }, 50);

      return () => clearInterval(interval);
    }, [isRunning]);

    const runAnalysisAPI = async () => {
      try {
        const { analysisApi } = await import('../api/analysis');
        const result = await analysisApi.runAnalysis(workspaceId, diagramId);
        setAnalysisResult(result);
        setShowResults(true);
        onAnalysisComplete?.(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to run analysis';
        setError(errorMessage);
        setSteps((prevSteps) => prevSteps.map((step) => ({ ...step, status: 'error' as const })));
      } finally {
        setIsRunning(false);
      }
    };

    const handleStartAnalysis = () => {
      setIsRunning(true);
      setError(null);
      setAnalysisResult(null);
      setSteps(ANALYSIS_STEPS.map((step) => ({ ...step, status: 'pending' as const })));
    };

    const handleCloseResults = () => {
      setShowResults(false);
    };

    return (
      <>
        <Button
          ref={ref}
          onClick={handleStartAnalysis}
          disabled={disabled || isRunning}
          isLoading={isRunning}
          icon={!isRunning ? <SparkIcon className="h-4 w-4" /> : undefined}
        >
          {isRunning ? 'Running Analysis...' : 'Run AI Analysis'}
        </Button>

        {/* Progress Modal */}
        <Modal isOpen={isRunning} onClose={() => {}} title="AI Architecture Analysis">
          <div className="space-y-6 p-6">
            <p className="text-sm text-secondary-600 dark:text-secondary-300">
              Analyzing your architecture diagram using AI agents...
            </p>

            {/* Progress Steps */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.id} className="space-y-1">
                  <div className="flex items-center gap-3">
                    {/* Status Indicator */}
                    <div className="flex-shrink-0">
                      {step.status === 'pending' && (
                        <div className="h-6 w-6 rounded-full border-2 border-secondary-300 bg-secondary-50 dark:border-white/15 dark:bg-white/[0.04]" />
                      )}
                      {step.status === 'in-progress' && (
                        <div className="w-6 h-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                      )}
                      {step.status === 'completed' && (
                        <div className="w-6 h-6 rounded-full bg-success-500 flex items-center justify-center">
                          <span className="text-xs text-white">✓</span>
                        </div>
                      )}
                      {step.status === 'error' && (
                        <div className="w-6 h-6 rounded-full bg-error-500 flex items-center justify-center">
                          <span className="text-xs text-white">✕</span>
                        </div>
                      )}
                    </div>

                    {/* Step Label and Progress */}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-secondary-950 dark:text-white">{step.label}</p>
                      {step.status === 'in-progress' && (
                        <div className="mt-1 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-400 rounded animate-pulse" />
                      )}
                    </div>

                    {/* Progress Index */}
                    <span className="text-xs text-secondary-500 font-medium">
                      {index + 1}/{ANALYSIS_STEPS.length}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <p className="text-xs font-medium text-secondary-600 dark:text-secondary-300">Overall Progress</p>
                <p className="text-xs font-medium text-primary-600">
                  {Math.round((steps.filter((s) => s.status === 'completed').length / ANALYSIS_STEPS.length) * 100)}%
                </p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary-200 dark:bg-white/10">
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(steps.filter((s) => s.status === 'completed').length / ANALYSIS_STEPS.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 rounded-xl border border-error-200 bg-error-50 p-3 dark:border-error-500/25 dark:bg-error-500/10">
                <p className="text-xs text-error-700 dark:text-error-200">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}

            {/* Status Message */}
            <p className="text-center text-xs text-secondary-500 dark:text-secondary-400">
              {steps.every((s) => s.status === 'completed')
                ? 'Analysis complete. Results will display momentarily...'
                : 'This may take a minute. Please keep the page open.'}
            </p>
          </div>
        </Modal>

        {/* Results Modal */}
        <Modal isOpen={showResults && !isRunning} onClose={handleCloseResults} title="Analysis Complete ✓">
          <div className="space-y-6 p-6">
            {analysisResult && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-cyan-300/20 dark:bg-cyan-400/10">
                    <p className="text-xs text-primary-700 font-medium mb-2">Status</p>
                    <p className="text-sm font-semibold text-primary-900 dark:text-cyan-100">{analysisResult.status}</p>
                  </div>
                  {analysisResult.finalScore && (
                    <div className="rounded-xl border border-success-200 bg-success-50 p-4 dark:border-success-500/20 dark:bg-success-500/10">
                      <p className="text-xs text-success-700 font-medium mb-2">Architecture Score</p>
                      <p className="text-2xl font-bold text-success-900 dark:text-success-500">{analysisResult.finalScore.toFixed(1)}/100</p>
                    </div>
                  )}
                </div>

                {analysisResult.scoreBand && (
                  <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <p className="text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-2">Maturity Band</p>
                    <p className="text-sm font-semibold text-secondary-950 dark:text-white">{analysisResult.scoreBand}</p>
                  </div>
                )}

                {analysisResult.missingControls && analysisResult.missingControls.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-secondary-950 dark:text-white">Missing Controls</h4>
                    <div className="space-y-2">
                      {analysisResult.missingControls.slice(0, 3).map((control, idx) => (
                        <div key={idx} className="border-l-2 border-warning-400 bg-warning-50 p-2 text-xs dark:bg-warning-500/10">
                          <p className="font-semibold text-warning-900 dark:text-warning-500">{control.name}</p>
                          <p className="mt-1 text-warning-700 dark:text-warning-500">{control.recommendation}</p>
                        </div>
                      ))}
                      {analysisResult.missingControls.length > 3 && (
                        <p className="text-xs text-secondary-600 dark:text-secondary-400">
                          +{analysisResult.missingControls.length - 3} more controls
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-secondary-950 dark:text-white">Top Recommendations</h4>
                    <div className="space-y-2">
                      {analysisResult.recommendations.slice(0, 3).map((rec, idx) => (
                        <div key={idx} className="border-l-2 border-blue-400 bg-blue-50 p-2 text-xs dark:bg-cyan-400/10">
                          <p className="font-semibold text-blue-900 dark:text-cyan-100">{rec.title}</p>
                          <p className="mt-1 text-blue-700 dark:text-cyan-200">{rec.description}</p>
                        </div>
                      ))}
                      {analysisResult.recommendations.length > 3 && (
                        <p className="text-xs text-secondary-600 dark:text-secondary-400">
                          +{analysisResult.recommendations.length - 3} more recommendations
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2 border-t border-secondary-200 pt-4 dark:border-white/10">
              <Button variant="secondary" onClick={handleCloseResults} className="flex-1">
                Close
              </Button>
              <Button variant="primary" onClick={handleCloseResults} className="flex-1">
                View Full Analysis
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }
);

RunAnalysisButton.displayName = 'RunAnalysisButton';
