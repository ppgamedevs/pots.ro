import React, { useEffect, useRef } from 'react';

// Accessibility Helpers pentru Pots.ro

export function VisuallyHidden({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0',
        ...props.style,
      }}
    >
      {children}
    </span>
  );
}

// Hook pentru aria-live regions
export function useAriaLive() {
  const liveRegionRef = useRef<HTMLDivElement>(null);
  
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);
    }
  };
  
  return { announce, liveRegionRef };
}

// Component pentru aria-live region global
export function AriaLiveRegion() {
  const { liveRegionRef } = useAriaLive();
  
  return (
    <div
      ref={liveRegionRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      style={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    />
  );
}

// Helper pentru focus management
export function focusElement(element: HTMLElement | null) {
  if (element) {
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Hook pentru keyboard navigation
export function useKeyboardNavigation() {
  const handleKeyDown = (event: React.KeyboardEvent, onEnter?: () => void, onEscape?: () => void) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        onEnter?.();
        break;
      case 'Escape':
        event.preventDefault();
        onEscape?.();
        break;
    }
  };
  
  return { handleKeyDown };
}

// Helper pentru skip links
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
      onClick={(e) => {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          focusElement(target as HTMLElement);
        }
      }}
    >
      {children}
    </a>
  );
}

// Helper pentru form labels
export function FormLabel({ 
  htmlFor, 
  required = false, 
  children, 
  ...props 
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-1" aria-label="câmp obligatoriu">
          *
        </span>
      )}
    </label>
  );
}

// Helper pentru error messages
export function ErrorMessage({ 
  id, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { id: string }) {
  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className="text-sm text-red-600 dark:text-red-400 mt-1"
      {...props}
    >
      {children}
    </div>
  );
}

// Helper pentru loading states
export function LoadingSpinner({ 
  size = 'md', 
  className = '',
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };
  
  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Se încarcă..."
      {...props}
    />
  );
}

// Helper pentru table accessibility
export function AccessibleTable({ 
  caption, 
  children, 
  ...props 
}: React.TableHTMLAttributes<HTMLTableElement> & { caption: string }) {
  return (
    <div className="overflow-x-auto">
      <table
        className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
        {...props}
      >
        <caption className="sr-only">
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}

// Helper pentru button accessibility
export function AccessibleButton({
  children,
  loading = false,
  disabled = false,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      disabled={disabled || loading}
      className={`focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          Se încarcă...
        </>
      ) : (
        children
      )}
    </button>
  );
}

// i18n Preparation (dezactivat la runtime)
// Toate stringurile rămân hardcodate în română pentru MVP

// Comentez aceste funcții pentru că i18n nu este activat încă
/*
export function t(key: string, params?: Record<string, any>): string {
  // TODO: Implementare i18n când va fi activată
  return key;
}

export function useTranslation() {
  return {
    t: (key: string, params?: Record<string, any>) => key,
    locale: 'ro',
    locales: ['ro'],
  };
}
*/

// Helper pentru detectarea limbii browser-ului (pentru viitor)
export function getBrowserLocale(): string {
  if (typeof window === 'undefined') return 'ro';
  
  const locale = navigator.language || navigator.languages?.[0] || 'ro';
  return locale.startsWith('ro') ? 'ro' : 'ro'; // Default la română pentru MVP
}

// Helper pentru formatarea datelor locale
export function formatDate(date: string | Date, locale: string = 'ro-RO'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export function formatCurrency(amount: number, currency: string = 'RON', locale: string = 'ro-RO'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount / 100);
}

export function formatNumber(number: number, locale: string = 'ro-RO'): string {
  return new Intl.NumberFormat(locale).format(number);
}