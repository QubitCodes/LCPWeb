'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    Building2, User, ShieldCheck, ArrowRight, ArrowLeft, Loader2,
    CheckCircle2, Info, Mail, Phone, Globe, MapPin, FileText,
    ChevronDown, Search, MapPinned, Plus, Trash2, Clock, HardHat,
    ClipboardCheck
} from 'lucide-react';
import { auth } from '@/lib/firebaseClient';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

// ========================================================
// TYPES & CONSTANTS
// ========================================================

/**
 * Step definitions for the registration stepper.
 * Order: Supervisor → Company → Sites → Review
 */
const STEPS = [
    { label: 'Supervisor', icon: User },
    { label: 'Company', icon: Building2 },
    { label: 'Sites', icon: MapPinned },
    { label: 'Review', icon: ClipboardCheck }
];

/** Project stage options for site form */
const PROJECT_STAGES = [
    { value: 'FOUNDATION', label: 'Foundation' },
    { value: 'STRUCTURE', label: 'Structure' },
    { value: 'MASONRY', label: 'Masonry' },
    { value: 'FINISHING', label: 'Finishing' },
    { value: 'MEP', label: 'MEP (Mechanical/Electrical/Plumbing)' }
];

/** Country data for the dropdown */
interface CountryData {
    name: string;
    code: string;
    dialCode: string;
    flag: string;
}

/** Industry dropdown option */
interface IndustryOption {
    id: string;
    name: string;
}

/** Site entry for multi-site form */
interface SiteEntry {
    site_name: string;
    site_address: string;
    project_stage: string;
    expected_duration_months: string;
}

/** Input field style classes — matches the login page */
const INPUT_CLASS = 'block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-500 dark:text-white dark:focus:bg-slate-900';

/** Select field style classes */
const SELECT_CLASS = 'block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-500 dark:text-white dark:focus:bg-slate-900 appearance-none';

/** Textarea style classes */
const TEXTAREA_CLASS = 'block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-500 dark:text-white dark:focus:bg-slate-900 resize-none';

// ========================================================
// COUNTRY CODE DROPDOWN
// ========================================================

/**
 * Country code dropdown with search — reused from login.
 */
