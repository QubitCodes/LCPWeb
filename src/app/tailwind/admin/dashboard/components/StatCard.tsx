import { ArrowUpRight, ArrowDownRight, Activity, LucideIcon } from 'lucide-react';

interface StatCardProps {
    /** Card title label */
    title: string;
    /** Numeric or string value to display */
    value: string | number;
    /** Lucide icon component */
    icon: LucideIcon;
    /** Tailwind background color class for the icon container (e.g. 'bg-blue-600') */
    color: string;
    /** Optional trend direction indicator */
    trend?: 'up' | 'down';
}

/**
 * StatCard - A dashboard statistics card displaying
 * a metric with an icon, value, and trend indicator.
 */
export default function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
    return (
        <div className="bg-white dark:bg-slate-900 overflow-hidden shadow-sm rounded-xl border border-slate-200 dark:border-slate-800 transition-all hover:shadow-md flex flex-col w-full h-full">
            <div className="p-5 flex-1">
                <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
                        <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="ml-5 min-w-0 flex-1">
                        <dl>
                            <dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{title}</dt>
                            <dd>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white truncate">{value}</div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 mt-auto">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1 min-w-0 truncate">
                        {trend === 'up' ? (
                            <span className="text-green-600 flex items-center shrink-0">
                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                +12%
                            </span>
                        ) : trend === 'down' ? (
                            <span className="text-red-500 flex items-center shrink-0">
                                <ArrowDownRight className="w-3 h-3 mr-1" />
                                -2%
                            </span>
                        ) : (
                            <span className="text-slate-400 flex items-center shrink-0">
                                <Activity className="w-3 h-3 mr-1" />
                                Stable
                            </span>
                        )}
                        <span className="ml-1 opacity-75 truncate hidden sm:inline">from last month</span>
                    </span>
                    <button className="text-blue-600 hover:text-blue-500 cursor-pointer hover:underline shrink-0 ml-2">View</button>
                </div>
            </div>
        </div>
    );
}
