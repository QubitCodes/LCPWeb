'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WORKFLOWS_DATA, WorkflowNode, WorkflowStep, WorkflowSection } from '@/lib/workflows-data';
import { ChevronRight, Folder, GitMerge, CheckCircle, ArrowDown, ChevronDown } from 'lucide-react';

export default function WorkflowExplorer() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Array of active selected node IDs per level initialized from URL
	const [selectedPaths, setSelectedPaths] = useState<string[]>(() => {
		const pathParam = searchParams.get('path');
		return pathParam ? pathParam.split(',') : [];
	});

	// Expanded sections state initialized from URL
	const [expandedSections, setExpandedSections] = useState<string[]>(() => {
		const secParam = searchParams.get('expanded');
		return secParam ? secParam.split(',') : [];
	});

	// Sync state when URL changes (e.g., back/forward buttons)
	useEffect(() => {
		const pathParam = searchParams.get('path');
		if (pathParam) {
			setSelectedPaths(pathParam.split(','));
		} else {
			setSelectedPaths([]);
		}

		const secParam = searchParams.get('expanded');
		if (secParam) {
			setExpandedSections(secParam.split(','));
		} else {
			setExpandedSections([]);
		}
	}, [searchParams]);

	// Calculate the columns to render based on selection
	const columns: { nodes: WorkflowNode[]; sections?: WorkflowSection[]; selectedId?: string; renderType: 'list' | 'flowchart' }[] = [{
		nodes: WORKFLOWS_DATA,
		selectedId: selectedPaths[0],
		renderType: 'list'
	}];

	let currentLevelNodes = WORKFLOWS_DATA;
	for (let i = 0; i < selectedPaths.length; i++) {
		const selectedId = selectedPaths[i];
		const node = currentLevelNodes.find(n => n.id === selectedId);

		if (node) {
			if (node.children && node.children.length > 0) {
				currentLevelNodes = node.children;
				columns.push({
					nodes: currentLevelNodes,
					selectedId: selectedPaths[i + 1],
					renderType: node.renderChildrenAs || 'list'
				});
			} else if (node.sections && node.sections.length > 0) {
				const allSectionItems = node.sections.flatMap(s => s.items);
				currentLevelNodes = allSectionItems;
				columns.push({
					nodes: allSectionItems,
					sections: node.sections,
					selectedId: selectedPaths[i + 1],
					renderType: 'list'
				});
			}
		}
	}

	// Ensure right-most selected node renders its steps (if it's a workflow)
	const lastSelectedId = selectedPaths[selectedPaths.length - 1];
	let workflowToRender: WorkflowNode | undefined;

	const findNode = (nodes: WorkflowNode[], id: string): WorkflowNode | undefined => {
		for (const node of nodes) {
			if (node.id === id) return node;
			if (node.children) {
				const found = findNode(node.children, id);
				if (found) return found;
			}
			if (node.sections) {
				const allItems = node.sections.flatMap(s => s.items);
				const found = findNode(allItems, id);
				if (found) return found;
			}
		}
		return undefined;
	};

	if (lastSelectedId) {
		const node = findNode(WORKFLOWS_DATA, lastSelectedId);
		if (node?.type === 'workflow') {
			workflowToRender = node;
		}
	}

	const handleSelect = (levelIndex: number, nodeId: string) => {
		const newPaths = [...selectedPaths.slice(0, levelIndex), nodeId];
		setSelectedPaths(newPaths);

		// Update URL without modifying history strictly or scrolling
		const params = new URLSearchParams(searchParams.toString());
		params.set('path', newPaths.join(','));
		router.push(`?${params.toString()}`, { scroll: false });
	};

	const toggleSection = (sectionId: string) => {
		let newExpanded = [...expandedSections];

		// By default if no sections are expanded, the UI auto-expanded the first one.
		// If the user clicks the first section while newExpanded is empty, we must explicitly record that it's now collapsed (by adding a dummy value or tracking explicitly).
		// A cleaner way is to strictly populate expandedSections on initial load to avoid "implicit expansion" issues, or use a 'none' token.
		if (newExpanded.includes(sectionId)) {
			newExpanded = newExpanded.filter(id => id !== sectionId);
			if (newExpanded.length === 0) newExpanded.push('none'); // Prevent auto-expand logic from kicking back in
		} else {
			newExpanded = newExpanded.filter(id => id !== 'none'); // Remove dummy token
			newExpanded.push(sectionId);
		}
		setExpandedSections(newExpanded);

		const params = new URLSearchParams(searchParams.toString());
		if (newExpanded.length > 0) {
			params.set('expanded', newExpanded.join(','));
		} else {
			params.delete('expanded');
		}
		router.push(`?${params.toString()}`, { scroll: false });
	};

	return (
		<div className="flex flex-1 overflow-x-auto h-full p-4 gap-4">
			{/* Directory Panes */}
			{columns.map((col, idx) => (
				<Pane
					key={idx}
					level={idx}
					nodes={col.nodes}
					sections={col.sections}
					selectedId={col.selectedId}
					renderType={col.renderType}
					expandedSections={expandedSections}
					onToggleSection={toggleSection}
					onSelect={handleSelect}
				/>
			))}

			{/* Workflow Steps Pane */}
			{workflowToRender && workflowToRender.steps && (
				<WorkflowStepsPane workflow={workflowToRender} />
			)}
		</div>
	);
}

