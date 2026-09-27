import React, { useState, useRef } from 'react';
import { Block } from '../../../types/notebook';
import { uploadAsset } from '../../../services/supabase/client';
import { Image as ImageIcon, Upload, Trash2, Maximize2, Minimize2 } from 'lucide-react';

interface ImageBlockProps {
  block: Block;
  onUpdate: (content: string, metadata?: any) => void;
  onDeleteBlock?: () => void;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({ block, onUpdate, onDeleteBlock }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlPrompt, setShowUrlPrompt] = useState(false);

  const imageUrl = block.metadata?.fileUrl || block.content;
  const caption = block.metadata?.caption || '';
  const align = block.metadata?.align || 'center'; // 'left' | 'center' | 'right'

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const res = await uploadAsset(file, 'images');
      onUpdate(res.url, {
        ...block.metadata,
        fileUrl: res.url,
        fileName: res.fileName,
        fileSize: res.fileSize,
        fileType: res.fileType,
      });
    } catch (e) {
      console.error('Image upload failed:', e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const cycleAlign = () => {
    const nextAlign = align === 'center' ? 'left' : align === 'left' ? 'right' : 'center';
    onUpdate(block.content, {
      ...block.metadata,
      align: nextAlign,
    });
  };

  if (!imageUrl) {
    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="w-full my-3 p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
          }}
        />

        <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {isUploading ? 'Uploading image...' : 'Drop an image or upload from device'}
        </p>
        <p className="text-xs text-slate-400 mt-1 mb-4">PNG, JPG, WebP, GIF, SVG</p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Select Image</span>
          </button>
          <button
            type="button"
            onClick={() => setShowUrlPrompt(!showUrlPrompt)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            From Web URL
          </button>
        </div>

        {showUrlPrompt && (
          <div className="mt-3 flex items-center gap-2 w-full max-w-sm">
            <input
              type="url"
              placeholder="https://example.com/image.png"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg flex-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (urlInput.trim()) {
                  onUpdate(urlInput.trim(), { ...block.metadata, fileUrl: urlInput.trim() });
                }
              }}
              className="text-xs px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium"
            >
              Add
            </button>
          </div>
        )}
      </div>
    );
  }

  const containerAlignClass =
    align === 'left' ? 'mr-auto max-w-md' : align === 'right' ? 'ml-auto max-w-md' : 'mx-auto max-w-2xl';

  return (
    <div className={`w-full my-3 ${containerAlignClass} group`}>
      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <img
          src={imageUrl}
          alt={block.metadata?.altText || caption || 'Note image'}
          className="w-full h-auto max-h-[500px] object-contain rounded-t-xl bg-slate-50 dark:bg-slate-950"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {/* Floating action buttons */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-sm p-1 rounded-lg">
          <button
            type="button"
            onClick={cycleAlign}
            className="p-1 text-slate-200 hover:text-white transition-colors"
            title={`Align: ${align}`}
          >
            {align === 'center' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          {onDeleteBlock && (
            <button
              type="button"
              onClick={onDeleteBlock}
              className="p-1 text-rose-300 hover:text-rose-100 transition-colors"
              title="Delete image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Caption */}
        <div className="p-2 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200/60 dark:border-slate-800">
          <input
            type="text"
            value={caption}
            onChange={(e) =>
              onUpdate(block.content, {
                ...block.metadata,
                caption: e.target.value,
              })
            }
            placeholder="Add an image caption..."
            className="w-full text-xs text-center text-slate-500 bg-transparent border-none outline-none focus:text-slate-800 dark:focus:text-slate-200"
          />
        </div>
      </div>
    </div>
  );
};
