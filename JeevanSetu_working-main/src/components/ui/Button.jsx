import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-brand-primary text-bg-primary hover:bg-brand-accent focus:ring-brand-primary',
    secondary: 'bg-bg-elevated text-text-primary hover:bg-bg-input border border-border-main focus:ring-border-main',
    patient: 'bg-purple-accent text-white hover:bg-purple-light focus:ring-purple-accent',
    danger: 'bg-error text-white hover:bg-red-600 focus:ring-error',
    outline: 'border border-border-main bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated focus:ring-border-main',
    text: 'bg-transparent text-text-secondary hover:text-text-primary py-0 px-0'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
}
