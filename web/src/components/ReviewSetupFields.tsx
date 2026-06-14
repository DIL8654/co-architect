import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function CompactSelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  idPrefix = 'review-field',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  idPrefix?: string;
}) {
  const fieldId = `${idPrefix}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="form-label">{label}</label>
      <select
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="form-select h-9 py-1.5 text-sm"
      >
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

export function CompactMultiSelectField({
  label,
  values,
  onChange,
  options,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: readonly string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const fieldId = useMemo(() => `review-multiselect-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, [label]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const shouldOpenUpward = spaceBelow < 220 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(180, Math.min(280, shouldOpenUpward ? spaceAbove : spaceBelow));
      const width = Math.min(rect.width, viewportWidth - rect.left - 12);

      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width,
        zIndex: 1200,
        maxHeight,
        top: shouldOpenUpward ? undefined : rect.bottom + 6,
        bottom: shouldOpenUpward ? viewportHeight - rect.top + 6 : undefined,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const toggleValue = (option: string) => {
    if (values.includes(option)) {
      onChange(values.filter((value) => value !== option));
      return;
    }

    onChange([...values, option]);
  };

  const summary = values.length === 0 ? 'Select options' : values.length <= 2 ? values.join(', ') : `${values.slice(0, 2).join(', ')} +${values.length - 2}`;

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <label htmlFor={fieldId} className="form-label">{label}</label>
      <button
        ref={triggerRef}
        id={fieldId}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-9 w-full items-center justify-between rounded-lg border border-[#dde1e6] bg-white px-3 text-left text-sm text-secondary-950 outline-none transition focus:border-primary-500 dark:border-white/10 dark:bg-[#08101d] dark:text-white"
      >
        <span className={`truncate ${values.length === 0 ? 'text-secondary-500 dark:text-secondary-400' : ''}`}>{summary}</span>
        <span className="ml-3 text-xs text-secondary-500 dark:text-secondary-400">{isOpen ? 'Hide' : 'Select'}</span>
      </button>

      {isOpen && menuStyle
        ? createPortal(
            <div
              ref={dropdownRef}
              role="listbox"
              aria-label={label}
              style={menuStyle}
              className="rounded-xl border border-[#dde1e6] bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-[#08101d]"
            >
              <div className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight: menuStyle.maxHeight }}>
                {options.map((option) => {
                  const selected = values.includes(option);
                  return (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-secondary-800 hover:bg-[#f8f9fb] dark:text-secondary-100 dark:hover:bg-white/[0.05]"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleValue(option)}
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
