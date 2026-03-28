'use client';

import React, { useRef, KeyboardEvent, useEffect } from 'react';

interface OtpInputProps {
    value: string;
    onChange: (value: string) => void;
    length?: number;
    onComplete?: (completedValue: string) => void;
    disabled?: boolean;
}

export default function OtpInput({ value, onChange, length = 6, onComplete, disabled = false }: OtpInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Auto-focus first input strictly if value is empty and it's not disabled
        if (value.length === 0 && !disabled && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [disabled, value.length]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value;
        if (!/^[0-9]*$/.test(val)) return; // Only allow numbers

        const newValue = value.split('');
        
        // Find the last typed character in the box
        const char = val.slice(-1);
        
        if (char) {
            newValue[index] = char;
            const combined = newValue.join('').slice(0, length);
            onChange(combined);

            // Move to next input intelligently
            if (index < length - 1) {
                inputRefs.current[index + 1]?.focus();
            } else if (combined.length === length && onComplete) {
                onComplete(combined);
            }
        } else {
            // Handle clearing a box
            newValue[index] = '';
            onChange(newValue.join(''));
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            if (!value[index] && index > 0) {
                // If it's empty, move back and clear the previous one implicitly by focusing
                inputRefs.current[index - 1]?.focus();
            } else if (value[index]) {
                // If there's a character, let it delete it normally via onChange
            }
        }
        
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        
        if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (value.length === length && onComplete) {
                onComplete(value);
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        if (pastedData) {
            onChange(pastedData);
            // Move focus to the first empty spot or the last box
            const focusIndex = Math.min(pastedData.length, length - 1);
            inputRefs.current[focusIndex]?.focus();
            if (pastedData.length === length && onComplete) {
                onComplete(pastedData);
            }
        }
    };

    return (
        <div className="flex gap-2 sm:gap-2.5 justify-center mt-2">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={2} 
                    value={value[index] || ''}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold bg-white border border-slate-200 rounded-lg text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50 dark:bg-slate-800/80 dark:border-slate-700/80 dark:text-white dark:focus:bg-slate-900"
                />
            ))}
        </div>
    );
}
