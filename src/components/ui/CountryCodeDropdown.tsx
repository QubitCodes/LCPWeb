import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Loader2 } from 'lucide-react';

interface CountryCodeDropdownProps {
    value: string;
    onChange: (value: string) => void;
}

export function CountryCodeDropdown({ value, onChange }: CountryCodeDropdownProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [countries, setCountries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const res = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,idd,flag');
                const data = await res.json();

                const formatted = data
                    .filter((c: any) => c.idd?.root)
                    .map((c: any) => ({
                        name: c.name.common,
                        code: c.cca2,
                        dialCode: c.idd.root + (c.idd.suffixes?.[0] || ''),
                        flag: c.flag || '🏳️',
                    }))
                    .sort((a: any, b: any) => a.name.localeCompare(b.name));

                const india = formatted.find((c: any) => c.code === 'IN');
                const uae = formatted.find((c: any) => c.code === 'AE');
                const rest = formatted.filter((c: any) => c.code !== 'IN' && c.code !== 'AE');

                const pinned = [];
                if (india) pinned.push(india);
                if (uae) pinned.push(uae);

                setCountries([...pinned, ...rest]);
            } catch (err) {
                console.error('Failed to fetch countries:', err);
                setCountries([
                    { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
                    { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchCountries();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (open && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [open]);

    const selected = countries.find(c => c.dialCode === value);
    const filtered = search
        ? countries.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.dialCode.includes(search)
        )
        : countries;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition min-w-[110px] h-10"
            >
                {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                ) : (
                    <>
                        <span className="text-base">{selected?.flag || '🌐'}</span>
                        <span className="font-medium">{value}</span>
                    </>
                )}
                <ChevronDown className="h-3 w-3 text-slate-400 ml-auto" />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search country..."
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
                            />
                        </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto">
                        {filtered.length === 0 && (
                            <p className="p-3 text-sm text-slate-400 text-center">No countries found</p>
                        )}
                        {filtered.map((c, i) => (
                            <button
                                key={`${c.code}-${i}`}
                                type="button"
                                onClick={() => {
                                    onChange(c.dialCode);
                                    setOpen(false);
                                    setSearch('');
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition ${value === c.dialCode ? 'bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}
                            >
                                <span className="text-base w-6 text-center">{c.flag}</span>
                                <span className="flex-1 truncate">{c.name}</span>
                                <span className="text-slate-400 dark:text-slate-500 text-xs font-mono">{c.dialCode}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
