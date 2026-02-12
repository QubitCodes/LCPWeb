'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Info,
    XCircle,
    X,
    Loader2
} from 'lucide-react';

/**
 * Alert variant types — determines color scheme and icon.
 */
type AlertVariant = 'success' | 'danger' | 'warning' | 'info';

/**
 * Button configuration for the alert dialog.
 */
interface AlertButton {
    /** Button label text */
    label: string;
    /** Button variant — determines styling */
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    /** Value returned when this button is clicked */
    value?: any;
    /** Whether the button should close the dialog (default: true) */
    closesDialog?: boolean;
}

/**
 * Input field configuration for the alert dialog.
 */
interface AlertInput {
    /** Placeholder text */
    placeholder?: string;
    /** Default value */
    defaultValue?: string;
    /** Input type */
    type?: 'text' | 'textarea' | 'password' | 'email';
    /** Whether input is required to submit */
    required?: boolean;
    /** Label text above the input */
    label?: string;
}

/**
 * Configuration options for showing an alert.
 */
interface AlertOptions {
    /** Alert title */
    title: string;
    /** Alert message / description */
    message?: string;
    /** Visual variant (default: 'info') */
    variant?: AlertVariant;
    /** Custom buttons (overrides default OK button) */
    buttons?: AlertButton[];
    /** Optional input field */
    input?: AlertInput;
    /** Whether clicking backdrop closes the dialog (default: true) */
    dismissible?: boolean;
}

/**
 * Internal state for an active alert.
 */
interface AlertState extends AlertOptions {
    /** Resolver for the promise */
    resolve: (result: AlertResult) => void;
}

/**
 * Result returned when an alert is dismissed.
 */
interface AlertResult {
    /** The value of the button clicked, or undefined if dismissed */
    value?: any;
    /** The input value if an input was shown */
    inputValue?: string;
    /** Whether the alert was dismissed (backdrop click / X button) */
    dismissed: boolean;
}

/**
 * Context shape for the alert system.
 */
interface AlertContextType {
    /** Show an alert and wait for user response */
    showAlert: (options: AlertOptions) => Promise<AlertResult>;
    /** Convenience: show a confirmation dialog */
    confirm: (title: string, message?: string, variant?: AlertVariant) => Promise<boolean>;
    /** Convenience: show a success notification alert */
    success: (title: string, message?: string) => Promise<void>;
    /** Convenience: show an error notification alert */
    error: (title: string, message?: string) => Promise<void>;
    /** Convenience: show a prompt with input */
    prompt: (title: string, message?: string, placeholder?: string) => Promise<string | null>;
}

const AlertContext = createContext<AlertContextType | null>(null);

/**
 * Hook to use the alert dialog system.
 * Must be used within an AlertProvider.
 */
export function useAlert(): AlertContextType {
    const ctx = useContext(AlertContext);
    if (!ctx) throw new Error('useAlert must be used within an AlertProvider');
    return ctx;
}

/**
 * Variant configuration — icon, colors.
 */
