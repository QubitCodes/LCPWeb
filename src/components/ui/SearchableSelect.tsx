'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';

/**
 * Option shape for SearchableSelect.
 */
export interface SelectOption {
	/** The value stored when this option is selected */
	value: string;
	/** The label displayed to the user */
	label: string;
	/** Optional icon component */
	icon?: React.ComponentType<{ className?: string }>;
}

interface SearchableSelectProps {
	/** Currently selected value */
	value: string;
	/** Available options */
	options: SelectOption[];
	/** Callback when an option is selected */
	onChange: (value: string) => void;
	/** Placeholder text when nothing is selected */
	placeholder?: string;
	/** Disabled state */
	disabled?: boolean;
	/** Additional wrapper className */
	className?: string;
	/** Size variant */
	size?: 'sm' | 'md';
}

/**
 * SearchableSelect — A custom dropdown with inline search filtering.
 * Uses a portal to render the dropdown so it floats above all content
 * regardless of parent overflow constraints.
 */
export default function SearchableSelect({
	value,
	options,
	onChange,
	placeholder = 'Select...',
	disabled = false,
	className = '',
	size = 'md',
}: SearchableSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState('');
	const [highlightIdx, setHighlightIdx] = useState(0);
	const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

	const triggerRef = useRef<HTMLButtonElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	/** Find the currently selected option label */
	const selectedOption = options.find(o => o.value === value);

	/** Filter options by search term */
	const filtered = search.trim()
		? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
		: options;

	/** Calculate dropdown position based on trigger button */
	const updatePosition = useCallback(() => {
		if (!triggerRef.current) return;
		const rect = triggerRef.current.getBoundingClientRect();
		setDropdownPos({
			top: rect.bottom + 4,
			left: rect.left,
			width: Math.max(rect.width, 200),
		});
	}, []);

	/** Open dropdown */
	const open = () => {
		if (disabled) return;
		updatePosition();
		setIsOpen(true);
		setSearch('');
		setHighlightIdx(0);
		// Focus the search input after render
		requestAnimationFrame(() => inputRef.current?.focus());
	};

	/** Close dropdown */
	const close = () => {
		setIsOpen(false);
		setSearch('');
	};

	/** Select an option and close */
	const select = (val: string) => {
		onChange(val);
		close();
	};

	/** Handle keyboard navigation */
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) {
			if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
				e.preventDefault();
				open();
			}
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setHighlightIdx(prev => Math.min(prev + 1, filtered.length - 1));
				break;
			case 'ArrowUp':
				e.preventDefault();
				setHighlightIdx(prev => Math.max(prev - 1, 0));
				break;
			case 'Enter':
				e.preventDefault();
				if (filtered[highlightIdx]) select(filtered[highlightIdx].value);
				break;
			case 'Escape':
				e.preventDefault();
				close();
				break;
		}
	};

	/** Scroll highlighted item into view */
	useEffect(() => {
		if (!isOpen || !listRef.current) return;
		const items = listRef.current.children;
		if (items[highlightIdx]) {
			(items[highlightIdx] as HTMLElement).scrollIntoView({ block: 'nearest' });
		}
	}, [highlightIdx, isOpen]);

	/** Close on outside click (check both trigger and portal dropdown) */
	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			const target = e.target as Node;
			if (
				triggerRef.current && !triggerRef.current.contains(target) &&
				dropdownRef.current && !dropdownRef.current.contains(target)
			) {
				close();
			}
		};
		if (isOpen) document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [isOpen]);

	/** Reposition on scroll / resize while open */
	useEffect(() => {
		if (!isOpen) return;
		const reposition = () => updatePosition();
		window.addEventListener('scroll', reposition, true);
		window.addEventListener('resize', reposition);
		return () => {
			window.removeEventListener('scroll', reposition, true);
			window.removeEventListener('resize', reposition);
		};
	}, [isOpen, updatePosition]);

	/** Reset highlight when search changes */
	useEffect(() => {
		setHighlightIdx(0);
	}, [search]);

	const sizeClasses = size === 'sm'
		? 'px-2 py-1 text-xs'
		: 'px-3 py-2 text-sm';

	const IconComponent = selectedOption?.icon;

	return (
		<div className={`relative ${className}`} onKeyDown={handleKeyDown}>
			{/* Trigger button */}
			<button
				ref={triggerRef}
				type="button"
				onClick={() => isOpen ? close() : open()}
				disabled={disabled}
				className={`w-full flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${sizeClasses} focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-colors`}
			>
				{IconComponent && <IconComponent className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
				<span className={`flex-1 text-left truncate ${!selectedOption ? 'text-slate-400' : ''}`}>
					{selectedOption?.label || placeholder}
				</span>
				<ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
			</button>

			{/* Dropdown panel — rendered via portal so it floats above everything */}
			{isOpen && createPortal(
				<div
					ref={dropdownRef}
					className="fixed z-[35] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden"
					style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
				>
					{/* Search input */}
					<div className="p-2 border-b border-slate-100 dark:border-slate-700">
						<div className="relative">
							<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
							<input
								ref={inputRef}
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search..."
								className="w-full pl-8 pr-3 py-1.5 text-sm rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
					</div>

					{/* Options list */}
					<div ref={listRef} className="max-h-48 overflow-y-auto py-1">
						{filtered.length === 0 ? (
							<div className="px-3 py-2 text-sm text-slate-400 text-center">No results</div>
						) : (
							filtered.map((opt, idx) => {
								const isSelected = opt.value === value;
								const isHighlighted = idx === highlightIdx;
								const OptIcon = opt.icon;

								return (
									<button
										key={opt.value}
										type="button"
										onClick={() => select(opt.value)}
										onMouseEnter={() => setHighlightIdx(idx)}
										className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors ${isHighlighted
											? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
											: 'text-slate-700 dark:text-slate-300'
											} ${isSelected ? 'font-medium' : ''}`}
									>
										{OptIcon && <OptIcon className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />}
										<span className="flex-1 truncate">{opt.label}</span>
										{isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
									</button>
								);
							})
						)}
					</div>
				</div>,
				document.body
			)}
		</div>
	);
}
