import React from 'react';

export type IconProps = React.SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function LogoMark({ className = '', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 128 128" className={className} fill="none" {...props}>
      <path
        d="M93 34 64 20 26 42v44l38 22 29-17"
        stroke="url(#logoGradientOuter)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M84 45 64 34 38 49v30l26 15 20-11"
        stroke="url(#logoGradientInner)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M77 55 64 48 49 57v14l15 9 13-7"
        stroke="url(#logoGradientCore)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="logoGradientOuter" x1="26" y1="82" x2="94" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="0.55" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="logoGradientInner" x1="38" y1="77" x2="84" y2="37" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1D4ED8" />
          <stop offset="0.6" stopColor="#4338CA" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="logoGradientCore" x1="49" y1="73" x2="77" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return <svg {...base} {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>;
}

export function MoonIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M20.4 14.1A8.2 8.2 0 0 1 9.9 3.6 8.7 8.7 0 1 0 20.4 14.1Z" /></svg>;
}

export function SystemIcon(props: IconProps) {
  return <svg {...base} {...props}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>;
}

export function UserIcon(props: IconProps) {
  return <svg {...base} {...props}><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></svg>;
}

export function DashboardIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M4 13h6V4H4v9ZM14 20h6V4h-6v16ZM4 20h6v-3H4v3Z" /></svg>;
}

export function BuildingIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16" /><path d="M9 21v-4h3v4M8 7h1M12 7h1M8 11h1M12 11h1M20 21V10h-3" /></svg>;
}

export function WorkspaceIcon(props: IconProps) {
  return <svg {...base} {...props}><rect x="3" y="5" width="7" height="7" rx="1.5" /><rect x="14" y="5" width="7" height="7" rx="1.5" /><rect x="8.5" y="16" width="7" height="5" rx="1.5" /></svg>;
}

export function DiagramIcon(props: IconProps) {
  return <svg {...base} {...props}><rect x="3" y="4" width="6" height="5" rx="1.4" /><rect x="15" y="4" width="6" height="5" rx="1.4" /><rect x="9" y="15" width="6" height="5" rx="1.4" /><path d="M9 6.5h6M6 9v2a4 4 0 0 0 4 4h2M18 9v2a4 4 0 0 1-4 4h-2" /></svg>;
}

export function SettingsIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 7.07 4.2l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.13.38.49 1 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" /></svg>;
}

export function DocsIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v5h5M9 13h6M9 17h6M9 9h2" /></svg>;
}

export function HealthIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /><path d="M8 12h2l1.2-2.5L14 15l1.2-3H18" /></svg>;
}

export function PlusIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M12 5v14M5 12h14" /></svg>;
}

export function UploadIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>;
}

export function DownloadIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M12 4v12M7 11l5 5 5-5" /><path d="M4 20h16" /></svg>;
}

export function TrashIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M7 7l1 13h8l1-13" /><path d="M10 11v5M14 11v5" /></svg>;
}

export function RefreshIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M20 5v5h-5" /><path d="M4 19v-5h5" /><path d="M18 10a7 7 0 0 0-11.95-3.95L4 10M6 14a7 7 0 0 0 11.95 3.95L20 14" /></svg>;
}

export function FileIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /></svg>;
}

export function ArrowLeftIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>;
}

export function SparkIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M13 2 9.8 9.8 2 13l7.8 3.2L13 24l3.2-7.8L24 13l-7.8-3.2L13 2Z" transform="scale(.88) translate(1.6 1.4)" /></svg>;
}

export function CloseIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

export function ChevronRightIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="m9 6 6 6-6 6" /></svg>;
}

export function ChevronDownIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="m6 9 6 6 6-6" /></svg>;
}

export function BellIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M15 17H9" /><path d="M18 17H6c1.1-1 2-2.8 2-5V9a4 4 0 1 1 8 0v3c0 2.2.9 4 2 5Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
}
