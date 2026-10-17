export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinnerSize = sizes[size] || sizes.md;

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`${spinnerSize} rounded-full animate-spin border-t-brand-primary border-r-transparent border-b-transparent border-l-transparent border-white/10`}
      />
    </div>
  );
}
