'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    Mail, Lock, ArrowRight, Loader2, Phone, User,
    ChevronDown, ShieldCheck, CheckCircle2, Search
} from 'lucide-react';
import { useFirebaseOtp } from '@/lib/useFirebaseOtp';
import OtpInput from '@/components/ui/OtpInput';

// ========================================================
// TYPES & CONSTANTS
// ========================================================

/** Country data for the dropdown */
interface CountryData {
    name: string;
    code: string;
    dialCode: string;
    flag: string;
}

/** Shared input style matching the admin login page */
const INPUT_CLASS = 'block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-500 dark:text-white dark:focus:bg-slate-900';

// ========================================================
// COUNTRY CODE DROPDOWN
// ========================================================

/**
 * Country code dropdown with search — identical to admin login.
 */
function CountryCodeDropdown({ value, onChange }: { value: string; onChange: (code: string) => void }) {
    const [countries, setCountries] = useState<CountryData[]>([]);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

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
                        if (!dialCode || dialCode.length < 2) return null;
                        return { name: c.name?.common || '', code: c.cca2 || '', dialCode, flag: c.flag || '' };
                    })
                    .filter(Boolean) as CountryData[];
                processed.sort((a, b) => a.name.localeCompare(b.name));
                const pinned: CountryData[] = [];
                const rest: CountryData[] = [];
                let india: CountryData | undefined, uae: CountryData | undefined;
                for (const c of processed) {
                    if (c.code === 'IN') india = c;
                    else if (c.code === 'AE') uae = c;
                    else rest.push(c);
                }
                if (india) pinned.push(india);
                if (uae) pinned.push(uae);
                setCountries([...pinned, ...rest]);
            } catch {
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

    useEffect(() => { if (open && searchInputRef.current) searchInputRef.current.focus(); }, [open]);

    const selected = countries.find(c => c.dialCode === value);
    const filtered = search ? countries.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.dialCode.includes(search)) : countries;

    return (
        <div className="relative" ref={dropdownRef}>
            <button type="button" onClick={() => setOpen(!open)}
                className="flex items-center gap-1 px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-700 hover:bg-slate-100 transition dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 min-w-[110px]">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /> : (
                    <><span className="text-base">{selected?.flag || '🌐'}</span><span className="font-medium">{value}</span></>
                )}
                <ChevronDown className="h-3 w-3 text-slate-400 ml-auto" />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input ref={searchInputRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search country..." className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-500" />
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
// OTP LOGIN TAB (Company version)
// ========================================================

/**
 * OTP Login tab — sends OTP via shared hook, verifies, then handles onboarding redirect.
 */
function OtpLoginTab() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [otp, setOtp] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    /** Shared Firebase OTP hook — handles reCAPTCHA, send, verify, resend, timer */
    const firebaseOtp = useFirebaseOtp();

    /** Send OTP to phone */
    const handleSendOtp = async () => {
        const fullPhone = `${countryCode}${phone}`;
        const success = await firebaseOtp.sendOtp(fullPhone);
        if (success) {
            setStep('otp');
        }
    };

    /** Verify OTP and login */
    const handleVerifyOtp = async () => {
        setLoginLoading(true);
        setLoginError('');
        try {
            const idToken = await firebaseOtp.verifyOtp(otp);
            if (!idToken) {
                setLoginLoading(false);
                return; // Hook already set its own error
            }

            const res = await fetch('/api/v1/auth/firebase/phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });
            const data = await res.json();

            if (data.status) {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                handleOnboardingRedirect(data.data.user);
            } else if (data.code === 310 && data.is_new_user) {
                router.push('/company/register');
            } else {
                setLoginError(data.message || 'Login failed');
            }
        } catch (err: any) {
            setLoginError('Login failed. Please try again.');
        } finally {
            setLoginLoading(false);
        }
    };

    /**
     * Redirect user based on their onboarding state.
     * Middleware will also enforce this, but we do it client-side for UX.
     */
    const handleOnboardingRedirect = (user: any) => {
        const { role, company, onboarding_step } = user;

        if (role === 'ADMIN_SUPERVISOR') {
            if (!company) {
                router.push('/company/register?step=2');
            } else if (onboarding_step !== null && onboarding_step !== undefined) {
                router.push(`/company/register?step=${onboarding_step + 1}`);
            } else {
                router.push('/company/register?complete=true');
            }
        } else if (role === 'SUPERVISOR') {
            if (!company || !company.id) {
                setLoginError('Company registration incomplete. Please contact your Admin Supervisor.');
            } else {
                router.push('/company/register?complete=true');
            }
        } else {
            router.push('/admin/dashboard');
        }
    };

    /** Combined error from hook or login API */
    const displayError = firebaseOtp.error || loginError;

    /** Combined loading state */
    const isLoading = firebaseOtp.sending || firebaseOtp.verifying || loginLoading;

    return (
        <div className="space-y-4">
            {/* Hidden reCAPTCHA container */}
            <div id={firebaseOtp.recaptchaContainerId} style={{ display: 'none' }} />

            {displayError && (
                <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg flex items-center dark:bg-red-900/10 dark:border-red-900/20 dark:text-red-400 text-sm">
                    <span>{displayError}</span>
                </div>
            )}

            {step === 'phone' && (
                <>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                            Phone Number
                        </label>
                        <div className="flex gap-2">
                            <CountryCodeDropdown value={countryCode} onChange={setCountryCode} />
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                </div>
                                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && phone.length > 5 && !isLoading) {
                                            e.preventDefault();
                                            handleSendOtp();
                                        }
                                    }}
                                    placeholder="Phone number" className={INPUT_CLASS} />
                            </div>
                        </div>
                    </div>
                    <button type="button" onClick={handleSendOtp} disabled={isLoading || !phone}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200">
                        {firebaseOtp.sending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending OTP...</> : <><span>Send OTP</span> <ArrowRight className="ml-2 h-4 w-4" /></>}
                    </button>
                </>
            )}

            {step === 'otp' && (
                <>
                    <div>
                        <div className="flex flex-col items-center mb-6 mt-2">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h5 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Welcome back!</h5>
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                                Enter the 6-digit code sent to <span className="font-semibold text-slate-700 dark:text-slate-300">{countryCode}{phone}</span>
                            </p>
                        </div>
                        
                        <div className="mb-6">
                            <OtpInput 
                                value={otp} 
                                onChange={setOtp} 
                                onComplete={() => {
                                    // Give state a tiny tick to update before firing verify
                                    setTimeout(() => {
                                        if (!isLoading) handleVerifyOtp();
                                    }, 50);
                                }} 
                                disabled={isLoading} 
                            />
                        </div>
                    </div>
                    <button type="button" onClick={handleVerifyOtp} disabled={isLoading || otp.length < 6}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200">
                        {isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying...</> : <><span>Verify & Login</span> <ArrowRight className="ml-2 h-4 w-4" /></>}
                    </button>
                    <div className="flex items-center justify-between text-sm">
                        <button type="button" onClick={() => { setStep('phone'); setOtp(''); setLoginError(''); firebaseOtp.reset(); }}
                            className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition">
                            ← Change Number
                        </button>
                        <button type="button" onClick={() => { setOtp(''); firebaseOtp.resendOtp(); }} disabled={firebaseOtp.resendTimer > 0}
                            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition">
                            {firebaseOtp.resendTimer > 0 ? `Resend in ${firebaseOtp.resendTimer}s` : 'Resend OTP'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// ========================================================
// EMAIL LOGIN TAB (Company version)
// ========================================================

function EmailLoginTab() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
                const { role, company, onboarding_step } = data.data.user;
                if (role === 'ADMIN_SUPERVISOR') {
                    if (!company) router.push('/company/register?step=2');
                    else if (onboarding_step !== null && onboarding_step !== undefined) router.push(`/company/register?step=${onboarding_step + 1}`);
                    else router.push('/company/register?complete=true');
                } else {
                    router.push('/admin/dashboard');
                }
            } else {
                setError(data.message || 'Login failed');
            }
        } catch {
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
                    <label htmlFor="company-email" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                        Email Address
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-400" />
                        </div>
                        <input id="company-email" type="email" autoComplete="email" required value={email}
                            onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className={INPUT_CLASS} />
                    </div>
                </div>
                <div>
                    <label htmlFor="company-password" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                        Password
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input id="company-password" type="password" autoComplete="current-password" required value={password}
                            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={INPUT_CLASS} />
                    </div>
                </div>
                <button type="submit" disabled={loading}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing in...</> : <><span>Sign in</span><ArrowRight className="ml-2 h-4 w-4" /></>}
                </button>
            </form>
        </>
    );
}

