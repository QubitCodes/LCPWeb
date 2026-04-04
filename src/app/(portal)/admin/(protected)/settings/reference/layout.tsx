'use client';

/**
 * Reference data layout.
 * Navigation is now handled exclusively through the platform settings sidebar.
 */
export default function ReferenceLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="space-y-6">
            {children}
        </div>
    );
}
