'use client';

import { useEffect } from 'react';
import { useHeader } from '@/components/tailwind/HeaderContext';
import VerticalTabLayout from '@/components/tailwind/ui/VerticalTabLayout';
import type { VerticalTab } from '@/components/tailwind/ui/VerticalTabLayout';
import {
    Database,
    Shield,
    Sliders
} from 'lucide-react';

/**
 * Settings tab definitions.
 * Each tab maps to a child route under /tailwind/admin/settings/.
 */
const SETTINGS_TABS: VerticalTab[] = [
    {
        label: 'Reference Data',
        description: 'Industries, Categories & Skills',
        href: '/tailwind/admin/settings/reference',
        icon: Database
    },
    {
        label: 'General',
        description: 'Platform configuration',
        href: '/tailwind/admin/settings/general',
        icon: Sliders
    },
    {
        label: 'Security',
        description: 'Auth & session policies',
        href: '/tailwind/admin/settings/security',
        icon: Shield
    }
];

/**
 * Settings layout using the reusable VerticalTabLayout component.
 * Each tab has its own URL for deep-linking support.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const { setTitle, setActions } = useHeader();

    useEffect(() => {
        setTitle('Platform Settings');
        setActions(null);
    }, [setTitle, setActions]);

    return (
        <VerticalTabLayout tabs={SETTINGS_TABS} sectionTitle="Settings">
            {children}
        </VerticalTabLayout>
    );
}
