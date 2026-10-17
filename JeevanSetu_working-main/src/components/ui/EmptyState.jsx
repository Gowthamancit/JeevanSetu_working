import Button from './Button';

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-border-subtle bg-bg-card/30 rounded-lg max-w-md mx-auto ${className}`}>
      {icon && (
        <div className="text-text-muted mb-4 p-4 bg-bg-secondary rounded-full border border-border-subtle">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-text-primary mb-1">
        {title}
      </h3>
      <p className="text-xs text-text-muted mb-6 max-w-xs leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
