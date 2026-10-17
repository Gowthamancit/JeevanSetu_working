import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  type = 'text',
  id,
  className = '',
  helperText,
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-text-secondary">
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        ref={ref}
        className={`w-full px-3 py-2 text-sm bg-bg-input border ${
          error ? 'border-error focus:ring-error' : 'border-border-main focus:ring-brand-primary'
        } rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 transition-all ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-error font-medium">{error.message || error}</p>
      )}
      {!error && helperText && (
        <p className="text-xs text-text-muted">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
