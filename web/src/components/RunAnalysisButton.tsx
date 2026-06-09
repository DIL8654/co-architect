import React, { useState, useEffect } from 'react';
import { Button, Modal } from './index';
import type { ArchitectureAnalysisResult } from '../api/analysis';

interface AnalysisStep {
  id: number;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
}

interface RunAnalysisButtonProps {
  organizationId: string;
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
  ({ organizationId, diagramId, onAnalysisComplete, disabled }, ref) => {
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
        const result = await analysisApi.runAnalysis(organizationId, diagramId);
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
        >
          {isRunning ? 'Running Analysis...' : 'Run AI Analysis'}
        </Button>

        {/* Progress Modal */}
        <Modal isOpen={isRunning} onClose={() => {}} title="AI Architecture Analysis">
          <div className="space-y-6 p-6">
            <p className="text-secondary-600 text-sm">
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
                        <div className="w-6 h-6 rounded-full border-2 border-secondary-300 bg-secondary-50" />
                      )}
                      {step.status === 'in-progress' && (
                        <div className="w-6 h-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                      )}
                      {step.status === 'completed' && (
                        <div className="w-6 h-6 rounded-full bg-success-500 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      {step.status === 'error' && (
                        <div className="w-6 h-6 rounded-full bg-error-500 flex items-center justify-center">
                          <span className="text-white text-xs">✕</span>
                        </div>
                      )}
                    </div>

                    {/* Step Label and Progress */}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-secondary-900">{step.label}</p>
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
                <p className="text-xs font-medium text-secondary-600">Overall Progress</p>
                <p className="text-xs font-medium text-primary-600">
                  {Math.round((steps.filter((s) => s.status === 'completed').length / ANALYSIS_STEPS.length) * 100)}%
                </p>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-2 overflow-hidden">
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
              <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg">
                <p className="text-xs text-error-700">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}

            {/* Status Message */}
            <p className="text-xs text-secondary-500 text-center">
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
                  <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                    <p className="text-xs text-primary-700 font-medium mb-2">Status</p>
                    <p className="text-sm font-semibold text-primary-900">{analysisResult.status}</p>
                  </div>
                  {analysisResult.finalScore && (
                    <div className="p-4 bg-success-50 rounded-lg border border-success-200">
                      <p className="text-xs text-success-700 font-medium mb-2">Architecture Score</p>
                      <p className="text-2xl font-bold text-success-900">{analysisResult.finalScore.toFixed(1)}/100</p>
                    </div>
                  )}
                </div>

                {analysisResult.scoreBand && (
                  <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                    <p className="text-xs text-secondary-700 font-medium mb-2">Maturity Band</p>
                    <p className="text-sm font-semibold text-secondary-900">{analysisResult.scoreBand}</p>
                  </div>
                )}

                {analysisResult.missingControls && analysisResult.missingControls.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-secondary-900">Missing Controls</h4>
                    <div className="space-y-2">
                      {analysisResult.missingControls.slice(0, 3).map((control, idx) => (
                        <div key={idx} className="p-2 bg-warning-50 border-l-2 border-warning-400 text-xs">
                          <p className="font-medium text-warning-900">{control.name}</p>
                          <p className="text-warning-700 mt-1">{control.recommendation}</p>
                        </div>
                      ))}
                      {analysisResult.missingControls.length > 3 && (
                        <p className="text-xs text-secondary-600">
                          +{analysisResult.missingControls.length - 3} more controls
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-secondary-900">Top Recommendations</h4>
                    <div className="space-y-2">
                      {analysisResult.recommendations.slice(0, 3).map((rec, idx) => (
                        <div key={idx} className="p-2 bg-blue-50 border-l-2 border-blue-400 text-xs">
                          <p className="font-medium text-blue-900">{rec.title}</p>
                          <p className="text-blue-700 mt-1">{rec.description}</p>
                        </div>
                      ))}
                      {analysisResult.recommendations.length > 3 && (
                        <p className="text-xs text-secondary-600">
                          +{analysisResult.recommendations.length - 3} more recommendations
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2 pt-4 border-t border-secondary-200">
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
