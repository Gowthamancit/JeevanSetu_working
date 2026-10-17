export default function StatusBadge({ status, className = '' }) {
  const styles = {
    Open: 'bg-info/10 text-info border border-info/20',
    'Donor Found': 'bg-purple-muted text-purple-accent border border-purple-accent/20',
    Fulfilled: 'bg-brand-muted text-brand-primary border border-brand-primary/20',
    Cancelled: 'bg-bg-secondary text-text-muted border border-border-subtle',
  };

  const badgeStyle = styles[status] || 'bg-bg-elevated text-text-secondary border border-border-main';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${badgeStyle} ${className}`}>
      {status}
    </span>
  );
}
