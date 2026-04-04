'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, User, Mail, Shield, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { CountryCodeDropdown } from '@/components/ui/CountryCodeDropdown';
import { useFirebaseOtp } from '@/lib/useFirebaseOtp';

// Schema Validation
const workerSchema = z.object({
    first_name: z.string().min(2, 'First name is required'),
    last_name: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    role: z.enum(['WORKER', 'SUPERVISOR']),
    phone_number: z.string().min(6, 'Phone number is required'),
    country_code: z.string()
});

type WorkerFormData = z.infer<typeof workerSchema>;

interface AddWorkerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    companyId: string;
    defaultRole: 'WORKER' | 'SUPERVISOR';
}

export default function AddWorkerDialog({ isOpen, onClose, onSuccess, companyId, defaultRole }: AddWorkerDialogProps) {
    const [serverError, setServerError] = useState('');
    const [step, setStep] = useState<'form' | 'otp'>('form');

    // OTP state
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    
    const firebaseOtp = useFirebaseOtp();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        getValues,
        formState: { errors }
    } = useForm<WorkerFormData>({
        resolver: zodResolver(workerSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            role: defaultRole,
            phone_number: '',
            country_code: '+971'
        }
    });

    const countryCode = watch('country_code');
    const phoneNumber = watch('phone_number');

    // Handle Close & Reset
    const handleClose = () => {
        reset();
        setServerError('');
        setStep('form');
        setOtp(['', '', '', '', '', '']);
        firebaseOtp.reset();
        onClose();
    };

    const handleFormSubmit = async (data: WorkerFormData) => {
        setServerError('');
        try {
            const success = await firebaseOtp.sendOtp(`${data.country_code}${data.phone_number}`);
            if (success) {
                setStep('otp');
            }
        } catch (err: any) {
            setServerError(err.message || 'Failed to send OTP');
        }
    };

    /** Handle OTP input auto-focus */
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    /** Verify OTP and submit to backend */
    const handleVerifyAndSubmit = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setServerError('Please enter the complete 6-digit OTP');
            return;
        }

        setServerError('');

        try {
            const idToken = await firebaseOtp.verifyOtp(otpCode);
            if (!idToken) {
                return; // Hook will set error
            }

            const data = getValues();
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email || undefined,
                    role: data.role,
                    phone: data.phone_number,
                    country_code: data.country_code,
                    company_id: companyId,
                    idToken: idToken // Passed so the backend verifies the number directly
                })
            });
            const result = await res.json();

            if (result.status) {
                reset();
                onSuccess();
                onClose();
                setStep('form');
            } else {
                setServerError(result.message || 'Failed to create worker');
            }
        } catch (error: any) {
            setServerError(error.message || 'An unexpected error occurred');
        }
    };

    if (!isOpen) return null;

    const isLoading = firebaseOtp.sending || firebaseOtp.verifying;
    const displayError = serverError || firebaseOtp.error;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Person</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Add a worker or supervisor to this company</p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div id={firebaseOtp.recaptchaContainerId} style={{ display: 'none' }} />

                {/* Form Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">

                    {displayError && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
                            <span className="font-semibold">Error:</span> {displayError}
                        </div>
                    )}

                    {step === 'form' && (
                        <form id="worker-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            {...register('first_name')}
                                            className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                            placeholder="John"
                                        />
                                    </div>
                                    {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name <span className="text-red-500">*</span></label>
                                    <input
                                        {...register('last_name')}
                                        className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                        placeholder="Doe"
                                    />
                                    {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number <span className="text-red-500">*</span></label>
                                <div className="flex gap-2">
                                    <CountryCodeDropdown 
                                        value={countryCode} 
                                        onChange={(val) => setValue('country_code', val)} 
                                    />
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            {...register('phone_number')}
                                            type="tel"
                                            onChange={(e) => setValue('phone_number', e.target.value.replace(/[^0-9]/g, ''))}
                                            className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                </div>
                                {errors.phone_number && <p className="mt-1 text-xs text-red-500">{errors.phone_number.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        {...register('email')}
                                        type="email"
                                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                        placeholder="john.doe@example.com"
                                    />
                                </div>
                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        {...register('role')}
                                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                    >
                                        <option value="WORKER">Worker</option>
                                        <option value="SUPERVISOR">Supervisor</option>
                                    </select>
                                </div>
                                {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
                            </div>
                        </form>
                    )}

                    {step === 'otp' && (
                        <div className="text-center py-4">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3 text-blue-600 dark:text-blue-400">
                                <ShieldCheck className="h-7 w-7" />
                            </div>
                            <h5 className="text-lg font-bold text-slate-900 dark:text-white">Verify Phone Number</h5>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
                                Enter the 6-digit code sent to {countryCode} {phoneNumber} to verify the worker.
                            </p>

                            <div className="flex justify-center gap-2 sm:gap-3 mb-6">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { otpRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className="w-11 h-12 text-center text-lg font-semibold border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition"
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-between gap-3 sticky bottom-0">
                    {step === 'otp' ? (
                        <button
                            type="button"
                            onClick={() => setStep('form')}
                            className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent"
                        >
                            Back
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent"
                        >
                            Cancel
                        </button>
                    )}
                    
                    {step === 'form' ? (
                        <button
                            type="submit"
                            form="worker-form"
                            disabled={isLoading}
                            className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Verify Phone <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleVerifyAndSubmit}
                            disabled={isLoading || otp.join('').length !== 6}
                            className="px-5 py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Create Profile
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
