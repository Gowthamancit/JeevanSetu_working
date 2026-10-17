import { forwardRef } from 'react';

const Select = forwardRef(({
  label,
  error,
  id,
  options = [],
  placeholder = 'Select an option',
  className = '',
  helperText,
  children,
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-text-secondary">
          {label}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        className={`w-full px-3 py-2 text-sm bg-bg-input border ${
          error ? 'border-error focus:ring-error' : 'border-border-main focus:ring-brand-primary'
        } rounded-lg text-text-primary focus:outline-none focus:ring-1 transition-all ${className}`}
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            <option value="" disabled className="text-text-muted">
              {placeholder}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-bg-card">
                {opt.label}
              </option>
            ))}
          </>
        )}
      </select>
      {error && (
        <p className="text-xs text-error font-medium">{error.message || error}</p>
      )}
      {!error && helperText && (
        <p className="text-xs text-text-muted">{helperText}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