const VARIANT_CONFIG: Record<AlertVariant, {
    icon: typeof AlertTriangle;
    iconBg: string;
    iconColor: string;
    buttonColor: string;
}> = {
    success: {
        icon: CheckCircle2,
        iconBg: 'bg-green-100 dark:bg-green-500/10',
        iconColor: 'text-green-600 dark:text-green-400',
        buttonColor: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    },
    danger: {
        icon: XCircle,
        iconBg: 'bg-red-100 dark:bg-red-500/10',
        iconColor: 'text-red-600 dark:text-red-400',
        buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    warning: {
        icon: AlertTriangle,
        iconBg: 'bg-amber-100 dark:bg-amber-500/10',
        iconColor: 'text-amber-600 dark:text-amber-400',
        buttonColor: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
    },
    info: {
        icon: Info,
        iconBg: 'bg-blue-100 dark:bg-blue-500/10',
        iconColor: 'text-blue-600 dark:text-blue-400',
        buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
};

/**
 * Button variant styling map.
 */
const BUTTON_STYLES: Record<string, string> = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-slate-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 focus:ring-slate-400'
};

/**
 * AlertProvider — wraps the app and provides the alert dialog system.
 * Renders modals at the top level so they overlay everything.
 */
export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [alerts, setAlerts] = useState<AlertState[]>([]);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

    /** Show an alert and return a promise that resolves on user action */
    const showAlert = useCallback((options: AlertOptions): Promise<AlertResult> => {
        return new Promise((resolve) => {
            setAlerts((prev) => [...prev, { ...options, resolve }]);
        });
    }, []);

    /** Convenience: confirm dialog */
    const confirmDialog = useCallback(async (title: string, message?: string, variant: AlertVariant = 'warning'): Promise<boolean> => {
        const result = await showAlert({
            title,
            message,
            variant,
            buttons: [
                { label: 'Cancel', variant: 'secondary', value: false },
                { label: 'Confirm', variant: variant === 'danger' ? 'danger' : 'primary', value: true }
            ]
        });
        return result.value === true;
    }, [showAlert]);

    /** Convenience: success alert */
    const successAlert = useCallback(async (title: string, message?: string): Promise<void> => {
        await showAlert({ title, message, variant: 'success' });
    }, [showAlert]);

    /** Convenience: error alert */
    const errorAlert = useCallback(async (title: string, message?: string): Promise<void> => {
        await showAlert({ title, message, variant: 'danger' });
    }, [showAlert]);

    /** Convenience: prompt with input */
    const promptDialog = useCallback(async (title: string, message?: string, placeholder?: string): Promise<string | null> => {
        const result = await showAlert({
            title,
            message,
            variant: 'info',
            input: { placeholder, type: 'text' },
            buttons: [
                { label: 'Cancel', variant: 'secondary', value: null },
                { label: 'Submit', variant: 'primary', value: 'submit' }
            ]
        });
        if (result.dismissed || result.value === null) return null;
        return result.inputValue || '';
    }, [showAlert]);

    /** Dismiss the top alert */
    const dismissAlert = useCallback((alert: AlertState, result: AlertResult) => {
        alert.resolve(result);
        setAlerts((prev) => prev.filter((a) => a !== alert));
    }, []);

    return (
        <AlertContext.Provider
            value={{
                showAlert,
                confirm: confirmDialog,
                success: successAlert,
                error: errorAlert,
                prompt: promptDialog
            }}
        >
            {children}

            {/* Render active alerts */}
            {alerts.map((alert, index) => (
                <AlertModal
                    key={index}
                    alert={alert}
                    onDismiss={dismissAlert}
                    inputRef={inputRef}
                />
            ))}
        </AlertContext.Provider>
    );
}

/**
 * Individual alert modal component.
 */
function AlertModal({
    alert,
    onDismiss,
    inputRef
}: {
    alert: AlertState;
    onDismiss: (alert: AlertState, result: AlertResult) => void;
    inputRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>;
}) {
    const [inputValue, setInputValue] = useState(alert.input?.defaultValue || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const variant = alert.variant || 'info';
    const config = VARIANT_CONFIG[variant];
    const Icon = config.icon;
    const dismissible = alert.dismissible !== false;

    /** Default buttons if none provided */
    const buttons: AlertButton[] = alert.buttons || [
        { label: 'OK', variant: 'primary', value: true }
    ];

    /** Handle backdrop click */
    const handleBackdrop = () => {
        if (dismissible) {
            onDismiss(alert, { dismissed: true });
        }
    };

    /** Handle button click */
    const handleButton = (btn: AlertButton) => {
        // Check required input
        if (alert.input?.required && !inputValue.trim() && btn.value !== null && btn.value !== false) {
            inputRef.current?.focus();
            return;
        }

        if (btn.closesDialog === false) return;

        onDismiss(alert, {
            value: btn.value,
            inputValue: alert.input ? inputValue : undefined,
            dismissed: false
        });
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={handleBackdrop}
            />

            {/* Dialog */}
            <div
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 fade-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                {dismissible && (
                    <button
                        onClick={() => onDismiss(alert, { dismissed: true })}
                        className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                <div className="p-6">
                    {/* Icon + Title + Message */}
                    <div className="flex gap-4">
                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.iconBg}`}>
                            <Icon className={`w-5 h-5 ${config.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white pr-6">
                                {alert.title}
                            </h3>
                            {alert.message && (
                                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {alert.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Input field */}
                    {alert.input && (
                        <div className="mt-4 ml-14">
                            {alert.input.label && (
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    {alert.input.label}
                                </label>
                            )}
                            {alert.input.type === 'textarea' ? (
                                <textarea
                                    ref={(el) => { inputRef.current = el; }}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={alert.input.placeholder}
                                    rows={3}
                                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder:text-slate-400"
                                    autoFocus
                                />
                            ) : (
                                <input
                                    ref={(el) => { inputRef.current = el; }}
                                    type={alert.input.type || 'text'}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const primary = buttons.find(b => b.variant === 'primary' || b.variant === 'danger');
                                            if (primary) handleButton(primary);
                                        }
                                    }}
                                    placeholder={alert.input.placeholder}
                                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
                                    autoFocus
                                />
                            )}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="mt-6 ml-14 flex justify-end gap-3">
                        {buttons.map((btn, i) => {
                            const style = BUTTON_STYLES[btn.variant || 'primary'];
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleButton(btn)}
                                    disabled={isSubmitting}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 ${style}`}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        btn.label
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
