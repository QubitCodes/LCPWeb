'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useHeader } from '@/components/tailwind/HeaderContext';
import VerticalTabLayout from '@/components/tailwind/ui/VerticalTabLayout';
import type { VerticalTab } from '@/components/tailwind/ui/VerticalTabLayout';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';

/**
 * Course level shape.
 */
interface CourseLevel {
    id: string;
    level_number: number;
    title: string;
}

/**
 * Course shape.
 */
interface Course {
    id: string;
    title: string;
    levels: CourseLevel[];
}

/**
 * Course detail layout — vertical sidebar with tabs per level.
 * Routes: /tailwind/admin/courses/[id]/[levelId]
 */
export default function CourseDetailLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const router = useRouter();
    const { setTitle, setActions } = useHeader();
    const courseId = params?.id as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);

    /** Fetch course data */
    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await fetch(`/api/v1/courses/${courseId}`);
                const json = await res.json();
                if (json.status) {
                    setCourse(json.data);
                }
            } catch (err) {
                console.error('Failed to fetch course:', err);
            } finally {
                setLoading(false);
            }
        };
        if (courseId) fetchCourse();
    }, [courseId]);

    /** Set header */
    useEffect(() => {
        setTitle(course ? course.title : 'Course Details');
        setActions(
            <button
                onClick={() => router.push('/tailwind/admin/jobs')}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Jobs / Courses
            </button>
        );
    }, [setTitle, setActions, course, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">Course not found</h3>
            </div>
        );
    }

    /** Build level tabs dynamically */
    const tabs: VerticalTab[] = course.levels.map((lvl) => ({
        label: `Level ${lvl.level_number}`,
        description: lvl.title,
        icon: BookOpen,
        href: `/tailwind/admin/courses/${courseId}/${lvl.id}`
    }));

    return (
        <VerticalTabLayout tabs={tabs} sectionTitle="Course Levels">
            {children}
        </VerticalTabLayout>
    );
}
