import React, { useRef, useState, useEffect } from 'react';
import { Block, DrawingStroke } from '../../../types/notebook';
import {
  PenTool,
  Highlighter,
  Eraser,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DrawingBlockProps {
  block: Block;
  onUpdate: (content: string, metadata?: any) => void;
  onDeleteBlock?: () => void;
}

const COLORS = [
  '#0F172A', // Dark Slate
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#E11D48', // Rose
  '#D97706', // Amber
  '#0284C7', // Sky
  '#7C3AED', // Violet
];

export const DrawingBlock: React.FC<DrawingBlockProps> = ({ block, onUpdate, onDeleteBlock }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'brush' | 'highlighter' | 'eraser'>('brush');
  const [selectedColor, setSelectedColor] = useState('#4F46E5');
  const [lineWidth, setLineWidth] = useState(3);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Stored strokes
  const [strokes, setStrokes] = useState<DrawingStroke[]>(
    block.metadata?.drawingData?.strokes || []
  );

  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);

  // Redraw all strokes onto canvas
  const redraw = (allStrokes: DrawingStroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of allStrokes) {
      if (stroke.points.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.mode === 'eraser') {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = stroke.width * 2;
        ctx.globalAlpha = 1.0;
      } else if (stroke.mode === 'highlighter') {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width * 3;
        ctx.globalAlpha = 0.35;
      } else {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.globalAlpha = 1.0;
      }

      ctx.stroke();
    }
  };

  useEffect(() => {
    redraw(strokes);
  }, [strokes]);

  const saveCanvasData = (newStrokes: DrawingStroke[]) => {
    setStrokes(newStrokes);
    const canvas = canvasRef.current;
    const previewUrl = canvas ? canvas.toDataURL('image/png') : undefined;

    onUpdate(block.content || 'Drawing Canvas', {
      ...block.metadata,
      drawingData: {
        strokes: newStrokes,
        previewUrl,
      },
    });
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    currentStrokeRef.current = [coords];
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    currentStrokeRef.current.push(coords);

    // Live draw segment
    const points = currentStrokeRef.current;
    if (points.length >= 2) {
      const p1 = points[points.length - 2];
      const p2 = points[points.length - 1];

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (currentTool === 'eraser') {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = lineWidth * 2.5;
        ctx.globalAlpha = 1.0;
      } else if (currentTool === 'highlighter') {
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = lineWidth * 3.5;
        ctx.globalAlpha = 0.35;
      } else {
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = 1.0;
      }

      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStrokeRef.current.length > 0) {
      const newStroke: DrawingStroke = {
        color: selectedColor,
        width: lineWidth,
        mode: currentTool,
        points: currentStrokeRef.current,
      };
      const updated = [...strokes, newStroke];
      saveCanvasData(updated);
    }
    currentStrokeRef.current = [];
  };

  const undoLastStroke = () => {
    if (strokes.length === 0) return;
    const updated = strokes.slice(0, -1);
    saveCanvasData(updated);
  };

  const clearCanvas = () => {
    saveCanvasData([]);
  };

  return (
    <div className="w-full my-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
      {/* Canvas Tool Header */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          {/* Tool selectors */}
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setCurrentTool('brush')}
              className={`p-1.5 rounded-md transition-colors ${
                currentTool === 'brush'
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Pen"
            >
              <PenTool className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentTool('highlighter')}
              className={`p-1.5 rounded-md transition-colors ${
                currentTool === 'highlighter'
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Highlighter"
            >
              <Highlighter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentTool('eraser')}
              className={`p-1.5 rounded-md transition-colors ${
                currentTool === 'eraser'
                  ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Color palette */}
          {currentTool !== 'eraser' && (
            <div className="flex items-center gap-1 px-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    selectedColor === c ? 'scale-125 ring-2 ring-indigo-400' : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Stroke width selector */}
          <div className="flex items-center gap-1 text-xs text-slate-400 pl-2">
            {[2, 4, 8].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setLineWidth(w)}
                className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] ${
                  lineWidth === w
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Right action buttons: Undo, Clear, Collapse */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={undoLastStroke}
            disabled={strokes.length === 0}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors"
            title="Undo stroke"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Clear canvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title={isCollapsed ? 'Expand canvas' : 'Collapse canvas'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* HTML5 Canvas Area */}
      {!isCollapsed && (
        <div className="relative w-full bg-white dark:bg-slate-950 bg-grid-pattern cursor-crosshair overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={320}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full h-[280px] touch-none"
          />
        </div>
      )}
    </div>
  );
};
