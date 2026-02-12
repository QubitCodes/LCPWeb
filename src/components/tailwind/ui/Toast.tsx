'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Info,
    X,
    Loader2
} from 'lucide-react';

/**
 * Toast variant types — determines color scheme and icon.
 */
type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'loading';

/**
 * Toast position options.
 */
type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';

/**
 * Action button for a toast.
 */
interface ToastAction {
    /** Button label */
    label: string;
    /** Click handler */
    onClick: () => void;
}

/**
 * Options for creating a toast notification.
 */
interface ToastOptions {
    /** Toast message */
    message: string;
    /** Optional title / heading */
    title?: string;
    /** Visual variant (default: 'info') */
    variant?: ToastVariant;
    /** Auto-dismiss duration in ms (default: 4000, set 0 to disable) */
    duration?: number;
    /** Whether the toast is dismissible (default: true) */
    dismissible?: boolean;
    /** Optional action button */
    action?: ToastAction;
    /** Custom icon override — pass a React node */
    icon?: React.ReactNode;
    /** Unique ID — used to update/replace existing toasts */
    id?: string;
}

/**
 * Internal toast state (includes generated ID).
 */
interface Toast extends ToastOptions {
    id: string;
    /** Tracks exit animation */
    exiting?: boolean;
    /** Timestamp for progress tracking */
    createdAt: number;
}

/**
 * Context shape for the toast system.
 */
