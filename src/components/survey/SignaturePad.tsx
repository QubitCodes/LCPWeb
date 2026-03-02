'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Check, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
	/** Callback with base64 PNG data after signing */
	onSave: (base64: string) => void;
	/** Callback on cancel */
	onCancel: () => void;
	/** Whether the save is in progress */
	saving?: boolean;
	/** Canvas width */
	width?: number;
	/** Canvas height */
	height?: number;
}

/**
 * SignaturePad — HTML5 Canvas-based drawn signature component.
 * Supports mouse and touch input, clear/undo, and exports as base64 PNG.
 */
export default function SignaturePad({
	onSave,
	onCancel,
	saving = false,
	width = 500,
	height = 200,
}: SignaturePadProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [hasDrawn, setHasDrawn] = useState(false);

	/** Get canvas context */
	const getCtx = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return null;
		return canvas.getContext('2d');
	}, []);

	/** Initialize canvas */
	useEffect(() => {
		const ctx = getCtx();
		if (!ctx) return;
		const canvas = canvasRef.current!;

		// Set canvas resolution for retina
		const dpr = window.devicePixelRatio || 1;
		canvas.width = width * dpr;
		canvas.height = height * dpr;
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		ctx.scale(dpr, dpr);

		// Style
		ctx.strokeStyle = '#1e293b';
		ctx.lineWidth = 2;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

		// White background
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, width, height);

		// Signature line
		ctx.beginPath();
		ctx.strokeStyle = '#e2e8f0';
		ctx.lineWidth = 1;
		ctx.moveTo(20, height - 40);
		ctx.lineTo(width - 20, height - 40);
		ctx.stroke();

		// Label
		ctx.fillStyle = '#94a3b8';
		ctx.font = '11px Inter, system-ui, sans-serif';
		ctx.fillText('Sign above this line', 20, height - 24);

		// Reset stroke style for drawing
		ctx.strokeStyle = '#1e293b';
		ctx.lineWidth = 2;
	}, [getCtx, width, height]);

	/** Get position from mouse/touch event */
	const getPos = (e: React.MouseEvent | React.TouchEvent) => {
		const canvas = canvasRef.current;
		if (!canvas) return { x: 0, y: 0 };
		const rect = canvas.getBoundingClientRect();
		if ('touches' in e) {
			return {
				x: e.touches[0].clientX - rect.left,
				y: e.touches[0].clientY - rect.top,
			};
		}
		return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		};
	};

	/** Start drawing */
	const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
		e.preventDefault();
		const ctx = getCtx();
		if (!ctx) return;
		const pos = getPos(e);
		ctx.beginPath();
		ctx.moveTo(pos.x, pos.y);
		setIsDrawing(true);
	};

	/** Continue drawing */
	const draw = (e: React.MouseEvent | React.TouchEvent) => {
		if (!isDrawing) return;
		e.preventDefault();
		const ctx = getCtx();
		if (!ctx) return;
		const pos = getPos(e);
		ctx.lineTo(pos.x, pos.y);
		ctx.stroke();
		setHasDrawn(true);
	};

	/** Stop drawing */
	const stopDraw = () => {
		setIsDrawing(false);
	};

	/** Clear canvas */
	const clear = () => {
		const ctx = getCtx();
		if (!ctx || !canvasRef.current) return;
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, width, height);

		// Redraw signature line
		ctx.beginPath();
		ctx.strokeStyle = '#e2e8f0';
		ctx.lineWidth = 1;
		ctx.moveTo(20, height - 40);
		ctx.lineTo(width - 20, height - 40);
		ctx.stroke();

		ctx.fillStyle = '#94a3b8';
		ctx.font = '11px Inter, system-ui, sans-serif';
		ctx.fillText('Sign above this line', 20, height - 24);

		ctx.strokeStyle = '#1e293b';
		ctx.lineWidth = 2;

		setHasDrawn(false);
	};

	/** Export and save */
	const handleSave = () => {
		if (!hasDrawn || !canvasRef.current) return;
		const base64 = canvasRef.current.toDataURL('image/png');
		onSave(base64);
	};

	return (
		<div className="space-y-3">
			<div className="relative rounded-lg border-2 border-slate-300 dark:border-slate-600 overflow-hidden bg-white" style={{ width, maxWidth: '100%' }}>
				<canvas
					ref={canvasRef}
					className="cursor-crosshair touch-none"
					onMouseDown={startDraw}
					onMouseMove={draw}
					onMouseUp={stopDraw}
					onMouseLeave={stopDraw}
					onTouchStart={startDraw}
					onTouchMove={draw}
					onTouchEnd={stopDraw}
				/>
			</div>

			<div className="flex items-center justify-between">
				<button
					type="button"
					onClick={clear}
					className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
				>
					<RotateCcw className="w-3.5 h-3.5" />
					Clear
				</button>

				<div className="flex gap-2">
					<button
						type="button"
						onClick={onCancel}
						className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={!hasDrawn || saving}
						className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
					>
						<Check className="w-3.5 h-3.5" />
						{saving ? 'Saving...' : 'Confirm Signature'}
					</button>
				</div>
			</div>
		</div>
	);
}
