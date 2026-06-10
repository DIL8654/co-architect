import type { ArchitectureAnalysisResult, Tradeoff } from '../api/analysis';
import type { DiagramComment } from '../api/comments';
import type { ArchitectureDiagram } from '../api/diagrams';

export interface AdrDraft {
  title: string;
  status: string;
  date: string;
  context: string[];
  decision: string[];
  alternatives: string[];
  tradeoffs: string[];
  consequences: string[];
  risks: string[];
  frameworks: string[];
  markdown: string;
  html: string;
  history: string[];
}

export function buildAdrDraft({
  diagram,
  analysis,
  comments,
}: {
  diagram: ArchitectureDiagram;
  analysis: ArchitectureAnalysisResult | null;
  comments?: DiagramComment[];
}): AdrDraft {
  const title = `ADR: Improve architecture for ${diagram.name}`;
  const status = analysis ? 'Proposed' : 'Draft';
  const date = new Date(analysis?.createdAt ?? diagram.uploadedAt).toLocaleDateString();
  const frameworks = analysis?.reviewSetup.frameworkSelection.selectedFrameworks ?? diagram.reviewSetup.frameworkSelection.selectedFrameworks ?? [];

  const context = [
    diagram.description || 'Architecture evidence was uploaded without a long-form description.',
    analysis?.executiveSummary || 'No completed analysis is available yet, so the decision remains a draft.',
    ...((comments ?? []).slice(0, 3).map((comment) => `Stakeholder note: ${comment.content}`)),
  ].filter(Boolean);

  const decision = analysis?.recommendations.length
    ? analysis.recommendations.slice(0, 3).map((item) => `${item.title}: ${item.description}`)
    : ['Run architecture analysis to generate actionable recommendations.'];

  const alternatives = analysis?.tradeoffs.length
    ? analysis.tradeoffs.map((tradeoff) => tradeoff.scenario)
    : ['Keep the current architecture and monitor risk until more evidence is collected.'];

  const tradeoffs = analysis?.tradeoffs.length
    ? analysis.tradeoffs.slice(0, 4).map(formatTradeoff)
    : ['No trade-offs captured yet.'];

  const consequences = analysis?.missingControls.length
    ? analysis.missingControls.slice(0, 4).map((control) => `${control.name}: ${control.impact}`)
    : ['No major consequence set has been recorded yet.'];

  const risks = analysis?.criticNotes.length
    ? analysis.criticNotes
    : analysis?.openQuestions.length
      ? analysis.openQuestions
      : ['Further architecture review is needed to document implementation risks.'];

  const history = [
    `Uploaded architecture evidence on ${new Date(diagram.uploadedAt).toLocaleDateString()}.`,
    analysis?.createdAt ? `Generated AI review on ${new Date(analysis.createdAt).toLocaleDateString()}.` : 'No AI review history yet.',
    (comments ?? []).length > 0 ? `${comments?.length ?? 0} comment(s) are attached to this architecture.` : 'No stakeholder comments recorded.',
  ];

  const markdown = [
    `# ${title}`,
    '',
    `- Status: ${status}`,
    `- Date: ${date}`,
    `- Frameworks: ${frameworks.length ? frameworks.join(', ') : 'None selected'}`,
    '',
    '## Context',
    ...context.map((item) => `- ${item}`),
    '',
    '## Decision',
    ...decision.map((item) => `- ${item}`),
    '',
    '## Alternatives Considered',
    ...alternatives.map((item) => `- ${item}`),
    '',
    '## Trade-offs',
    ...tradeoffs.map((item) => `- ${item}`),
    '',
    '## Consequences',
    ...consequences.map((item) => `- ${item}`),
    '',
    '## Risks and Open Questions',
    ...risks.map((item) => `- ${item}`),
  ].join('\n');

  const html = `
    <article style="font-family: Inter, Arial, sans-serif; color: #111827; line-height: 1.65;">
      <h1 style="margin-bottom: 8px;">${escapeHtml(title)}</h1>
      <p style="margin: 0 0 20px; color: #4b5563;">Status: ${escapeHtml(status)} | Date: ${escapeHtml(date)}</p>
      ${renderSection('Context', context)}
      ${renderSection('Decision', decision)}
      ${renderSection('Alternatives Considered', alternatives)}
      ${renderSection('Trade-offs', tradeoffs)}
      ${renderSection('Consequences', consequences)}
      ${renderSection('Risks and Open Questions', risks)}
    </article>
  `.trim();

  return {
    title,
    status,
    date,
    context,
    decision,
    alternatives,
    tradeoffs,
    consequences,
    risks,
    frameworks,
    markdown,
    html,
    history,
  };
}

function renderSection(title: string, items: string[]) {
  return `
    <section style="margin: 24px 0;">
      <h2 style="margin: 0 0 12px; font-size: 18px;">${escapeHtml(title)}</h2>
      <ul style="margin: 0; padding-left: 20px;">
        ${items.map((item) => `<li style="margin-bottom: 8px;">${escapeHtml(item)}</li>`).join('')}
      </ul>
    </section>
  `;
}

function formatTradeoff(tradeoff: Tradeoff) {
  const pros = tradeoff.pros.length ? `Pros: ${tradeoff.pros.join(', ')}` : 'Pros: not captured';
  const cons = tradeoff.cons.length ? `Cons: ${tradeoff.cons.join(', ')}` : 'Cons: not captured';
  return `${tradeoff.scenario}. ${pros}. ${cons}.`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
