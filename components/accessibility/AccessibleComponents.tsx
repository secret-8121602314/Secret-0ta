import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { 
  focusManagement, 
  aria, 
  keyboard, 
  screenReader, 
  animation,
  touchTarget 
} from '../../utils/accessibility';

// ===== ACCESSIBLE BUTTON =====

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  className?: string;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  className,
  disabled,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      touchTarget.ensureMinimumSize(buttonRef.current);
    }
  }, []);

  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#E53A3A] to-[#FFAB40] text-white hover:from-[#dc2626] hover:to-[#f59e0b] focus:ring-[#FFAB40]/50',
    secondary: 'bg-[#2E2E2E] border border-[#424242] text-[#CFCFCF] hover:bg-[#424242] hover:text-[#F5F5F5] focus:ring-[#FFAB40]/50',
    outline: 'bg-transparent border-2 border-[#424242] text-[#CFCFCF] hover:bg-[#2E2E2E] hover:text-[#F5F5F5] focus:ring-[#FFAB40]/50',
    ghost: 'bg-transparent text-[#A3A3A3] hover:bg-[#2E2E2E]/50 hover:text-[#F5F5F5] focus:ring-[#FFAB40]/50',
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-6 text-lg',
  };

  return (
    <button
      ref={buttonRef}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-current" />
      )}
      <span className={loading ? 'sr-only' : undefined}>
        {loading ? (loadingText || 'Loading...') : children}
      </span>
      {loading && (
        <span className="sr-only">
          {loadingText || 'Loading, please wait'}
        </span>
      )}
    </button>
  );
};

// ===== ACCESSIBLE INPUT =====

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  helperText,
  required = false,
  className,
  id,
  ...props
}) => {
  const inputId = id || aria.generateId('input');
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ');

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-[#CFCFCF]"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      <input
        id={inputId}
        className={cn(
          'w-full px-4 py-3 bg-[#1C1C1C] border border-[#424242] text-[#F5F5F5] rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-[#FFAB40]/50 focus:border-[#FFAB40]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
          className
        )}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        aria-required={required}
        {...props}
      />
      
      {error && (
        <p id={errorId} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p id={helperId} className="text-sm text-[#A3A3A3]">
          {helperText}
        </p>
      )}
    </div>
  );
};

// ===== ACCESSIBLE MODAL =====

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      
      // Focus the modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = 'unset';
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const cleanup = focusManagement.trapFocus(modalRef.current);
    return cleanup;
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      keyboard.handleEscape(e, onClose);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={cn(
          'relative w-full max-w-2xl bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] rounded-2xl border border-[#424242]/40 shadow-2xl',
          className
        )}
        tabIndex={-1}
      >
        <div className="p-6">
          <h2 id="modal-title" className="text-2xl font-bold text-[#F5F5F5] mb-4">
            {title}
          </h2>
          {children}
        </div>
      </div>
    </div>
  );
};

// ===== ACCESSIBLE TOGGLE =====

interface AccessibleToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

const AccessibleToggle: React.FC<AccessibleToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className
}) => {
  const toggleId = aria.generateId('toggle');
  const descriptionId = description ? `${toggleId}-description` : undefined;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${toggleId}-label`}
        aria-describedby={descriptionId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFAB40]/50 focus:ring-offset-2 focus:ring-offset-transparent',
          checked ? 'bg-[#E53A3A]' : 'bg-[#424242]',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
      
      <div className="flex-1">
        <label
          id={`${toggleId}-label`}
          htmlFor={toggleId}
          className="text-sm font-medium text-[#F5F5F5] cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <p id={descriptionId} className="text-sm text-[#A3A3A3]">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

// ===== ACCESSIBLE LISTBOX =====

interface AccessibleListboxProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
}

const AccessibleListbox: React.FC<AccessibleListboxProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select an option',
  className
}) => {
  const listboxId = aria.generateId('listbox');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const listboxRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    if (isOpen && listboxRef.current) {
      const cleanup = focusManagement.trapFocus(listboxRef.current);
      return cleanup;
    }
    return undefined;
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === keyboard.keys.ENTER || e.key === keyboard.keys.SPACE) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const newIndex = keyboard.handleArrowNavigation(
      e.nativeEvent,
      options.map((_, index) => listboxRef.current?.children[index] as HTMLElement),
      focusedIndex,
      'vertical'
    );

    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex);
    }

    if (e.key === keyboard.keys.ENTER) {
      e.preventDefault();
      if (focusedIndex >= 0 && !options[focusedIndex].disabled) {
        onChange(options[focusedIndex].value);
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (e.key === keyboard.keys.ESCAPE) {
      e.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div className={cn('relative', className)}>
      <label className="block text-sm font-medium text-[#CFCFCF] mb-2">
        {label}
      </label>
      
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${listboxId}-label`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="w-full px-4 py-3 bg-[#1C1C1C] border border-[#424242] text-[#F5F5F5] rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-[#FFAB40]/50 focus:border-[#FFAB40]"
      >
        {selectedOption ? selectedOption.label : placeholder}
      </button>
      
      {isOpen && (
        <div
          ref={listboxRef}
          role="listbox"
          aria-labelledby={`${listboxId}-label`}
          className="absolute z-10 w-full mt-1 bg-[#1C1C1C] border border-[#424242] rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled}
              className={cn(
                'px-4 py-3 cursor-pointer transition-colors',
                option.value === value && 'bg-[#E53A3A]/20 text-[#FFAB40]',
                index === focusedIndex && 'bg-[#424242]',
                option.disabled && 'opacity-50 cursor-not-allowed',
                !option.disabled && 'hover:bg-[#424242]'
              )}
              onClick={() => {
                if (!option.disabled) {
                  onChange(option.value);
                  setIsOpen(false);
                  buttonRef.current?.focus();
                }
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ===== ACCESSIBLE SKIP LINK =====

interface AccessibleSkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const AccessibleSkipLink: React.FC<AccessibleSkipLinkProps> = ({
  href,
  children,
  className
}) => {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50',
        'px-4 py-2 bg-[#E53A3A] text-white rounded-lg font-medium',
        'focus:outline-none focus:ring-2 focus:ring-[#FFAB40]/50 focus:ring-offset-2',
        className
      )}
    >
      {children}
    </a>
  );
};

export {
  AccessibleButton,
  AccessibleInput,
  AccessibleModal,
  AccessibleToggle,
  AccessibleListbox,
  AccessibleSkipLink
};
