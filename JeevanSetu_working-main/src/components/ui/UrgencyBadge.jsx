export default function UrgencyBadge({ level, className = '' }) {
  const styles = {
    Emergency: 'bg-error/10 text-error border border-error/20',
    Urgent: 'bg-warning/10 text-warning border border-warning/20',
    Routine: 'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20',
  };

  const badgeStyle = styles[level] || 'bg-bg-elevated text-text-secondary border border-border-main';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${badgeStyle} ${className}`}>
      {level}
    </span>
  );
}
