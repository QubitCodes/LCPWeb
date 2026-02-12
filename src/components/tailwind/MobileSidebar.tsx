'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useHeader } from '@/components/tailwind/HeaderContext';
import SidebarContent from '@/components/tailwind/SidebarContent';

interface MobileSidebarProps {
    role: string;
    userName: string;
    onLogout: () => void;
}

export default function MobileSidebar({ role, userName, onLogout }: MobileSidebarProps) {
    const { isMobileMenuOpen, setMobileMenuOpen } = useHeader();
    const pathname = usePathname();

    // Close on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname, setMobileMenuOpen]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            if (!document.body.style.overflow) document.body.removeAttribute('style');
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    return (
        <div className={`fixed inset-0 z-[60] md:hidden pointer-events-none ${isMobileMenuOpen ? 'pointer-events-auto' : ''}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <div
                className={`absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="relative h-full flex flex-col">
                    {/* Reuse SidebarContent but pass close handler */}
                    <SidebarContent
                        role={role}
                        userName={userName}
                        onLogout={onLogout}
                        onClose={() => setMobileMenuOpen(false)}
                    />
                </div>
            </div>
        </div>
    );
}
