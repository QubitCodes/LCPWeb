'use client';

import { useState } from 'react';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    isLoading?: boolean;
    searchable?: boolean;
    onSearch?: (term: string) => void;
    pagination?: {
        pageIndex: number; // 0-indexed
        pageSize: number;
        totalCount: number;
        pageCount: number;
        onPageChange: (page: number) => void;
    };
}

export function DataTable<TData, TValue>({
    columns,
    data,
    isLoading = false,
    searchable = false,
    onSearch,
    pagination,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
        manualPagination: true, // We handle pagination server-side
        manualSorting: false,   // Client-side sorting for current page (or can be server-side)
    });

    // Handle search input debounce
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (onSearch) {
            // Debounce could be added here or in the parent
            onSearch(value);
        }
    };

    return (
        <div className="w-full space-y-4">
            {/* Toolbar */}
            {searchable && (
                <div className="flex items-center justify-between">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <input
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Search..."
                            className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 pl-9 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 dark:placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 dark:text-white"
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <th
                                                key={header.id}
                                                className="px-4 py-3 align-middle font-semibold whitespace-nowrap"
                                                style={{ width: header.column.getSize() }}
                                            >
                                                {header.isPlaceholder ? null : (
                                                    <div
                                                        className={
                                                            header.column.getCanSort()
                                                                ? 'cursor-pointer select-none flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transaction-colors'
                                                                : ''
                                                        }
                                                        onClick={header.column.getToggleSortingHandler()}
                                                    >
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                        {{
                                                            asc: <ChevronUp className="w-4 h-4" />,
                                                            desc: <ChevronDown className="w-4 h-4" />,
                                                        }[header.column.getIsSorted() as string] ??
                                                            (header.column.getCanSort() ? (
                                                                <ChevronsUpDown className="w-4 h-4 opacity-50" />
                                                            ) : null)}
                                                    </div>
                                                )}
                                            </th>
                                        );
                                    })}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length} className="h-24 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                            <span className="ml-2 text-slate-500 dark:text-slate-400">Loading data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="h-24 text-center text-slate-500 dark:text-slate-400">
                                        No results found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            Showing <span className="font-medium text-slate-900 dark:text-white">{Math.min(pagination.pageIndex * pagination.pageSize + 1, pagination.totalCount)}</span> to{' '}
                            <span className="font-medium text-slate-900 dark:text-white">{Math.min((pagination.pageIndex + 1) * pagination.pageSize, pagination.totalCount)}</span> of{' '}
                            <span className="font-medium text-slate-900 dark:text-white">{pagination.totalCount}</span> results
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                className="p-1 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                onClick={() => pagination.onPageChange(pagination.pageIndex - 1)}
                                disabled={pagination.pageIndex === 0 || isLoading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                Page {pagination.pageIndex + 1} of {pagination.pageCount}
                            </div>
                            <button
                                className="p-1 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
                                disabled={pagination.pageIndex >= pagination.pageCount - 1 || isLoading}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
