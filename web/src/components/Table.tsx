import React from 'react';

export interface TableProps<T extends Record<string, any>> {
  columns: Array<{ header: string; accessor: keyof T; render?: (value: any) => React.ReactNode }>;
  data: T[];
}

export const Table = React.forwardRef<HTMLTableElement, TableProps<any>>(
  ({ columns, data }, ref) => {
    return (
      <div className="overflow-x-auto border border-secondary-200 rounded-lg">
        <table ref={ref} className="w-full">
          <thead className="bg-secondary-50 border-b border-secondary-200">
            <tr>
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  className="px-6 py-3 text-left text-sm font-semibold text-secondary-900"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-secondary-200 hover:bg-secondary-50">
                {columns.map((column, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 text-sm text-secondary-700">
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
