'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileSidebar from '@/components/MobileSidebar';
import { HeaderProvider } from '@/components/HeaderContext';
import Header from '@/components/Header';
import { AlertProvider } from '@/components/ui/AlertDialog';
import { ToastProvider } from '@/components/ui/Toast';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [role, setRole] = useState<string>('');
    const [userName, setUserName] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setRole(user.role);
            setUserName(`${user.first_name} ${user.last_name}`);
        } else {
            // Optional: Redirect to login if not found (handled by middleware ideally)
            router.push('/admin/login');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/admin/login');
    };

    if (!isClient) return null; // Prevent hydration mismatch

    return (
        <ToastProvider position="top-right">
            <AlertProvider>
                <HeaderProvider>
                    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
                        <Sidebar role={role} userName={userName} onLogout={handleLogout} />
                        <MobileSidebar role={role} userName={userName} onLogout={handleLogout} />

                        <main className="flex-1 md:ml-64 transition-all duration-300 flex flex-col">
                            <Header />
                            <div className="p-6 md:p-8 flex-1 w-full max-w-[1600px] mx-auto">
                                {children}
                            </div>
                        </main>
                    </div>
                </HeaderProvider>
            </AlertProvider>
        </ToastProvider>
    );
}

