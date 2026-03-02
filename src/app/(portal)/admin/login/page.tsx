'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    Mail, Lock, ArrowRight, Loader2, Phone, User, Building2,
    ChevronDown, ShieldCheck, CheckCircle2, Search
} from 'lucide-react';
import { auth } from '@/lib/firebaseClient';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

// ========================================================
// TYPES & CONSTANTS
// ========================================================

/** Country data fetched from restcountries API */
interface CountryData {
    name: string;
    code: string;    // cca2
    dialCode: string; // e.g. "+91"
    flag: string;     // emoji flag
}

/** Input field style classes shared across tabs */
const INPUT_CLASS = 'block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-500 dark:text-white dark:focus:bg-slate-900';

// ========================================================
// COUNTRY CODE DROPDOWN COMPONENT (with search)
// ========================================================

/**
 * Country code dropdown with search, flag emojis, and calling codes.
 * Fetches data from restcountries.com API on mount.
 * India is default + first, UAE second, then alphabetical.
 */
function CountryCodeDropdown({
    value,
    onChange,
}: {
    value: string;
    onChange: (code: string) => void;
}) {
    const [countries, setCountries] = useState<CountryData[]>([]);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    /**
     * Fetch all countries from restcountries API on mount.
     * Processes raw API data into a clean sorted list with India first, UAE second.
     */
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const res = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,flag,cca2');
                const data = await res.json();

                const processed: CountryData[] = data
                    .map((c: any) => {
                        const root = c.idd?.root || '';
                        const suffix = c.idd?.suffixes?.[0] || '';
                        const dialCode = `${root}${suffix}`;
                        // Skip entries without a valid dial code
                        if (!dialCode || dialCode.length < 2) return null;
                        return {
                            name: c.name?.common || '',
                            code: c.cca2 || '',
                            dialCode,
                            flag: c.flag || '',
                        };
                    })
                    .filter(Boolean) as CountryData[];

                // Sort alphabetically, then pin India first and UAE second
                processed.sort((a, b) => a.name.localeCompare(b.name));

                const pinned: CountryData[] = [];
                const rest: CountryData[] = [];
                let india: CountryData | undefined;
                let uae: CountryData | undefined;

                for (const c of processed) {
                    if (c.code === 'IN') india = c;
                    else if (c.code === 'AE') uae = c;
                    else rest.push(c);
                }

                if (india) pinned.push(india);
                if (uae) pinned.push(uae);

                setCountries([...pinned, ...rest]);
            } catch (err) {
                console.error('Failed to fetch countries:', err);
                // Fallback: India + UAE only
                setCountries([
                    { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
                    { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchCountries();
    }, []);

    /** Close dropdown on outside click */
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /** Focus search input when dropdown opens */
    useEffect(() => {
        if (open && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [open]);

    const selected = countries.find(c => c.dialCode === value);

    /** Filter countries by search term (name or dial code) */
    const filtered = search
        ? countries.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.dialCode.includes(search)
        )
        : countries;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-700 hover:bg-slate-100 transition dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 min-w-[110px]"
            >
                {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                ) : (
                    <>
                        <span className="text-base">{selected?.flag || '🌐'}</span>
                        <span className="font-medium">{value}</span>
                    </>
                )}
                <ChevronDown className="h-3 w-3 text-slate-400 ml-auto" />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search country..."
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
                            />
                        </div>
                    </div>

                    {/* Country List */}
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.length === 0 && (
                            <p className="p-3 text-sm text-slate-400 text-center">No countries found</p>
                        )}
                        {filtered.map((c, i) => (
                            <button
                                key={`${c.code}-${i}`}
                                type="button"
                                onClick={() => {
                                    onChange(c.dialCode);
                                    setOpen(false);
                                    setSearch('');
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition ${value === c.dialCode ? 'bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}
                            >
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
// OTP LOGIN TAB COMPONENT
// ========================================================

/**
 * OTP Login tab with multi-step flow:
 * 1. Phone input (no country code) → check user
 * 2a. Existing user → Welcome + OTP verification (uses country_code from DB)
 * 2b. New user → Registration form (with country code dropdown) + OTP verification
 */
function OtpLoginTab() {
    const router = useRouter();

    // Step management
    const [step, setStep] = useState<'phone' | 'otp' | 'register' | 'register_otp' | 'success'>('phone');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Phone input state — just the number, no country code for login
    const [phoneNumber, setPhoneNumber] = useState('');

    // Country code — used only during registration
    const [countryCode, setCountryCode] = useState('+91');

    // User data from checkUser response (includes country_code from DB)
    const [userData, setUserData] = useState<any>(null);

    // OTP state
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

    // Resend OTP cooldown timer (seconds)
    const [resendTimer, setResendTimer] = useState(0);
    const resendIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Registration form state
    const [regForm, setRegForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        company_id: '',
        role: 'WORKER' as 'WORKER' | 'SUPERVISOR',
    });

    /**
     * Create a fresh reCAPTCHA verifier on a dynamically created DOM element.
     * This avoids the "reCAPTCHA has already been rendered" error by never
     * reusing the same container element.
     */
    const getRecaptchaVerifier = useCallback(() => {
        // 1. Clear old verifier if exists
        if (recaptchaVerifierRef.current) {
            try { recaptchaVerifierRef.current.clear(); } catch (_) { /* ignore */ }
            recaptchaVerifierRef.current = null;
        }

        // 2. Remove any old recaptcha container from DOM
        const oldContainer = document.getElementById('recaptcha-container');
        if (oldContainer) oldContainer.remove();

        // 3. Create a brand new container element in document.body
        const newContainer = document.createElement('div');
        newContainer.id = 'recaptcha-container';
        document.body.appendChild(newContainer);

        // 4. Create fresh verifier on the new element
        const verifier = new RecaptchaVerifier(auth, newContainer, {
            size: 'invisible',
            callback: () => { /* reCAPTCHA solved */ },
        });
        recaptchaVerifierRef.current = verifier;
        return verifier;
    }, []);

    /** Cleanup reCAPTCHA on unmount */
    useEffect(() => {
        return () => {
            if (recaptchaVerifierRef.current) {
                try { recaptchaVerifierRef.current.clear(); } catch (_) { /* ignore */ }
            }
            const el = document.getElementById('recaptcha-container');
            if (el) el.remove();
        };
    }, []);

    /**
     * Start a countdown timer for OTP resend cooldown.
     * Prevents spamming the resend button.
     */
    const startResendTimer = useCallback((seconds: number = 30) => {
        setResendTimer(seconds);
        if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
        resendIntervalRef.current = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    /** Cleanup resend timer on unmount */
    useEffect(() => {
        return () => {
            if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
        };
    }, []);

    /**
     * Resend OTP to the current phone number.
     * Reuses the same full phone number from the current context.
     */
    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setError('');
        setOtp(['', '', '', '', '', '']);

        let fullPhone = '';
        if (step === 'otp' && userData) {
            // Existing user: use country_code from DB
            fullPhone = `${userData.country_code || '+91'}${phoneNumber}`;
        } else {
            // Registration: use selected country code
            fullPhone = `${countryCode}${phoneNumber}`;
        }

        await sendOtp(fullPhone);
        startResendTimer(30);
    };

    /**
     * Step 1: Check if user exists by phone number (no country code needed).
     * If exists → move to OTP step (country_code comes from DB).
     * If not → show registration form.
     */
    const handleCheckUser = async () => {
        if (!phoneNumber.trim()) {
            setError('Please enter your phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/v1/auth/check-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phoneNumber }),
            });
            const data = await res.json();

            if (!data.status) {
                setError(data.message || 'Failed to check user');
                setLoading(false);
                return;
            }

            if (data.misc?.exists) {
                // User exists — check if pending
                if (data.data.status === 'pending') {
                    setError('Your account is pending approval. Please wait for admin approval.');
                    setLoading(false);
                    return;
                }
                setUserData(data.data);
                setStep('otp');
                // Send OTP using country_code from DB
                const dbCountryCode = data.data.country_code || '+91';
                await sendOtp(`${dbCountryCode}${phoneNumber}`);
                startResendTimer(30);
            } else {
                // New user — show registration form
                setStep('register');
            }
        } catch (err) {
            setError('Network error occurred.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Send OTP via Firebase phone auth.
     * @param fullPhone - Full phone number with country code (e.g. "+919876543210")
     */
    const sendOtp = async (fullPhone: string) => {
        try {
            // Always create a brand new verifier (fresh DOM element each time)
            const verifier = getRecaptchaVerifier();
            const result = await signInWithPhoneNumber(auth, fullPhone, verifier);
            setConfirmationResult(result);
        } catch (err: any) {
            console.error('Firebase OTP Error:', err);
            setError(err.message || 'Failed to send OTP. Please try again.');
        }
    };

    /**
     * Handle OTP input: auto-focus next field, auto-submit on last digit.
     */
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

    /**
     * Verify the OTP code with Firebase, then login with the backend.
     */
    const handleVerifyOtp = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter the complete 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (!confirmationResult) {
                setError('OTP session expired. Please request a new code.');
                setLoading(false);
                return;
            }

            // Verify with Firebase
            const credential = await confirmationResult.confirm(otpCode);
            const idToken = await credential.user.getIdToken();

            // Send to backend
            const res = await fetch('/api/v1/auth/firebase/phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });
            const data = await res.json();

            if (data.status) {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                setTimeout(() => {
                    router.push('/admin/dashboard');
                }, 500);
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err: any) {
            console.error('OTP Verification Error:', err);
            setError(err.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle registration: validate form, then send Firebase OTP.
     */
    const handleRegisterSubmit = async () => {
        if (!regForm.first_name.trim() || !regForm.last_name.trim() || !regForm.company_id.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Send OTP using selected country code from registration dropdown
            await sendOtp(`${countryCode}${phoneNumber}`);
            startResendTimer(30);
            setStep('register_otp');
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    /**
     * After OTP verification during registration, submit to backend.
     */
    const handleRegisterVerifyOtp = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter the complete 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (!confirmationResult) {
                setError('OTP session expired. Please request a new code.');
                setLoading(false);
                return;
            }

            // Verify OTP with Firebase
            const credential = await confirmationResult.confirm(otpCode);
            const idToken = await credential.user.getIdToken();

            // Submit registration to backend
            const res = await fetch('/api/v1/auth/register-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken,
                    first_name: regForm.first_name,
                    last_name: regForm.last_name,
                    email: regForm.email || undefined,
                    country_code: countryCode,
                    phone: phoneNumber,
                    role: regForm.role,
                    company_id: regForm.company_id,
                }),
            });
            const data = await res.json();

            if (data.status) {
                setStep('success');
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err: any) {
            console.error('Registration Error:', err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Reset to the phone input step.
     */
    const handleBack = () => {
        setStep('phone');
        setError('');
        setOtp(['', '', '', '', '', '']);
        setUserData(null);
        setConfirmationResult(null);
    };

    // ---- RENDER ----

    return (
        <div className="space-y-5">
            {/* reCAPTCHA container (invisible) */}
            {/* reCAPTCHA container is created dynamically in document.body */}

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg flex items-center dark:bg-red-900/10 dark:border-red-900/20 dark:text-red-400 text-sm">
                    <span>{error}</span>
                </div>
            )}

            {/* ============ STEP: PHONE INPUT (NO COUNTRY CODE) ============ */}
            {step === 'phone' && (
                <>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                            Phone Number
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="Enter phone number"
                                className={INPUT_CLASS}
                                onKeyDown={(e) => e.key === 'Enter' && handleCheckUser()}
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleCheckUser}
                        disabled={loading || !phoneNumber.trim()}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px active:translate-y-0 shadow-blue-500/20 hover:shadow-blue-500/40"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <span className="flex items-center">
                                Continue <ArrowRight className="ml-2 h-4 w-4" />
                            </span>
                        )}
                    </button>
                </>
            )}

            {/* ============ STEP: OTP VERIFICATION (EXISTING USER) ============ */}
            {step === 'otp' && userData && (
                <>
                    <div className="text-center mb-2">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3">
                            <ShieldCheck className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h5 className="text-lg font-bold text-slate-900 dark:text-white">
                            Welcome back, {userData.first_name}!
                        </h5>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Enter the 6-digit code sent to {userData.full_phone || phoneNumber}
                        </p>
                    </div>

                    {/* OTP Input Fields */}
                    <div className="flex justify-center gap-2 sm:gap-3">
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
                                className="w-11 h-12 text-center text-lg font-semibold border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition"
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={loading || otp.join('').length !== 6}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px active:translate-y-0 shadow-blue-500/20 hover:shadow-blue-500/40"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <span className="flex items-center">
                                Verify & Sign In <ArrowRight className="ml-2 h-4 w-4" />
                            </span>
                        )}
                    </button>

                    {/* Back link (left) + Resend OTP (right) */}
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                        >
                            ← Change Number
                        </button>
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendTimer > 0 || loading}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 disabled:text-slate-400 disabled:dark:text-slate-600 disabled:cursor-not-allowed transition"
                        >
                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                        </button>
                    </div>
                </>
            )}

            {/* ============ STEP: REGISTRATION FORM (NEW USER) ============ */}
            {step === 'register' && (
                <>
                    <div className="text-center mb-1">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No account found for <span className="font-medium text-slate-700 dark:text-slate-300">{phoneNumber}</span>. Register below.
                        </p>
                    </div>

                    {/* Country Code + Phone (display on registration) */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                            Country & Phone Number
                        </label>
                        <div className="flex gap-2">
                            <CountryCodeDropdown value={countryCode} onChange={setCountryCode} />
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    disabled
                                    className={`${INPUT_CLASS} opacity-60 cursor-not-allowed`}
                                />
                            </div>
                        </div>
                    </div>

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
                                <input
                                    type="text"
                                    value={regForm.first_name}
                                    onChange={(e) => setRegForm({ ...regForm, first_name: e.target.value })}
                                    placeholder="First name"
                                    className={INPUT_CLASS}
                                />
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
                                <input
                                    type="text"
                                    value={regForm.last_name}
                                    onChange={(e) => setRegForm({ ...regForm, last_name: e.target.value })}
                                    placeholder="Last name"
                                    className={INPUT_CLASS}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email (Optional) */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wide">
                            Email <span className="text-slate-400 font-normal normal-case">(optional)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="email"
                                value={regForm.email}
                                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                                placeholder="name@company.com"
                                className={INPUT_CLASS}
                            />
                        </div>
                    </div>

                    {/* Role Selector — styled checkbox-radio buttons */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wide">
                            I am a <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Worker Option */}
                            <button
                                type="button"
                                onClick={() => setRegForm({ ...regForm, role: 'WORKER' })}
                                className={`relative flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${regForm.role === 'WORKER'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500'
                                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600'
                                    }`}
                            >
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${regForm.role === 'WORKER' ? 'border-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                    {regForm.role === 'WORKER' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                </div>
                                Worker
                            </button>
                            {/* Supervisor Option */}
                            <button
                                type="button"
                                onClick={() => setRegForm({ ...regForm, role: 'SUPERVISOR' })}
                                className={`relative flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${regForm.role === 'SUPERVISOR'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500'
                                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600'
                                    }`}
                            >
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${regForm.role === 'SUPERVISOR' ? 'border-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                    {regForm.role === 'SUPERVISOR' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                </div>
                                Supervisor
                            </button>
                        </div>
                    </div>

                    {/* Company ID */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wide">
                            Company ID <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Building2 className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                value={regForm.company_id}
                                onChange={(e) => setRegForm({ ...regForm, company_id: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) })}
                                placeholder="6-digit company code"
                                maxLength={6}
                                className={INPUT_CLASS}
                            />
                        </div>
                        {/* Register New Company link — shown only for Supervisors */}
                        {regForm.role === 'SUPERVISOR' && (
                            <a
                                href="/company/register"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition"
                            >
                                <Building2 className="h-3 w-3" />
                                Register a new company
                            </a>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleRegisterSubmit}
                        disabled={loading || !regForm.first_name.trim() || !regForm.last_name.trim() || !regForm.company_id.trim()}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px active:translate-y-0 shadow-blue-500/20 hover:shadow-blue-500/40"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <span className="flex items-center">
                                Continue to Verify <ArrowRight className="ml-2 h-4 w-4" />
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleBack}
                        className="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                    >
                        ← Change Number
                    </button>
                </>
            )}

            {/* ============ STEP: OTP FOR REGISTRATION ============ */}
            {step === 'register_otp' && (
                <>
                    <div className="text-center mb-2">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3">
                            <ShieldCheck className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h5 className="text-lg font-bold text-slate-900 dark:text-white">
                            Verify your phone
                        </h5>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Enter the 6-digit code sent to {countryCode} {phoneNumber}
                        </p>
                    </div>

                    {/* OTP Input Fields */}
                    <div className="flex justify-center gap-2 sm:gap-3">
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
                                className="w-11 h-12 text-center text-lg font-semibold border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition"
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={handleRegisterVerifyOtp}
                        disabled={loading || otp.join('').length !== 6}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px active:translate-y-0 shadow-blue-500/20 hover:shadow-blue-500/40"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <span className="flex items-center">
                                Verify & Register <ArrowRight className="ml-2 h-4 w-4" />
                            </span>
                        )}
                    </button>

                    {/* Back link (left) + Resend OTP (right) */}
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => { setStep('register'); setOtp(['', '', '', '', '', '']); setError(''); }}
                            className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                        >
                            ← Back to registration
                        </button>
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendTimer > 0 || loading}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 disabled:text-slate-400 disabled:dark:text-slate-600 disabled:cursor-not-allowed transition"
                        >
                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                        </button>
                    </div>
                </>
            )}

            {/* ============ STEP: SUCCESS (REGISTRATION COMPLETE) ============ */}
            {step === 'success' && (
                <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h5 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        Registration Submitted!
                    </h5>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                        Your account is pending approval. An admin or supervisor from your company will review your registration.
                    </p>
                    <button
                        type="button"
                        onClick={handleBack}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition"
                    >
                        Back to login
                    </button>
                </div>
            )}
        </div>
    );
}

// ========================================================
// EMAIL/PASSWORD LOGIN TAB COMPONENT
// ========================================================

/**
 * Standard email/password login form.
 * Extracted from the original login page.
 */
function EmailLoginTab() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    /**
     * Handle email/password login submission.
     */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (data.status) {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));

                setTimeout(() => {
                    if (['ADMIN', 'SUPER_ADMIN'].includes(data.data.user.role)) {
                        router.push('/admin/dashboard');
                    } else {
                        router.push('/admin/dashboard');
                    }
                }, 500);

            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Network error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {error && (
                <div className="mb-5 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg flex items-center dark:bg-red-900/10 dark:border-red-900/20 dark:text-red-400 text-sm">
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleLogin} noValidate className="space-y-5">
                <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                        Email Address
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className={INPUT_CLASS}
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="password" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                            Password
                        </label>
                        <Link href="#" className="text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className={INPUT_CLASS}
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px active:translate-y-0 shadow-blue-500/20 hover:shadow-blue-500/40"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <span className="flex items-center">
                                Sign In <ArrowRight className="ml-2 h-4 w-4" />
                            </span>
                        )}
                    </button>
                </div>
            </form>
        </>
    );
}

// ========================================================
// MAIN LOGIN PAGE
// ========================================================

export default function LoginPage() {
    const [activeTab, setActiveTab] = useState<'otp' | 'email'>('otp');

    return (
        <div className="min-h-screen flex bg-white dark:bg-slate-950">

            {/* Left Side: Brand & Visuals (Hidden on Mobile) */}
            <div className="hidden md:flex flex-1 bg-slate-900 dark:bg-slate-950 relative overflow-hidden flex-col justify-between p-12">
                {/* Background Gradients/Effects */}
                <div
                    className="absolute inset-0 opacity-10 z-0"
                    style={{
                        background: 'radial-gradient(circle at 10% 20%, rgb(37, 99, 235) 0%, rgb(0, 0, 0) 90.2%)'
                    }}
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
                        Empowering the<br />
                        <span className="text-blue-500">Modern Workforce</span>
                    </h2>
                    <p className="text-slate-400 text-lg leading-relaxed mb-8">
                        Streamline certifications, manage compliance, and elevate your team&apos;s skills with our comprehensive management solution.
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                            <h4 className="text-3xl font-bold text-white mb-1">98%</h4>
                            <span className="text-slate-400 text-sm">Certification Success Rate</span>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
                            <h4 className="text-3xl font-bold text-white mb-1">50k+</h4>
                            <span className="text-slate-400 text-sm">Active Users</span>
                        </div>
                    </div>
                </div>

                {/* Bottom: Footer Info */}
                <div className="relative z-10">
                    <p className="text-slate-500 text-sm">
                        Trusted by industry leaders across the globe.
                    </p>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 md:flex-none md:w-[500px] lg:w-[600px] flex flex-col justify-center items-center p-6 sm:p-12 relative dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
                <div className="w-full max-w-xs sm:max-w-sm">
                    {/* Logo Area - Centered & Clean */}
                    <div className="mb-8 flex justify-center">
                        <Image
                            src="/assets/LCP_Logo.svg"
                            alt="Labor Certification Platform"
                            width={150}
                            height={150}
                            className="w-auto h-20"
                            priority
                        />
                    </div>

                    <div className="mb-6 text-center">
                        <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                            Welcome back
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400">
                            Please enter your details to sign in
                        </p>
                    </div>

                    {/* ===== TAB SELECTOR ===== */}
                    <div className="flex mb-6 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('otp')}
                            className={`flex-1 py-2 px-3 text-sm font-semibold rounded-md transition-all duration-200 ${activeTab === 'otp'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-1.5">
                                <Phone className="h-3.5 w-3.5" />
                                OTP Login
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('email')}
                            className={`flex-1 py-2 px-3 text-sm font-semibold rounded-md transition-all duration-200 ${activeTab === 'email'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                Email / Password
                            </span>
                        </button>
                    </div>

                    {/* ===== ACTIVE TAB CONTENT ===== */}
                    {activeTab === 'otp' ? <OtpLoginTab /> : <EmailLoginTab />}

                    {/* ===== DIVIDER ===== */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 dark:text-slate-500">
                                or
                            </span>
                        </div>
                    </div>

                    {/* ===== GOOGLE LOGIN (PLACEHOLDER) ===== */}
                    <button
                        type="button"
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 cursor-not-allowed opacity-60"
                        title="Coming soon"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign in with Google (Coming Soon)
                    </button>
                </div>
            </div>
        </div>
    );
}
