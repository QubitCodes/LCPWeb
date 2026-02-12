'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Default course detail page — redirects to first level.
 * Fetches the course to determine the first level ID, then redirects.
 */
export default function CourseDetailRedirect() {
    const params = useParams();
    const router = useRouter();
    const courseId = params?.id as string;

    useEffect(() => {
        const redirect = async () => {
            try {
                const res = await fetch(`/api/v1/courses/${courseId}`);
                const json = await res.json();
                if (json.status && json.data?.levels?.length > 0) {
                    router.replace(`/tailwind/admin/courses/${courseId}/${json.data.levels[0].id}`);
                }
            } catch (err) {
                console.error('Failed to redirect:', err);
            }
        };
        if (courseId) redirect();
    }, [courseId, router]);

    return (
        <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );
}
