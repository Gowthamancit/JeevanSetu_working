import LoadingSpinner from './LoadingSpinner';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data available',
  className = '',
}) {
  return (
    <div className={`w-full overflow-hidden border border-border-subtle rounded-lg bg-bg-card ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#161616] border-b border-border-subtle">
              {columns.map((col, idx) => (
                <th
                  key={col.header || idx}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary select-none"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <LoadingSpinner size="md" />
                    <span className="text-xs text-text-muted">Loading records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className="hover:bg-[#1f1f1f] transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className="px-4 py-3.5 text-xs text-text-primary align-middle font-medium"
                    >
                      {col.render
                        ? col.render(row)
                        : col.accessor && typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : row[col.accessor] !== undefined && row[col.accessor] !== null
                        ? String(row[col.accessor])
                        : '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
