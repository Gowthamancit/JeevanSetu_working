export default function BloodGroupBadge({ bloodGroup, className = '' }) {
  const colors = {
    'A+': 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20',
    'A-': 'bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20',
    'B+': 'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20',
    'B-': 'bg-[#60a5fa]/10 text-[#60a5fa] border border-[#60a5fa]/20',
    'O+': 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20',
    'O-': 'bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/20',
    'AB+': 'bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20',
    'AB-': 'bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20',
  };

  const badgeStyle = colors[bloodGroup] || 'bg-bg-elevated text-text-secondary border border-border-main';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${badgeStyle} ${className}`}>
      {bloodGroup}
    </span>
  );
}
