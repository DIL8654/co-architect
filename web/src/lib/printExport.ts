function buildPrintDocument(title: string, bodyHtml: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; color: #111827; background: #ffffff; }
      main { max-width: 900px; margin: 0 auto; padding: 32px 28px 48px; }
      h1, h2, h3 { margin: 0 0 12px; }
      h1 { font-size: 28px; }
      h2 { font-size: 18px; margin-top: 28px; }
      p, li, td, th, span, div { font-size: 14px; line-height: 1.6; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #d1d5db; padding: 10px 12px; text-align: left; vertical-align: top; }
      th { background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #4b5563; }
      .print-chip { display: inline-block; margin-right: 8px; margin-bottom: 8px; padding: 4px 10px; border-radius: 999px; background: #eef2ff; color: #312e81; font-size: 12px; font-weight: 600; }
      .print-card { border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; margin-top: 18px; }
      .print-meta { color: #4b5563; margin-top: 6px; }
      .print-image { width: 100%; max-height: 520px; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 12px; background: #f8fafc; }
      ul { padding-left: 20px; }
      @media print {
        body { background: #ffffff; }
        main { padding: 18px; }
      }
    </style>
  </head>
  <body>
    <main>${bodyHtml}</main>
    <script>
      window.addEventListener('load', () => {
        setTimeout(() => window.print(), 150);
      });
    </script>
  </body>
</html>`;
}

export function openPrintWindow(title: string, bodyHtml: string) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) {
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(buildPrintDocument(title, bodyHtml));
  printWindow.document.close();
  return true;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
