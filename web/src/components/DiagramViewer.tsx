import React from 'react';
import { DiagramIcon } from './Icons';

interface DiagramViewerProps {
  imageUrl: string;
  fileName?: string;
  title: string;
}

export const DiagramViewer = React.forwardRef<HTMLDivElement, DiagramViewerProps>(
  ({ imageUrl, fileName, title }, ref) => {
    const isSvg = (fileName ?? imageUrl.split('?')[0]).toLowerCase().endsWith('.svg');

    return (
      <div ref={ref} className="w-full overflow-hidden rounded-2xl border border-secondary-200 bg-white/[0.88] shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <div className="border-b border-secondary-200 bg-secondary-50/90 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
          <h3 className="font-semibold text-secondary-950 dark:text-white">{title}</h3>
        </div>
        <div className="flex max-h-96 min-h-96 items-center justify-center overflow-auto p-4">
          {!imageUrl ? (
            <div className="rounded-2xl border border-dashed border-secondary-300 bg-secondary-50/70 p-8 text-center dark:border-white/10 dark:bg-white/[0.03]">
              <span className="glow-icon mx-auto mb-4">
                <DiagramIcon className="h-5 w-5" />
              </span>
              <p className="font-semibold text-secondary-950 dark:text-white">Text architecture description</p>
              <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-300">No image was uploaded for this diagram.</p>
            </div>
          ) : isSvg ? (
            <object data={imageUrl} type="image/svg+xml" className="max-w-full max-h-full" />
          ) : (
            <img src={imageUrl} alt={title} className="max-w-full max-h-full object-contain" />
          )}
        </div>
      </div>
    );
  }
);

DiagramViewer.displayName = 'DiagramViewer';