interface ToastContextType {
    /** Show a toast notification */
    toast: (options: ToastOptions) => string;
    /** Convenience: success toast */
    success: (message: string, title?: string) => string;
    /** Convenience: error toast */
    error: (message: string, title?: string) => string;
    /** Convenience: warning toast */
    warning: (message: string, title?: string) => string;
    /** Convenience: info toast */
    info: (message: string, title?: string) => string;
    /** Convenience: loading toast (no auto-dismiss) */
    loading: (message: string, title?: string) => string;
    /** Dismiss a specific toast by ID */
    dismiss: (id: string) => void;
    /** Dismiss all toasts */
    dismissAll: () => void;
    /** Update an existing toast */
    update: (id: string, options: Partial<ToastOptions>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

/**
 * Hook to use the toast notification system.
 * Must be used within a ToastProvider.
 */
export function useToast(): ToastContextType {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
}

/**
 * Variant configuration — icon, colors.
 */
const VARIANT_CONFIG: Record<ToastVariant, {
    icon: React.ReactNode;
    bg: string;
    border: string;
    iconColor: string;
    progressColor: string;
}> = {
    success: {
        icon: <CheckCircle2 className="w-5 h-5" />,
        bg: 'bg-white dark:bg-slate-900',
        border: 'border-green-200 dark:border-green-500/20',
        iconColor: 'text-green-500',
        progressColor: 'bg-green-500'
    },
    error: {
        icon: <XCircle className="w-5 h-5" />,
        bg: 'bg-white dark:bg-slate-900',
        border: 'border-red-200 dark:border-red-500/20',
        iconColor: 'text-red-500',
        progressColor: 'bg-red-500'
    },
    warning: {
        icon: <AlertTriangle className="w-5 h-5" />,
        bg: 'bg-white dark:bg-slate-900',
        border: 'border-amber-200 dark:border-amber-500/20',
        iconColor: 'text-amber-500',
        progressColor: 'bg-amber-500'
    },
    info: {
        icon: <Info className="w-5 h-5" />,
        bg: 'bg-white dark:bg-slate-900',
        border: 'border-blue-200 dark:border-blue-500/20',
        iconColor: 'text-blue-500',
        progressColor: 'bg-blue-500'
    },
    loading: {
        icon: <Loader2 className="w-5 h-5 animate-spin" />,
        bg: 'bg-white dark:bg-slate-900',
        border: 'border-slate-200 dark:border-slate-700',
        iconColor: 'text-blue-500',
        progressColor: 'bg-blue-500'
    }
};

/** Default auto-dismiss duration in ms */
const DEFAULT_DURATION = 4000;

/** Maximum number of visible toasts */
const MAX_TOASTS = 5;

/** Generate a simple unique ID */
let counter = 0;
const genId = () => `toast-${++counter}-${Date.now()}`;

/**
 * ToastProvider — wraps the app and provides toast notification system.
 * @param position - Position of the toast container (default: 'top-right')
 */
export function ToastProvider({
    children,
    position = 'top-right'
}: {
    children: React.ReactNode;
    position?: ToastPosition;
}) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    /** Remove a toast with exit animation */
    const dismiss = useCallback((id: string) => {
        // Trigger exit animation
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
        // Remove after animation
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
            const timer = timersRef.current.get(id);
            if (timer) {
                clearTimeout(timer);
                timersRef.current.delete(id);
            }
        }, 300);
    }, []);

    /** Dismiss all toasts */
    const dismissAll = useCallback(() => {
        setToasts((prev) => prev.map((t) => ({ ...t, exiting: true })));
        setTimeout(() => {
            setToasts([]);
            timersRef.current.forEach((timer) => clearTimeout(timer));
            timersRef.current.clear();
        }, 300);
    }, []);

    /** Show a toast */
    const showToast = useCallback((options: ToastOptions): string => {
        const id = options.id || genId();
        const duration = options.duration ?? (options.variant === 'loading' ? 0 : DEFAULT_DURATION);

        const newToast: Toast = {
            ...options,
            id,
            createdAt: Date.now(),
            exiting: false
        };

        setToasts((prev) => {
            // If ID exists, replace it
            const existing = prev.findIndex((t) => t.id === id);
            if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = newToast;
                return updated;
            }
            // Limit max toasts
            const limited = prev.length >= MAX_TOASTS ? prev.slice(1) : prev;
            return [...limited, newToast];
        });

        // Set auto-dismiss timer
        if (duration > 0) {
            const existing = timersRef.current.get(id);
            if (existing) clearTimeout(existing);

            const timer = setTimeout(() => dismiss(id), duration);
            timersRef.current.set(id, timer);
        }

        return id;
    }, [dismiss]);

    /** Update an existing toast */
    const update = useCallback((id: string, options: Partial<ToastOptions>) => {
        setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, ...options } : t))
        );

        // Reset timer if duration changed or variant changed from loading
        if (options.duration !== undefined || (options.variant && options.variant !== 'loading')) {
            const existing = timersRef.current.get(id);
            if (existing) clearTimeout(existing);

            const duration = options.duration ?? DEFAULT_DURATION;
            if (duration > 0) {
                const timer = setTimeout(() => dismiss(id), duration);
                timersRef.current.set(id, timer);
            }
        }
    }, [dismiss]);

    /** Convenience methods */
    const success = useCallback((message: string, title?: string) =>
        showToast({ message, title, variant: 'success' }), [showToast]);

    const error = useCallback((message: string, title?: string) =>
        showToast({ message, title, variant: 'error', duration: 6000 }), [showToast]);

    const warning = useCallback((message: string, title?: string) =>
        showToast({ message, title, variant: 'warning' }), [showToast]);

    const info = useCallback((message: string, title?: string) =>
        showToast({ message, title, variant: 'info' }), [showToast]);

    const loading = useCallback((message: string, title?: string) =>
        showToast({ message, title, variant: 'loading', duration: 0, dismissible: false }), [showToast]);

    /** Position CSS */
    const positionClass: Record<ToastPosition, string> = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'top-center': 'top-4 left-1/2 -translate-x-1/2',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
    };

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            timersRef.current.forEach((timer) => clearTimeout(timer));
        };
    }, []);

    return (
        <ToastContext.Provider
            value={{ toast: showToast, success, error, warning, info, loading, dismiss, dismissAll, update }}
        >
            {children}

            {/* Toast Container */}
            {toasts.length > 0 && (
                <div
                    className={`fixed z-[9998] flex flex-col gap-2 w-full max-w-sm pointer-events-none ${positionClass[position]}`}
                    aria-live="polite"
                    aria-relevant="additions removals"
                >
                    {toasts.map((t) => (
                        <ToastItem
                            key={t.id}
                            toast={t}
                            onDismiss={dismiss}
                            position={position}
                        />
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
}

/**
 * Individual toast item component.
 */
function ToastItem({
    toast,
    onDismiss,
    position
}: {
    toast: Toast;
    onDismiss: (id: string) => void;
    position: ToastPosition;
}) {
    const variant = toast.variant || 'info';
    const config = VARIANT_CONFIG[variant];
    const dismissible = toast.dismissible !== false;

    /** Determine animation direction */
    const isRight = position.includes('right');
    const enterAnim = isRight ? 'translate-x-0' : 'translate-x-0';
    const exitAnim = isRight ? 'translate-x-[120%]' : 'translate-x-[-120%]';

    return (
        <div
            className={`pointer-events-auto w-full rounded-xl border shadow-lg ${config.bg} ${config.border} 
				transition-all duration-300 ease-out
				${toast.exiting ? `opacity-0 ${exitAnim} scale-95` : `opacity-100 ${enterAnim} scale-100`}
			`}
            role="alert"
        >
            <div className="flex items-start gap-3 p-4">
                {/* Icon */}
                <div className={`shrink-0 mt-0.5 ${config.iconColor}`}>
                    {toast.icon || config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {toast.title && (
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{toast.title}</p>
                    )}
                    <p className={`text-sm text-slate-600 dark:text-slate-400 ${toast.title ? 'mt-0.5' : ''}`}>
                        {toast.message}
                    </p>

                    {/* Action button */}
                    {toast.action && (
                        <button
                            onClick={toast.action.onClick}
                            className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>

                {/* Dismiss */}
                {dismissible && (
                    <button
                        onClick={() => onDismiss(toast.id)}
                        className="shrink-0 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Progress bar for auto-dismiss */}
            {toast.duration !== 0 && variant !== 'loading' && (
                <div className="h-0.5 w-full bg-slate-100 dark:bg-slate-800 rounded-b-xl overflow-hidden">
                    <div
                        className={`h-full ${config.progressColor} rounded-b-xl`}
                        style={{
                            animation: `toast-progress ${toast.duration || DEFAULT_DURATION}ms linear forwards`
                        }}
                    />
                </div>
            )}

            {/* Inject keyframes */}
            <style jsx>{`
				@keyframes toast-progress {
					from { width: 100%; }
					to { width: 0%; }
				}
			`}</style>
        </div>
    );
}
