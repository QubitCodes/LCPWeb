'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHeader } from '@/components/HeaderContext';
import VerticalTabLayout from '@/components/ui/VerticalTabLayout';
import type { VerticalTab } from '@/components/ui/VerticalTabLayout';
import { User, GraduationCap, Award, ArrowLeft } from 'lucide-react';

/**
 * Worker profile layout — vertical sidebar with Overview, Enrollments, Certificates tabs.
 * Routes: /admin/companies/[id]/workers/[workerId]/overview|enrollments|certificates
 */
export default function WorkerProfileLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const router = useRouter();
    const { setTitle, setActions } = useHeader();

    const companyId = params?.id as string;
    const workerId = params?.workerId as string;
    const basePath = `/admin/companies/${companyId}/workers/${workerId}`;

    /** Define vertical tabs */
    const tabs: VerticalTab[] = [
        {
            label: 'Overview',
            description: 'Personal details',
            icon: User,
            href: `${basePath}/overview`
        },
        {
            label: 'Enrollments',
            description: 'Courses & progress',
            icon: GraduationCap,
            href: `${basePath}/enrollments`
        },
        {
            label: 'Certificates',
            description: 'Earned credentials',
            icon: Award,
            href: `${basePath}/certificates`
        }
    ];

    useEffect(() => {
        setTitle('Worker Profile');
        setActions(
            <button
                onClick={() => router.push(`/admin/companies/${companyId}/people?tab=workers`)}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Workers
            </button>
        );
    }, [setTitle, setActions, companyId, router]);

    return (
        <VerticalTabLayout tabs={tabs} sectionTitle="Worker Profile">
            {children}
        </VerticalTabLayout>
    );
}
