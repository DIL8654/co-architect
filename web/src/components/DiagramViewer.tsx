import React from 'react';

interface DiagramViewerProps {
  imageUrl: string;
  fileName?: string;
  title: string;
}

export const DiagramViewer = React.forwardRef<HTMLDivElement, DiagramViewerProps>(
  ({ imageUrl, fileName, title }, ref) => {
    const isSvg = (fileName ?? imageUrl.split('?')[0]).toLowerCase().endsWith('.svg');

    return (
      <div ref={ref} className="w-full bg-secondary-50 rounded-lg border border-secondary-200 overflow-hidden">
        <div className="bg-secondary-100 px-4 py-3 border-b border-secondary-200">
          <h3 className="font-semibold text-secondary-900">{title}</h3>
        </div>
        <div className="p-4 flex items-center justify-center min-h-96 max-h-96 overflow-auto">
          {!imageUrl ? (
            <div className="rounded-lg border border-dashed border-secondary-300 bg-white p-8 text-center">
              <p className="font-medium text-secondary-900">Text architecture description</p>
              <p className="mt-2 text-sm text-secondary-600">No image was uploaded for this diagram.</p>
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
