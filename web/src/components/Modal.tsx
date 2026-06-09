import React from 'react';
import { CloseIcon } from './Icons';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-secondary-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 mx-4 w-full max-w-md rounded-2xl border border-secondary-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0B1220]">
        <div className="flex items-center justify-between border-b border-secondary-200 px-6 py-4 dark:border-white/10">
          <h2 className="text-lg font-semibold text-secondary-950 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-secondary-400 transition hover:bg-secondary-100 hover:text-secondary-700 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4 text-secondary-700 dark:text-secondary-200">{children}</div>
        {footer && <div className="border-t border-secondary-200 bg-secondary-50 px-6 py-4 dark:border-white/10 dark:bg-white/[0.03]">{footer}</div>}
      </div>
    </div>
  );
};

Modal.displayName = 'Modal';
