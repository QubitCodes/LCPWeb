'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building2,
    User,
    ShieldCheck,
    ArrowRight,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    Info
} from 'lucide-react';

/**
 * Step definitions for the registration stepper.
 */
const STEPS = [
    { label: 'Company', icon: Building2 },
    { label: 'Supervisor', icon: User },
    { label: 'Verification', icon: ShieldCheck }
];

/**
 * Industry dropdown option.
 */
interface IndustryOption {
    id: string;
    name: string;
}

/**
 * Company Registration Page — multi-step form with LCP branding.
 * Route: /tailwind/company/register
 */
export default function RegisterPage() {
    const router = useRouter();
    const [activeStep, setActiveStep] = useState(0);
    const [industries, setIndustries] = useState<IndustryOption[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [companyId, setCompanyId] = useState('');

    const [formData, setFormData] = useState({
        company_name: '',
        industry_id: '',
        address: '',
        website: '',
        supervisor_first_name: '',
        supervisor_last_name: '',
        supervisor_email: '',
        supervisor_phone: '',
        supervisor_password: '',
        confirm_password: '',
        tax_id: ''
    });

    /** Fetch industries for dropdown */
    useEffect(() => {
        const fetchIndustries = async () => {
            try {
                const res = await fetch('/api/v1/industries');
                const data = await res.json();
                if (data.status) setIndustries(data.data);
            } catch (err) {
                console.error('Failed to fetch industries');
            }
        };
        fetchIndustries();
    }, []);

    /** Generic form change handler */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    /** Handle stepper navigation */
    const handleNext = () => {
        if (activeStep === STEPS.length - 1) {
            handleRegister();
        } else {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    /** Submit registration */
    const handleRegister = async () => {
        if (formData.supervisor_password !== formData.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/v1/auth/register-company', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.status) {
                setSuccess(true);
                setCompanyId(data.data.companyId);
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch {
            setError('Network error occurred.');
        } finally {
            setLoading(false);
        }
    };

    /** Success Screen */
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Application Submitted!</h1>
                    <p className="text-sm text-white/60 mb-6">
                        Your company has been registered with ID: <strong className="text-white">{companyId}</strong>.
                        An administrator will review your application soon.
                    </p>
                    <button
                        onClick={() => router.push('/tailwind/login')}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -right-[5%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[100px]" />
                <div className="absolute -bottom-[10%] -left-[5%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[100px]" />
            </div>

            {/* Header / Branding */}
            <div className="p-8 md:p-12 text-center z-10">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">
                    Labour Certification Platform
                </h1>
                <p className="text-white/40 text-sm mt-2">Certify and educate your workforce</p>
            </div>

            {/* Form Card */}
            <div className="flex-1 flex items-start justify-center px-4 pb-12 z-10">
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 max-w-2xl w-full shadow-2xl">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white">Company Registration</h2>
                        <p className="text-sm text-white/50 mt-1">Join the platform to certify and educate your workforce</p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center justify-center gap-0 mb-8">
                        {STEPS.map((step, idx) => {
                            const isActive = idx === activeStep;
                            const isCompleted = idx < activeStep;
                            const Icon = step.icon;
                            return (
                                <React.Fragment key={step.label}>
                                    {idx > 0 && (
                                        <div className={`w-12 h-px mx-1 ${isCompleted ? 'bg-emerald-500' : 'bg-white/10'}`} />
                                    )}
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCompleted
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : isActive
                                                ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-400/30'
                                                : 'bg-white/5 text-white/30'
                                            }`}>
                                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                        </div>
                                        <span className={`text-[11px] font-medium ${isCompleted ? 'text-emerald-400' : isActive ? 'text-white' : 'text-white/30'
                                            }`}>
                                            {step.label}
                                        </span>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-2">
                            <Info className="w-4 h-4 mt-0.5 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Step Content */}
                    <div className="space-y-4">
                        {activeStep === 0 && (
                            <>
                                <FormInput label="Company Name" name="company_name" value={formData.company_name} onChange={handleChange} required />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-white/60 mb-1.5">Industry *</label>
                                        <select
                                            name="industry_id"
                                            value={formData.industry_id}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
                                        >
                                            <option value="" className="bg-slate-800">Select Industry</option>
                                            {industries.map((ind) => (
                                                <option key={ind.id} value={ind.id} className="bg-slate-800">{ind.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <FormInput label="Website" name="website" value={formData.website} onChange={handleChange} placeholder="https://" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-white/60 mb-1.5">Office Address *</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        rows={2}
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                                    />
                                </div>
                            </>
                        )}

                        {activeStep === 1 && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput label="First Name" name="supervisor_first_name" value={formData.supervisor_first_name} onChange={handleChange} required />
                                    <FormInput label="Last Name" name="supervisor_last_name" value={formData.supervisor_last_name} onChange={handleChange} required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput label="Business Email" name="supervisor_email" type="email" value={formData.supervisor_email} onChange={handleChange} required />
                                    <FormInput label="Phone Number" name="supervisor_phone" value={formData.supervisor_phone} onChange={handleChange} required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput label="Password" name="supervisor_password" type="password" value={formData.supervisor_password} onChange={handleChange} required />
                                    <FormInput label="Confirm Password" name="confirm_password" type="password" value={formData.confirm_password} onChange={handleChange} required />
                                </div>
                            </>
                        )}

                        {activeStep === 2 && (
                            <>
                                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm flex items-start gap-2">
                                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                                    Tax ID is required for verification and billing. You will be able to upload documents after initial setup.
                                </div>
                                <FormInput label="Tax ID / Registration Number" name="tax_id" value={formData.tax_id} onChange={handleChange} required />
                                <div className="p-6 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                                    <p className="text-sm text-white/40">
                                        Supporting documents upload is currently being enabled for your region.
                                        You will get a notification via email once approved.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8">
                        <button
                            onClick={handleBack}
                            disabled={activeStep === 0 || loading}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white/70 border border-white/10 rounded-xl hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            {activeStep === STEPS.length - 1 ? (
                                loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
                                ) : 'Complete Registration'
                            ) : (
                                <>Continue <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>

                    {/* Login Link */}
                    <p className="text-center text-sm text-white/40 mt-6">
                        Already have an account?{' '}
                        <a href="/tailwind/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                            Sign in
                        </a>
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 text-center z-10">
                <p className="text-xs text-white/30">
                    © 2026 Labour Certification Platform. All rights reserved.
                </p>
            </div>
        </div>
    );
}

/**
 * Reusable styled form input for the registration page.
 */
function FormInput({
    label,
    name,
    value,
    onChange,
    type = 'text',
    placeholder,
    required
}: {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
                {label} {required && '*'}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
        </div>
    );
}