// ========================================================
// MAIN COMPANY LOGIN PAGE
// ========================================================

export default function CompanyLoginPage() {
    const [activeTab, setActiveTab] = useState<'otp' | 'email'>('otp');

    return (
        <div className="min-h-screen flex bg-white dark:bg-slate-950">

            {/* Left Side: Brand & Visuals (Hidden on Mobile) */}
            <div className="hidden md:flex flex-1 bg-slate-900 dark:bg-slate-950 relative overflow-hidden flex-col justify-between p-12">
                <div className="absolute inset-0 opacity-10 z-0" style={{ background: 'radial-gradient(circle at 10% 20%, rgb(37, 99, 235) 0%, rgb(0, 0, 0) 90.2%)' }} />
                <div className="relative z-10">
                    <h6 className="text-white font-bold tracking-widest flex items-center gap-2 uppercase">
                        <span className="w-2 h-2 bg-blue-600 rounded-full inline-block" />
                        LCP Platform
                    </h6>
                </div>
                <div className="relative z-10 max-w-lg">
                    <h2 className="text-white font-extrabold text-5xl mb-6 leading-tight">
                        Company<br />
                        <span className="text-blue-500">Portal</span>
                    </h2>
                    <p className="text-slate-400 text-lg leading-relaxed mb-8">
                        Manage your workforce certifications, compliance, and training — all in one place.
                    </p>
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
                <div className="relative z-10">
                    <p className="text-slate-500 text-sm">Trusted by industry leaders across the globe.</p>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
                <div className="w-full max-w-xs sm:max-w-sm">
                    <div className="mb-8 flex justify-center">
                        <Image src="/assets/LCP_Logo.svg" alt="Labor Certification Platform" width={150} height={150} className="w-auto h-20" priority />
                    </div>
                    <div className="mb-6 text-center">
                        <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Company Login</h4>
                        <p className="text-slate-500 dark:text-slate-400">Sign in to manage your company</p>
                    </div>

                    {/* Tab Selector */}
                    <div className="flex mb-6 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button type="button" onClick={() => setActiveTab('otp')}
                            className={`flex-1 py-2 px-3 text-sm font-semibold rounded-md transition-all duration-200 ${activeTab === 'otp' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                            <span className="flex items-center justify-center gap-1.5"><Phone className="h-3.5 w-3.5" /> OTP Login</span>
                        </button>
                        <button type="button" onClick={() => setActiveTab('email')}
                            className={`flex-1 py-2 px-3 text-sm font-semibold rounded-md transition-all duration-200 ${activeTab === 'email' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                            <span className="flex items-center justify-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email / Password</span>
                        </button>
                    </div>

                    {activeTab === 'otp' ? <OtpLoginTab /> : <EmailLoginTab />}

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 dark:text-slate-500">or</span>
                        </div>
                    </div>

                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                        Don&apos;t have an account?{' '}
                        <Link href="/company/register" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors">
                            Register your company
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
