import React, { useRef, useState } from 'react';
import { Block } from '../../../types/notebook';
import { uploadAsset } from '../../../services/supabase/client';
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  File as FileGeneric,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';

interface FileBlockProps {
  block: Block;
  onUpdate: (content: string, metadata?: any) => void;
  onDeleteBlock?: () => void;
}

export const FileBlock: React.FC<FileBlockProps> = ({ block, onUpdate, onDeleteBlock }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileUrl = block.metadata?.fileUrl || block.content;
  const fileName = block.metadata?.fileName || 'Attached File';
  const fileSize = block.metadata?.fileSize || 0;
  const fileType = block.metadata?.fileType || '';

  const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileIcon = () => {
    if (fileName.endsWith('.pdf')) return <FileText className="w-5 h-5 text-rose-500" />;
    if (fileName.match(/\.(xlsx|xls|csv)$/)) return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    if (fileName.match(/\.(zip|tar|gz|7z)$/)) return <FileArchive className="w-5 h-5 text-amber-500" />;
    if (fileName.match(/\.(ts|js|py|sql|json|html|css)$/)) return <FileCode className="w-5 h-5 text-indigo-500" />;
    return <FileGeneric className="w-5 h-5 text-sky-500" />;
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const res = await uploadAsset(file, 'files');
      onUpdate(res.url, {
        ...block.metadata,
        fileUrl: res.url,
        fileName: res.fileName,
        fileSize: res.fileSize,
        fileType: res.fileType,
      });
    } catch (e) {
      console.error('File upload failed:', e);
    } finally {
      setIsUploading(false);
    }
  };

  if (!fileUrl) {
    return (
      <div className="w-full my-3 p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
          }}
        />
        <div className="flex items-center gap-3">
          <FileGeneric className="w-6 h-6 text-slate-400" />
          <div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Attach document, PDF, spreadsheet, or archive
            </p>
            <p className="text-[11px] text-slate-400">Stored safely with metadata</p>
          </div>
        </div>
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full my-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex items-center justify-between group shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80">
          {getFileIcon()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-sm sm:max-w-md">
            {fileName}
          </p>
          <p className="text-xs text-slate-400 font-mono tabular-nums">
            {formatBytes(fileSize)} {fileType ? `· ${fileType.split('/')[1] || fileType}` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={fileUrl}
          download={fileName}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </a>
        {onDeleteBlock && (
          <button
            type="button"
            onClick={onDeleteBlock}
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Remove attachment"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
