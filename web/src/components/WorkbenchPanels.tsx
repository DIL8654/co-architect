import React from 'react';
import { type AdrDraft } from '../lib/adrDraft';

export function SegmentedTabs({
  items,
  activeValue,
  onChange,
}: {
  items: Array<{ value: string; label: string }>;
  activeValue: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex min-w-0 gap-1 overflow-x-auto rounded-lg bg-[#f4f6f8] p-1 dark:bg-white/[0.05]">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold transition ${
            activeValue === item.value
              ? 'bg-white text-primary-700 shadow-sm dark:bg-white/[0.08] dark:text-cyan-100'
              : 'text-secondary-600 hover:text-secondary-950 dark:text-secondary-300 dark:hover:text-white'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function MetaPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <h3 className="text-sm font-semibold text-secondary-950 dark:text-white">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#d7dce2] bg-[#fafafa] p-5 text-center dark:border-white/10 dark:bg-white/[0.03]">
      <p className="font-semibold text-secondary-950 dark:text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-secondary-600 dark:text-secondary-300">{description}</p>
    </div>
  );
}

export function CodePanel({ title, code }: { title: string; code: string }) {
  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <h3 className="text-sm font-semibold text-secondary-950 dark:text-white">{title}</h3>
      <pre className="mt-3 overflow-auto rounded-lg border border-[#e5e7eb] bg-white p-3 text-xs leading-6 text-secondary-700 dark:border-white/10 dark:bg-[#060B16] dark:text-secondary-200">
        <code>{code}</code>
      </pre>
    </section>
  );
}

export function AdrPreview({ draft }: { draft: AdrDraft }) {
  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 dark:border-white/10 dark:bg-[#060B16]">
      <div className="border-b border-[#eef1f4] pb-4 dark:border-white/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">ADR Preview</p>
        <h3 className="mt-2 text-xl font-semibold text-secondary-950 dark:text-white">{draft.title}</h3>
        <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
          {draft.status} | {draft.date} | {draft.frameworks.join(', ') || 'No frameworks selected'}
        </p>
      </div>
      <div className="mt-4 space-y-5">
        <AdrSection title="Context" items={draft.context} />
        <AdrSection title="Decision" items={draft.decision} />
        <AdrSection title="Alternatives Considered" items={draft.alternatives} />
        <AdrSection title="Trade-offs" items={draft.tradeoffs} />
        <AdrSection title="Consequences" items={draft.consequences} />
        <AdrSection title="Risks and Open Questions" items={draft.risks} />
      </div>
    </section>
  );
}

function AdrSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h4 className="text-sm font-semibold text-secondary-950 dark:text-white">{title}</h4>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
