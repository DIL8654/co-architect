import { Badge } from './Badge';
import { Card } from './Card';
import type { DiagramReviewSetup } from '../api/diagrams';

interface ReviewSetupSummaryProps {
  reviewSetup: DiagramReviewSetup;
  compact?: boolean;
}

const frameworkLabels: Record<string, string> = {
  AzureWellArchitected: 'Azure WAF',
  AwsWellArchitected: 'AWS WAF',
  Iso25010: 'ISO 25010',
  OwaspAsvs: 'OWASP ASVS',
};
const standardLabels: Record<string, string> = {
  Iso27001: 'ISO 27001',
  Gdpr: 'GDPR',
  Soc2: 'SOC 2',
  Togaf: 'TOGAF',
  Safe: 'SAFe',
};

export function ReviewSetupSummary({ reviewSetup, compact = false }: ReviewSetupSummaryProps) {
  const selectedFrameworks = reviewSetup.frameworkSelection.selectedFrameworks ?? [];
  const selectedStandards = reviewSetup.frameworkSelection.selectedStandards ?? [];
  const topWeights = [...(reviewSetup.qualityAttributeWeights ?? [])]
    .sort((left, right) => right.weight - left.weight)
    .slice(0, compact ? 3 : 5);

  return (
    <Card header={compact ? 'Review Setup' : 'Architecture Review Setup'}>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">Frameworks</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {selectedFrameworks.length > 0 ? (
              selectedFrameworks.map((framework) => (
                <Badge key={framework} variant="secondary">
                  {frameworkLabels[framework] ?? framework}
                </Badge>
              ))
            ) : (
              <Badge variant="warning">No frameworks selected</Badge>
            )}
          </div>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            {reviewSetup.frameworkSelection.mode === 'Manual'
              ? 'Selected manually'
              : `Auto-detected with ${Math.round((reviewSetup.frameworkSelection.confidenceScore ?? 0) * 100)}% confidence`}
            {reviewSetup.frameworkSelection.detectedCloudProvider
              ? ` • ${reviewSetup.frameworkSelection.detectedCloudProvider}`
              : ''}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">Standards used</p>
          <div className="flex flex-wrap gap-2">
            {selectedStandards.length > 0 ? (
              selectedStandards.map((standard) => (
                <Badge key={standard} variant="primary">
                  {standardLabels[standard] ?? standard}
                </Badge>
              ))
            ) : (
              <Badge variant="warning">No additional standards selected</Badge>
            )}
          </div>
        </div>

        {reviewSetup.frameworkSelection.selectionRationale.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">Why these review lenses</p>
            <div className="space-y-2">
              {reviewSetup.frameworkSelection.selectionRationale.map((item) => (
                <p key={item} className="text-sm leading-6 text-secondary-600 dark:text-secondary-300">
                  {item}
                </p>
              ))}
            </div>
          </div>
        )}

        {topWeights.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">Priority weights</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {topWeights.map((weight) => (
                <div key={weight.key} className="rounded-xl border border-secondary-200 bg-secondary-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-secondary-950 dark:text-white">{weight.label}</span>
                    <span className="text-xs font-semibold text-secondary-500 dark:text-secondary-400">{weight.weight}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!compact && (
          <div className="grid gap-2 sm:grid-cols-2">
            <ContextField label="Business Domain" value={reviewSetup.reviewContext.businessDomain} />
            <ContextField label="Target Users" value={reviewSetup.reviewContext.targetUsers} />
            <ContextField label="Expected Traffic" value={reviewSetup.reviewContext.expectedTraffic} />
            <ContextField label="Data Sensitivity" value={reviewSetup.reviewContext.dataSensitivity} />
            <ContextField label="Cloud Preference" value={reviewSetup.reviewContext.cloudProviderPreference} />
            <ContextField label="Compliance" value={reviewSetup.reviewContext.complianceNeeds} />
          </div>
        )}
      </div>
    </Card>
  );
}

function ContextField({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null;
  }

  return (
    <div className="rounded-xl border border-secondary-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{label}</p>
      <p className="mt-1 text-sm text-secondary-700 dark:text-secondary-200">{value}</p>
    </div>
  );
}
