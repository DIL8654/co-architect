import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-secondary-500 dark:text-secondary-400">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span className="text-secondary-300 dark:text-secondary-600">/</span>}
            {item.to && !isLast ? (
              <Link to={item.to} className="font-medium text-secondary-600 transition hover:text-primary-700 dark:text-secondary-300 dark:hover:text-cyan-200">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-semibold text-secondary-950 dark:text-white' : ''}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
