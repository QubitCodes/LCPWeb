/**
 * BetaBadge - A small "BETA" label badge used alongside nav items.
 * Reusable across nav and other UI elements.
 */
export default function BetaBadge() {
    return (
        <span className="ml-2 px-1.5 py-0.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded uppercase tracking-wider border border-blue-500/20">
            Beta
        </span>
    );
}
