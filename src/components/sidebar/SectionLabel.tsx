interface SectionLabelProps {
    /** The label text to display */
    label: string;
    /** Optional extra Tailwind classes for spacing (e.g. 'mt-6') */
    className?: string;
}

/**
 * SectionLabel - A small uppercase heading used to separate
 * groups of nav items in the sidebar (e.g. "Control Center", "Settings").
 */
export default function SectionLabel({ label, className = '' }: SectionLabelProps) {
    return (
        <div className={`px-5 mb-3 ${className}`}>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {label}
            </h3>
        </div>
    );
}