function CountryCodeDropdown({ value, onChange }: { value: string; onChange: (code: string) => void }) {
    const [countries, setCountries] = useState<CountryData[]>([]);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/data/country-codes.json')
            .then(r => r.json())
            .then((data: CountryData[]) => setCountries(data))
            .catch(() => { });
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const current = countries.find(c => c.dialCode === value);
    const filtered = countries.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) || c.dialCode.includes(search)
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <button type="button" onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-900 transition min-w-[100px]">
                <span className="text-base">{current?.flag || '🌍'}</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{value}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="relative">
                            <Search className="h-4 w-4 text-slate-400 absolute left-2.5 top-2.5" />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search countries..." autoFocus
                                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-500" />
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.length === 0 && <p className="p-3 text-sm text-slate-400 text-center">No countries found</p>}
                        {filtered.map((c, i) => (
                            <button key={`${c.code}-${i}`} type="button" onClick={() => { onChange(c.dialCode); setOpen(false); setSearch(''); }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition ${value === c.dialCode ? 'bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                <span className="text-base w-6 text-center">{c.flag}</span>
                                <span className="flex-1 truncate">{c.name}</span>
                                <span className="text-slate-400 dark:text-slate-500 text-xs font-mono">{c.dialCode}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ========================================================
// MAIN PAGE COMPONENT
// ========================================================

/**
 * RegisterPageContent — 4-step company registration form.
 * Step 0: Supervisor details + OTP verification
 * Step 1: Company details
 * Step 2: Site(s) details
 * Step 3: Review & submit
 *
 * Supports ?step=N for resuming onboarding after login.
 * Supports ?complete=true for showing completion state.
 */
function RegisterPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Determine starting step from query param (for resume flow)
    const stepParam = searchParams.get('step');
    const completeParam = searchParams.get('complete');
    const initialStep = stepParam ? Math.min(parseInt(stepParam, 10) - 1, STEPS.length - 1) : 0;

    const [activeStep, setActiveStep] = useState(Math.max(0, initialStep));
    const [industries, setIndustries] = useState<IndustryOption[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(completeParam === 'true');
    const [companyId, setCompanyId] = useState('');

    // OTP flow state
    const [otpStep, setOtpStep] = useState<'form' | 'otp'>('form');
    const [otp, setOtp] = useState('');
    const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);
    const [resendTimer, setResendTimer] = useState(0);

    const [formData, setFormData] = useState({
        // Supervisor (Step 0)
        supervisor_first_name: '',
        supervisor_last_name: '',
        supervisor_email: '',
        supervisor_phone: '',
        country_code: '+91',
        // Company (Step 1)
        company_name: '',
        industry_id: '',
        address: '',
        website: '',
        contact_email: '',
        contact_phone: '',
    });

    // Sites (Step 2) — supports adding multiple
    const [sites, setSites] = useState<SiteEntry[]>([
        { site_name: '', site_address: '', project_stage: '', expected_duration_months: '' }
    ]);

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

    /** Timer for OTP resend cooldown */
    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    /** Generic form change handler */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    /** Update a specific site entry field */
    const handleSiteChange = (index: number, field: keyof SiteEntry, value: string) => {
        const updated = [...sites];
        updated[index] = { ...updated[index], [field]: value };
        setSites(updated);
    };

    /** Add a new empty site entry */
    const addSite = () => {
        setSites([...sites, { site_name: '', site_address: '', project_stage: '', expected_duration_months: '' }]);
    };

    /** Remove a site entry by index (min 1 site required) */
    const removeSite = (index: number) => {
        if (sites.length <= 1) return;
        setSites(sites.filter((_, i) => i !== index));
    };

    // =---------------------------------------------------------
    // STEP VALIDATION
    // =---------------------------------------------------------

    /**
     * Check if the current step has all required fields filled.
     */
    const isStepValid = (): boolean => {
        if (activeStep === 0) {
            return !!(
                formData.supervisor_first_name.trim() &&
                formData.supervisor_last_name.trim() &&
                formData.supervisor_email.trim() &&
                formData.supervisor_phone.trim() &&
                formData.country_code
            );
        }
        if (activeStep === 1) {
            return !!(formData.company_name.trim() && formData.industry_id && formData.address.trim());
        }
        if (activeStep === 2) {
            // At least one site with a name is required
            return sites.length > 0 && sites.every(s => s.site_name.trim().length > 0);
        }
        return true; // Review step is always valid
    };

    // =---------------------------------------------------------
    // OTP FLOW (Step 0 only)
    // =---------------------------------------------------------

    /** Create a fresh reCAPTCHA verifier */
    const getRecaptchaVerifier = useCallback(() => {
        const existingContainer = document.getElementById('recaptcha-container-register');
        if (existingContainer) existingContainer.remove();
        const newDiv = document.createElement('div');
        newDiv.id = 'recaptcha-container-register';
        newDiv.style.display = 'none';
        document.body.appendChild(newDiv);
        return new RecaptchaVerifier(auth, 'recaptcha-container-register', { size: 'invisible' });
    }, []);

    /** Send OTP to supervisor's phone — pre-validates email/phone uniqueness first */
    const sendOtp = async () => {
        setLoading(true);
        setError('');
        try {
            // 1. Pre-validate: check if email or phone already exist in our DB
            const checkRes = await fetch('/api/v1/auth/check-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: formData.supervisor_phone,
                    email: formData.supervisor_email || undefined
                }),
            });
            const checkData = await checkRes.json();

            if (checkData.status && checkData.data) {
                if (checkData.data.phone_exists) {
                    setError('This phone number is already registered. Please login instead.');
                    setLoading(false);
                    return;
                }
                if (checkData.data.email_exists) {
                    setError('This email address is already registered. Please login instead.');
                    setLoading(false);
                    return;
                }
            }

            // 2. All clear — send Firebase OTP
            const verifier = getRecaptchaVerifier();
            const fullPhone = `${formData.country_code}${formData.supervisor_phone}`;
            const result = await signInWithPhoneNumber(auth, fullPhone, verifier);
            setConfirmResult(result);
            setOtpStep('otp');
            setResendTimer(30);
        } catch (err: any) {
            console.error('OTP Error:', err);
            setError(err.message || 'Failed to send OTP. Check your phone number.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Verify OTP → call register-supervisor API → auto-login → advance to Step 1.
     */
    const verifyOtpAndRegister = async () => {
        if (!confirmResult) return;
        setLoading(true);
        setError('');
        try {
            const credential = await confirmResult.confirm(otp);
            const idToken = await credential.user.getIdToken();

            // Call register-supervisor API with Firebase token + form data
            const res = await fetch('/api/v1/auth/register-supervisor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken,
                    first_name: formData.supervisor_first_name,
                    last_name: formData.supervisor_last_name,
                    email: formData.supervisor_email,
                    country_code: formData.country_code,
                    phone: formData.supervisor_phone,
                }),
            });
            const data = await res.json();

            if (data.status) {
                // Store token for subsequent authenticated requests
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                // Advance to Company step
                setActiveStep(1);
                setOtpStep('form');
                setOtp('');
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err: any) {
            console.error('OTP Verify Error:', err);
            setError('Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /** Handle Step 0 "Continue" → triggers OTP */
    const handleStep0Continue = () => {
        if (otpStep === 'form') {
            sendOtp();
        } else {
            verifyOtpAndRegister();
        }
    };

    /** Resend OTP */
    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setOtp('');
        await sendOtp();
    };

    // =---------------------------------------------------------
    // STEPS 1, 2 & 3 SUBMISSION
    // =---------------------------------------------------------

    /**
     * Submit Step 1 (Company) → creates company record.
     */
    const handleCompanySubmit = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/company/onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    company_name: formData.company_name,
                    industry_id: formData.industry_id,
                    address: formData.address,
                    website: formData.website,
                    contact_email: formData.contact_email || undefined,
                    contact_phone: formData.contact_phone || undefined,
                }),
            });
            const data = await res.json();
            if (data.status) {
                setCompanyId(data.data.companyId);
                setActiveStep(2);
            } else {
                setError(data.message || 'Company registration failed');
            }
        } catch {
            setError('Network error occurred.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Submit Step 2 (Sites) → creates site record(s).
     * Sends each site to the API sequentially.
     */
    const handleSitesSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');

            for (const site of sites) {
                const res = await fetch('/api/v1/company/onboarding', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        site_name: site.site_name,
                        site_address: site.site_address || undefined,
                        project_stage: site.project_stage || undefined,
                        expected_duration_months: site.expected_duration_months ? parseInt(site.expected_duration_months, 10) : undefined,
                    }),
                });
                const data = await res.json();
                if (!data.status) {
                    setError(data.message || `Failed to add site: ${site.site_name}`);
                    setLoading(false);
                    return;
                }
            }

            // All sites added successfully
            setActiveStep(3);
        } catch {
            setError('Network error occurred.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Submit Step 3 (Review) → completes onboarding.
     */
    const handleCompleteSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/company/onboarding', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({}),
            });
            const data = await res.json();
            if (data.status) {
                setSuccess(true);
            } else {
                setError(data.message || 'Completion failed');
            }
        } catch {
            setError('Network error occurred.');
        } finally {
            setLoading(false);
        }
    };

    // =---------------------------------------------------------
    // NAVIGATION
    // =---------------------------------------------------------

    /** Handle "Continue" button click based on current step */
    const handleNext = () => {
        if (activeStep === 0) {
            handleStep0Continue();
        } else if (activeStep === 1) {
            handleCompanySubmit();
        } else if (activeStep === 2) {
            handleSitesSubmit();
        } else if (activeStep === 3) {
            handleCompleteSubmit();
        }
    };

    const handleBack = () => {
        if (activeStep === 0 && otpStep === 'otp') {
            setOtpStep('form');
            setOtp('');
            setError('');
        } else {
            setActiveStep((prev) => prev - 1);
        }
    };

    /** Get the industry name by ID */
    const getIndustryName = () => {
        const ind = industries.find(i => i.id === formData.industry_id);
        return ind?.name || 'Not selected';
    };

    // =---------------------------------------------------------
    // RENDER
    // =---------------------------------------------------------

    return (
        <div className="min-h-screen flex bg-white dark:bg-slate-950">

            {/* ====== LEFT PANEL: Brand & Visuals (Fixed, Hidden on Mobile) ====== */}
            <div className="hidden md:flex flex-1 bg-slate-900 dark:bg-slate-950 relative overflow-hidden flex-col justify-between p-12 sticky top-0 h-screen">
                {/* Background Gradient */}
                <div
                    className="absolute inset-0 opacity-10 z-0"
                    style={{ background: 'radial-gradient(circle at 10% 20%, rgb(37, 99, 235) 0%, rgb(0, 0, 0) 90.2%)' }}
                />

                {/* Top: Brand Name */}
                <div className="relative z-10">
                    <h6 className="text-white font-bold tracking-widest flex items-center gap-2 uppercase">
                        <span className="w-2 h-2 bg-blue-600 rounded-full inline-block" />
                        LCP Platform
                    </h6>
                </div>

                {/* Center: Value Prop */}
                <div className="relative z-10 max-w-lg">
                    <h2 className="text-white font-extrabold text-5xl mb-6 leading-tight">
                        Register Your<br />
                        <span className="text-blue-500">Company</span>
                    </h2>
                    <p className="text-slate-400 text-lg leading-relaxed mb-8">
                        Join the Labour Certification Platform to manage your workforce certifications, compliance, and training — all in one place.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck className="h-5 w-5 text-blue-400" />
                                <span className="text-white font-semibold text-sm">Compliance</span>
                            </div>
                            <span className="text-slate-400 text-xs">Stay compliant with automated tracking</span>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <User className="h-5 w-5 text-emerald-400" />
                                <span className="text-white font-semibold text-sm">Workforce</span>
                            </div>
                            <span className="text-slate-400 text-xs">Manage your entire team effortlessly</span>
                        </div>
                    </div>
                </div>

                {/* Bottom: Footer */}
                <div className="relative z-10">
                    <p className="text-slate-500 text-sm">Trusted by industry leaders across the globe.</p>
                </div>
            </div>

            {/* ====== RIGHT PANEL: Registration Form (Scrollable) ====== */}
            <div className="flex-1 flex flex-col justify-start items-center p-6 sm:p-12 relative dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto max-h-screen">
                <div className="w-full max-w-sm sm:max-w-md py-8">

                    {/* Logo */}
                    <div className="mb-6 flex justify-center">
                        <Image
                            src="/assets/LCP_Logo.svg" alt="Labor Certification Platform"
                            width={150} height={150} className="w-auto h-16" priority
                        />
                    </div>

                    {/* ======= SUCCESS / COMPLETE STATE ======= */}
                    {success ? (
                        <div className="text-center py-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                Onboarding Complete!
                            </h4>
                            {companyId && (
                                <>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                                        Your company has been registered with ID:
                                    </p>
                                    <p className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-4">
                                        {companyId}
                                    </p>
                                </>
                            )}
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Your application is pending admin review. You can continue on the mobile app in the meantime.
                            </p>
                            <button
                                onClick={() => router.push('/company/login')}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                            >
                                <span className="flex items-center">Go to Login <ArrowRight className="ml-2 h-4 w-4" /></span>
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="mb-6 text-center">
                                <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                                    Company Registration
                                </h4>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    Join the platform to certify your workforce
                                </p>
                            </div>

                            {/* ===== STEPPER ===== */}
                            <div className="flex items-center justify-center gap-0 mb-6">
                                {STEPS.map((step, idx) => {
                                    const isActive = idx === activeStep;
                                    const isCompleted = idx < activeStep;
                                    const Icon = step.icon;
                                    return (
                                        <React.Fragment key={step.label}>
                                            {idx > 0 && (
                                                <div className={`w-8 h-px mx-0.5 transition-colors ${isCompleted ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                            )}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCompleted
                                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                    : isActive
                                                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 ring-2 ring-blue-500/30'
                                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                                    }`}>
                                                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                                                </div>
                                                <span className={`text-[9px] font-semibold uppercase tracking-wide ${isCompleted
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : isActive
                                                        ? 'text-slate-900 dark:text-white'
                                                        : 'text-slate-400 dark:text-slate-500'
                                                    }`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <div className="mb-5 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 dark:bg-red-900/10 dark:border-red-900/20 dark:text-red-400 text-sm">
                                    <Info className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* ===== STEP CONTENT ===== */}
                            <div className="space-y-4">

                                {/* STEP 0: Supervisor Details */}
                                {activeStep === 0 && (
                                    <>
                                        {otpStep === 'form' ? (
                                            <>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {/* First Name */}
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wide">
                                                            First Name <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <User className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                            <input type="text" name="supervisor_first_name" value={formData.supervisor_first_name}
                                                                onChange={handleChange} placeholder="First name" className={INPUT_CLASS} />
                                                        </div>
                                                    </div>
                                                    {/* Last Name */}
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wide">
                                                            Last Name <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <User className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                            <input type="text" name="supervisor_last_name" value={formData.supervisor_last_name}
                                                                onChange={handleChange} placeholder="Last name" className={INPUT_CLASS} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Email */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                                                        Business Email <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <Mail className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                        <input type="email" name="supervisor_email" value={formData.supervisor_email}
                                                            onChange={handleChange} placeholder="name@company.com" className={INPUT_CLASS} />
                                                    </div>
                                                </div>

                                                {/* Phone with Country Code */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                                                        Phone Number <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <CountryCodeDropdown value={formData.country_code} onChange={(code) => setFormData({ ...formData, country_code: code })} />
                                                        <div className="relative flex-1">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <Phone className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                            <input type="tel" name="supervisor_phone" value={formData.supervisor_phone}
                                                                onChange={(e) => setFormData({ ...formData, supervisor_phone: e.target.value.replace(/\D/g, '') })}
                                                                placeholder="Phone number" className={INPUT_CLASS} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {/* OTP Input */}
                                                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 dark:bg-blue-900/10 dark:border-blue-900/20 dark:text-blue-400 text-sm flex items-start gap-2">
                                                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                                                    A verification code has been sent to {formData.country_code}{formData.supervisor_phone}
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                                                        Enter OTP
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <ShieldCheck className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                        <input type="text" value={otp}
                                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                            placeholder="6-digit code" maxLength={6} className={INPUT_CLASS} />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-end">
                                                    <button type="button" onClick={handleResendOtp} disabled={resendTimer > 0}
                                                        className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition">
                                                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}

                                {/* STEP 1: Company Details */}
                                {activeStep === 1 && (
                                    <>
                                        {/* Company Name */}
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                                                Company Name <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Building2 className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <input type="text" name="company_name" value={formData.company_name}
                                                    onChange={handleChange} placeholder="Your company name" className={INPUT_CLASS} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Industry */}
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                                                    Industry <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Building2 className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                    <select name="industry_id" value={formData.industry_id} onChange={handleChange} className={SELECT_CLASS}>
                                                        <option value="">Select</option>
                                                        {industries.map((ind) => (
                                                            <option key={ind.id} value={ind.id}>{ind.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Website */}
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                                                    Website <span className="text-slate-400 font-normal normal-case">(optional)</span>
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Globe className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                    <input type="text" name="website" value={formData.website}
                                                        onChange={handleChange} placeholder="https://" className={INPUT_CLASS} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Office Address */}
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                                                Office Address <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-start pt-3 pointer-events-none">
                                                    <MapPin className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <textarea name="address" value={formData.address} onChange={handleChange}
                                                    rows={2} placeholder="Full office address" className={TEXTAREA_CLASS} />
                                            </div>
                                        </div>

                                        {/* Contact Info (optional override) */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                                                    Contact Email <span className="text-slate-400 font-normal normal-case">(optional)</span>
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Mail className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                    <input type="email" name="contact_email" value={formData.contact_email}
                                                        onChange={handleChange} placeholder="company@email.com" className={INPUT_CLASS} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                                                    Contact Phone <span className="text-slate-400 font-normal normal-case">(optional)</span>
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Phone className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                    <input type="tel" name="contact_phone" value={formData.contact_phone}
                                                        onChange={handleChange} placeholder="Office phone" className={INPUT_CLASS} />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* STEP 2: Sites */}
                                {activeStep === 2 && (
                                    <>
                                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 dark:bg-blue-900/10 dark:border-blue-900/20 dark:text-blue-400 text-sm flex items-start gap-2">
                                            <Info className="w-4 h-4 mt-0.5 shrink-0" />
                                            Add at least one site where your workforce operates. You can add more sites later from your dashboard.
                                        </div>

                                        {sites.map((site, idx) => (
                                            <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3 relative bg-white dark:bg-slate-800/50">
                                                {/* Site Header */}
                                                <div className="flex items-center justify-between">
                                                    <h5 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                        <HardHat className="w-4 h-4 text-blue-500" />
                                                        Site {idx + 1}
                                                    </h5>
                                                    {sites.length > 1 && (
                                                        <button type="button" onClick={() => removeSite(idx)}
                                                            className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 transition p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Site Name */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wide">
                                                        Site Name <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <MapPinned className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                        <input type="text" value={site.site_name}
                                                            onChange={(e) => handleSiteChange(idx, 'site_name', e.target.value)}
                                                            placeholder="e.g. Downtown Tower Project" className={INPUT_CLASS} />
                                                    </div>
                                                </div>

                                                {/* Site Address */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wide">
                                                        Site Address <span className="text-slate-400 font-normal normal-case">(optional)</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-start pt-3 pointer-events-none">
                                                            <MapPin className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                        <textarea value={site.site_address}
                                                            onChange={(e) => handleSiteChange(idx, 'site_address', e.target.value)}
                                                            rows={2} placeholder="Site location/address" className={TEXTAREA_CLASS} />
                                                    </div>
                                                </div>

                                                {/* Project Stage & Duration */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wide">
                                                            Project Stage <span className="text-slate-400 font-normal normal-case">(optional)</span>
                                                        </label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <HardHat className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                            <select value={site.project_stage}
                                                                onChange={(e) => handleSiteChange(idx, 'project_stage', e.target.value)}
                                                                className={SELECT_CLASS}>
                                                                <option value="">Select stage</option>
                                                                {PROJECT_STAGES.map(ps => (
                                                                    <option key={ps.value} value={ps.value}>{ps.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wide">
                                                            Duration <span className="text-slate-400 font-normal normal-case">(months)</span>
                                                        </label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                                <Clock className="h-4 w-4 text-slate-400" />
                                                            </div>
                                                            <input type="number" min="1" max="120" value={site.expected_duration_months}
                                                                onChange={(e) => handleSiteChange(idx, 'expected_duration_months', e.target.value)}
                                                                placeholder="e.g. 12" className={INPUT_CLASS} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Another Site button */}
                                        <button type="button" onClick={addSite}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors">
                                            <Plus className="w-4 h-4" />
                                            Add Another Site
                                        </button>
                                    </>
                                )}

                                {/* STEP 3: Review & Submit */}
                                {activeStep === 3 && (
                                    <>
                                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-900/10 dark:border-emerald-900/20 dark:text-emerald-400 text-sm flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                            Please review your information before submitting.
                                        </div>

                                        {/* Supervisor Summary */}
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
                                                <h5 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                                    <User className="w-3.5 h-3.5" /> Supervisor
                                                </h5>
                                            </div>
                                            <div className="px-4 py-3 space-y-1.5">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">Name</span>
                                                    <span className="text-slate-900 dark:text-white font-medium">{formData.supervisor_first_name} {formData.supervisor_last_name}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">Email</span>
                                                    <span className="text-slate-900 dark:text-white font-medium">{formData.supervisor_email}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">Phone</span>
                                                    <span className="text-slate-900 dark:text-white font-medium">{formData.country_code} {formData.supervisor_phone}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Company Summary */}
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
                                                <h5 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                                    <Building2 className="w-3.5 h-3.5" /> Company
                                                </h5>
                                            </div>
                                            <div className="px-4 py-3 space-y-1.5">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">Company</span>
                                                    <span className="text-slate-900 dark:text-white font-medium">{formData.company_name}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">Industry</span>
                                                    <span className="text-slate-900 dark:text-white font-medium">{getIndustryName()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">Address</span>
                                                    <span className="text-slate-900 dark:text-white font-medium text-right max-w-[200px] truncate">{formData.address}</span>
                                                </div>
                                                {formData.website && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-slate-500 dark:text-slate-400">Website</span>
                                                        <span className="text-blue-600 dark:text-blue-400 font-medium truncate max-w-[200px]">{formData.website}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Sites Summary */}
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
                                                <h5 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                                    <MapPinned className="w-3.5 h-3.5" /> Sites ({sites.length})
                                                </h5>
                                            </div>
                                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {sites.map((site, idx) => (
                                                    <div key={idx} className="px-4 py-3 space-y-1">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-slate-500 dark:text-slate-400">Site {idx + 1}</span>
                                                            <span className="text-slate-900 dark:text-white font-medium">{site.site_name}</span>
                                                        </div>
                                                        {site.site_address && (
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-500 dark:text-slate-400">Address</span>
                                                                <span className="text-slate-700 dark:text-slate-300 text-right max-w-[200px] truncate">{site.site_address}</span>
                                                            </div>
                                                        )}
                                                        {site.project_stage && (
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-500 dark:text-slate-400">Stage</span>
                                                                <span className="text-slate-700 dark:text-slate-300">{PROJECT_STAGES.find(ps => ps.value === site.project_stage)?.label || site.project_stage}</span>
                                                            </div>
                                                        )}
                                                        {site.expected_duration_months && (
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-500 dark:text-slate-400">Duration</span>
                                                                <span className="text-slate-700 dark:text-slate-300">{site.expected_duration_months} months</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* ===== NAVIGATION BUTTONS ===== */}
                            <div className="flex items-center justify-between mt-6">
                                <button type="button" onClick={handleBack}
                                    disabled={(activeStep === 0 && otpStep === 'form') || loading}
                                    className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition disabled:opacity-30 disabled:cursor-not-allowed">
                                    <ArrowLeft className="w-4 h-4" />
                                    {activeStep === 0 && otpStep === 'otp' ? 'Change Number' : 'Back'}
                                </button>
                                <button type="button" onClick={handleNext}
                                    disabled={loading || (otpStep === 'form' && !isStepValid()) || (otpStep === 'otp' && otp.length < 6) || (activeStep > 0 && !isStepValid())}
                                    className="flex items-center gap-1.5 py-2.5 px-5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px active:translate-y-0 shadow-blue-500/20 hover:shadow-blue-500/40">
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> {activeStep === 0 && otpStep === 'otp' ? 'Verifying...' : activeStep === 3 ? 'Completing...' : 'Processing...'}</>
                                    ) : activeStep === 0 && otpStep === 'form' ? (
                                        <>Send OTP <ArrowRight className="w-4 h-4" /></>
                                    ) : activeStep === 0 && otpStep === 'otp' ? (
                                        <>Verify & Continue <ArrowRight className="w-4 h-4" /></>
                                    ) : activeStep === 3 ? (
                                        <>Complete Registration <ArrowRight className="w-4 h-4" /></>
                                    ) : (
                                        <>Continue <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>

                            {/* ===== DIVIDER ===== */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 dark:text-slate-500">or</span>
                                </div>
                            </div>

                            {/* Login Link */}
                            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                                Already have an account?{' '}
                                <Link href="/company/login" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Wraps RegisterPageContent in a Suspense boundary for useSearchParams.
 */
export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        }>
            <RegisterPageContent />
        </Suspense>
    );
}
