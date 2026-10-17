import { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = ''
}) {
  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-bg-primary/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog Container */}
      <div className={`relative bg-bg-card border border-border-subtle rounded-xl shadow-2xl w-full ${sizeClass} overflow-hidden transform transition-all z-10 flex flex-col max-h-[90vh] ${className}`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between shrink-0 bg-bg-secondary/20">
          <h3 className="text-base font-bold text-text-primary">
            {title}
          </h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose} 
            className="p-1 rounded-full border-none hover:bg-bg-elevated"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-4 border-t border-border-subtle bg-bg-secondary/40 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
