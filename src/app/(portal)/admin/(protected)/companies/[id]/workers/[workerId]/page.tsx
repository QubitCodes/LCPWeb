'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Default worker profile page — redirects to /overview tab.
 */
export default function WorkerProfileRedirect() {
    const params = useParams();
    const router = useRouter();
    const companyId = params?.id as string;
    const workerId = params?.workerId as string;

    useEffect(() => {
        router.replace(`/admin/companies/${companyId}/workers/${workerId}/overview`);
    }, [companyId, workerId, router]);

    return null;
}
