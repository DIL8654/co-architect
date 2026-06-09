import React from 'react';

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
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 z-50">
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
          <h2 className="text-lg font-semibold text-secondary-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600 text-xl"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-secondary-200 bg-secondary-50">{footer}</div>}
      </div>
    </div>
  );
};

Modal.displayName = 'Modal';
