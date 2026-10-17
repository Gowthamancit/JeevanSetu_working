export default function PageHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-subtle pb-5 mb-6 ${className}`}>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center">{action}</div>}
    </div>
  );
}
