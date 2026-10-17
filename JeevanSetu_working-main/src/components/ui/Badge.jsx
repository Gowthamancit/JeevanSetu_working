export default function Badge({
  children,
  variant = 'info',
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0';

  const variants = {
    // Brand Green
    success: 'bg-brand-muted text-brand-primary border border-brand-primary/20',
    // Patient Purple
    patient: 'bg-purple-muted text-purple-accent border border-purple-accent/20',
    // Urgent / Deferred Red
    error: 'bg-error/10 text-error border border-error/20',
    // Warning / Pending Yellow
    warning: 'bg-warning/10 text-warning border border-warning/20',
    // Neutral Info
    info: 'bg-bg-elevated text-text-secondary border border-border-main',
    // Inactive Gray
    muted: 'bg-bg-secondary text-text-muted border border-border-subtle'
  };

  const variantClass = variants[variant] || variants.info;

  return (
    <span className={`${baseStyles} ${variantClass} ${className}`} {...props}>
      {children}
    </span>
  );
}
