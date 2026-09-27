import React, { useState } from 'react';
import { Block } from '../../../types/notebook';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  block: Block;
  onUpdate: (content: string, metadata?: any) => void;
}

const LANGUAGES = [
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'SQL', value: 'sql' },
  { label: 'JSON', value: 'json' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'Shell / Bash', value: 'bash' },
  { label: 'Rust', value: 'rust' },
  { label: 'Go', value: 'go' },
];

export const CodeBlock: React.FC<CodeBlockProps> = ({ block, onUpdate }) => {
  const [copied, setCopied] = useState(false);
  const language = block.metadata?.language || 'typescript';

  const handleCopy = () => {
    navigator.clipboard.writeText(block.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLangChange = (newLang: string) => {
    onUpdate(block.content, {
      ...block.metadata,
      language: newLang,
    });
  };

  return (
    <div className="w-full my-3 rounded-xl overflow-hidden border border-slate-700/60 bg-[#0F172A] shadow-md">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={language}
            onChange={(e) => handleLangChange(e.target.value)}
            className="bg-transparent border-none text-slate-300 font-mono text-xs focus:ring-0 cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value} className="bg-slate-900 text-white">
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px]"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Textarea */}
      <textarea
        value={block.content || ''}
        onChange={(e) => onUpdate(e.target.value, block.metadata)}
        placeholder="// Paste or write code here..."
        rows={Math.max(4, (block.content || '').split('\n').length + 1)}
        className="w-full p-4 font-mono text-[13px] leading-relaxed text-slate-100 bg-[#0F172A] border-none outline-none resize-none focus:ring-0 selection:bg-indigo-500/40"
        spellCheck={false}
      />
    </div>
  );
};
