import React from 'react';

export interface TableProps<T extends Record<string, any>> {
  columns: Array<{ header: string; accessor: keyof T; render?: (value: any) => React.ReactNode }>;
  data: T[];
}

export const Table = React.forwardRef<HTMLTableElement, TableProps<any>>(
  ({ columns, data }, ref) => {
    return (
      <div className="overflow-x-auto rounded-2xl border border-secondary-200 bg-white/80 dark:border-white/10 dark:bg-white/5">
        <table ref={ref} className="w-full">
          <thead className="border-b border-secondary-200 bg-secondary-50/90 dark:border-white/10 dark:bg-white/[0.04]">
            <tr>
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-secondary-500 dark:text-secondary-400"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-secondary-200 transition last:border-0 hover:bg-secondary-50/80 dark:border-white/10 dark:hover:bg-white/[0.04]">
                {columns.map((column, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 text-sm text-secondary-700 dark:text-secondary-200">
                    {column.render ? column.render(row[column.accessor]) : String(row[column.accessor])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

Table.displayName = 'Table';