// Fixed-width pane component mimicking finder column
function Pane({ level, nodes, sections, selectedId, renderType, expandedSections, onToggleSection, onSelect }: { level: number, nodes: WorkflowNode[], sections?: WorkflowSection[], selectedId?: string, renderType: 'list' | 'flowchart', expandedSections: string[], onToggleSection: (id: string) => void, onSelect: (l: number, id: string) => void }) {
	return (
		<div className="w-72 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col overflow-hidden">
			<div className="flex-1 overflow-y-auto p-3 hidden-scrollbar space-y-3">
				{sections ? (
					sections.map((section, sidx) => {
						// It's expanded if it's in the array, OR if the array is perfectly empty and it's the first item. (If array has 'none', it won't auto-expand)
						const isExpanded = expandedSections.includes(section.id) || (expandedSections.length === 0 && sidx === 0);
						return (
							<div key={section.id} className="flex flex-col">
								<button
									onClick={() => onToggleSection(section.id)}
									className="flex items-center justify-between px-2 py-2 mb-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full text-left"
								>
									<span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
										{section.label}
									</span>
									{isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
								</button>

								{isExpanded && (
									<div className="flex flex-col px-1">
										<RenderNodes level={level} nodes={section.items} selectedId={selectedId} renderType={section.renderAs || 'list'} onSelect={onSelect} />
									</div>
								)}
							</div>
						);
					})
				) : (
					<div className="flex flex-col">
						<RenderNodes level={level} nodes={nodes} selectedId={selectedId} renderType={renderType} onSelect={onSelect} />
					</div>
				)}
			</div>
			{/* Custom CSS to hide scrollbar but allow scrolling */}
			<style dangerouslySetInnerHTML={{
				__html: `
        .hidden-scrollbar::-webkit-scrollbar { display: none; }
        .hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
		</div>
	);
}

function RenderNodes({ level, nodes, selectedId, renderType, onSelect }: { level: number, nodes: WorkflowNode[], selectedId?: string, renderType: 'list' | 'flowchart', onSelect: (level: number, id: string) => void }) {
	return (
		<>
			{nodes.map((node, idx) => {
				const isSelected = selectedId === node.id;

				if (renderType === 'flowchart') {
					return (
						<React.Fragment key={node.id}>
							<button
								onClick={() => onSelect(level, node.id)}
								className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors border-2 shadow-sm ${isSelected
									? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
									: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 text-gray-800 dark:text-gray-200'
									}`}
							>
								<GitMerge className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
								<span className="flex-1 text-sm font-medium whitespace-normal leading-snug">{node.label}</span>
								<ChevronRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
							</button>

							{idx < nodes.length - 1 && (
								<div className="flex flex-col items-center py-1.5 opacity-60">
									<div className="w-0.5 h-4 bg-gray-400 dark:bg-gray-500"></div>
									<ArrowDown className="w-4 h-4 text-gray-400 dark:text-gray-500 -mt-1" />
								</div>
							)}
						</React.Fragment>
					);
				}

				return (
					<button
						key={node.id}
						onClick={() => onSelect(level, node.id)}
						className={`w-full text-left px-3 py-2.5 rounded-md flex items-center gap-3 transition-colors mb-1 ${isSelected
							? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
							: 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
							}`}
					>
						{node.type === 'category' ? <Folder className="w-4 h-4 text-blue-500" /> : <GitMerge className="w-4 h-4 text-purple-500" />}
						<span className="flex-1 truncate text-sm">{node.label}</span>
						<ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
					</button>
				)
			})}
		</>
	);
}

// Right-most Workflow rendering pane (Reuses same structure as Pane)
function WorkflowStepsPane({ workflow }: { workflow: WorkflowNode }) {
	if (!workflow.steps) return null;

	return (
		<div className="w-72 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col overflow-hidden">
			<div className="flex-1 overflow-y-auto p-3 hidden-scrollbar space-y-3">
				<div className="flex flex-col">
					<button className="flex items-center justify-between px-2 py-2 mb-2 rounded w-full text-left cursor-default">
						<span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
							{workflow.label} - Execution Flow
						</span>
						<ChevronDown className="w-4 h-4 text-gray-400" />
					</button>

					<div className="flex flex-col px-1">
						{workflow.steps.map((step, idx) => (
							<React.Fragment key={step.id}>
								<div className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors border-2 shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700`}>
									<CheckCircle className={`w-5 h-5 flex-shrink-0 text-blue-500`} />
									<div className="flex flex-col flex-1">
										<span className="text-sm font-medium whitespace-normal leading-snug text-gray-800 dark:text-gray-200">
											{step.label}
										</span>
										{step.isOptional && <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">Optional</span>}
									</div>
								</div>

								{idx < workflow.steps!.length - 1 && (
									<div className="flex flex-col items-center py-1.5 opacity-60">
										<div className="w-0.5 h-4 bg-gray-400 dark:bg-gray-500"></div>
										<ArrowDown className="w-4 h-4 text-gray-400 dark:text-gray-500 -mt-1" />
									</div>
								)}
							</React.Fragment>
						))}
					</div>
				</div>
			</div>
			{/* Custom CSS to hide scrollbar but allow scrolling */}
			<style dangerouslySetInnerHTML={{
				__html: `
        .hidden-scrollbar::-webkit-scrollbar { display: none; }
        .hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
		</div>
	);
}
