export default function StatCard({ title, value, icon, trend, className = '' }) {
  return (
    <div className={`bg-bg-card border border-border-main p-5 rounded-lg shadow-md hover:border-border-subtle transition-colors flex flex-col justify-between ${className}`}>
      <div className="flex justify-between items-start gap-4">
        <div>
          <span className="text-text-secondary text-xs font-semibold uppercase tracking-wider block">
            {title}
          </span>
          <span className="text-text-primary text-2xl font-bold mt-1 block tracking-tight">
            {value}
          </span>
        </div>
        {icon && (
          <div className="text-text-muted p-2 bg-bg-elevated rounded border border-border-subtle">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 text-[11px] text-text-muted font-medium flex items-center gap-1">
          {trend}
        </div>
      )}
    </div>
  );
}
