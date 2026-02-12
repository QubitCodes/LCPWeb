'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
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

                // Slight delay to show success state
                setTimeout(() => {
                    if (['ADMIN', 'SUPER_ADMIN'].includes(data.data.user.role)) {
                        router.push('/admin/dashboard');
                    } else {
                        router.push('/admin/dashboard'); // Fallback
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
                        Streamline certifications, manage compliance, and elevate your team's skills with our comprehensive management solution.
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

                    <div className="mb-8 text-center">
                        <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                            Welcome back
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400">
                            Please enter your details to sign in
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg flex items-center dark:bg-red-900/10 dark:border-red-900/20 dark:text-red-400">
                            <span className="block sm:inline">{error}</span>
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
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-500 dark:text-white dark:focus:bg-slate-900"
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
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-500 dark:text-white dark:focus:bg-slate-900"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px active:translate-y-0 shadow-blue-500/20 hover:shadow-blue-500/40"
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
                </div>
            </div>
        </div>
    );
}
