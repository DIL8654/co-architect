import React from 'react';

export interface TableProps<T extends Record<string, any>> {
  columns: Array<{ header: string; accessor: keyof T; render?: (value: any) => React.ReactNode }>;
  data: T[];
}

export const Table = React.forwardRef<HTMLTableElement, TableProps<any>>(
  ({ columns, data }, ref) => {
    return (
      <div className="overflow-x-auto rounded-xl border border-[#dde1e6] bg-white dark:border-white/10 dark:bg-[#08101d]">
        <table ref={ref} className="w-full">
          <thead className="border-b border-[#dde1e6] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
            <tr>
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-[#eef1f4] transition last:border-0 hover:bg-[#f8f9fb] dark:border-white/10 dark:hover:bg-white/[0.03]">
                {columns.map((column, colIdx) => (
                  <td key={colIdx} className="px-4 py-4 text-sm text-secondary-700 dark:text-secondary-200">
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
