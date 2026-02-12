'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Default reference page — redirects to /reference/industries.
 */
export default function ReferenceIndexPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/settings/reference/industries');
    }, [router]);

    return null;
}
