'use client';

import { useEffect } from 'react';
import { useHeader } from '@/components/HeaderContext';
import VerticalTabLayout from '@/components/ui/VerticalTabLayout';
import type { VerticalTabGroup } from '@/components/ui/VerticalTabLayout';
import {
    Database,
    Shield,
    Sliders,
    Wrench
} from 'lucide-react';

/**
 * Settings tab definitions grouped by section.
 */
const SETTINGS_GROUPS: VerticalTabGroup[] = [
    {
        title: 'Settings',
        tabs: [
            {
                label: 'General',
                description: 'Platform configuration',
                href: '/admin/settings/general',
                icon: Sliders
            },
            {
                label: 'Security',
                description: 'Auth & session policies',
                href: '/admin/settings/security',
                icon: Shield
            }
        ]
    },
    {
        title: 'Reference Data',
        tabs: [
            {
                label: 'Industries',
                description: 'Manage industries & stages',
                href: '/admin/settings/reference/industries',
                icon: Database
            },
            {
                label: 'Skills',
                description: 'Manage worker skills',
                href: '/admin/settings/reference/skills',
                icon: Wrench
            }
        ]
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
        <VerticalTabLayout tabGroups={SETTINGS_GROUPS}>
            {children}
        </VerticalTabLayout>
    );
}
