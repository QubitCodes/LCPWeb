'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface HeaderContextType {
    title: string;
    setTitle: (title: string) => void;
    actions: ReactNode | null;
    setActions: (actions: ReactNode | null) => void;
    showHeader: boolean;
    setShowHeader: (show: boolean) => void;
    isMobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
    const [title, setTitle] = useState('');
    const [actions, setActions] = useState<ReactNode | null>(null);
    const [showHeader, setShowHeader] = useState(true);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <HeaderContext.Provider value={{
            title, setTitle,
            actions, setActions,
            showHeader, setShowHeader,
            isMobileMenuOpen, setMobileMenuOpen
        }}>
            {children}
        </HeaderContext.Provider>
    );
}

export function useHeader() {
    const context = useContext(HeaderContext);
    if (context === undefined) {
        throw new Error('useHeader must be used within a HeaderProvider');
    }
    return context;
}
