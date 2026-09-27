import React, { useState, useEffect } from 'react';
import { useNotebook } from '../../context/NotebookContext';
import { PageVersion } from '../../types/notebook';
import { indexedDb } from '../../services/db/indexedDb';
import { History, RotateCcw, Clock, X, ShieldAlert } from 'lucide-react';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ isOpen, onClose }) => {
  const { activePage, createPageVersion, restorePageVersion } = useNotebook();
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PageVersion | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activePage) {
      loadVersions();
    }
  }, [isOpen, activePage]);

  const loadVersions = async () => {
    if (!activePage) return;
    setIsLoading(true);
    try {
      const vers = await indexedDb.getPageVersions(activePage.id);
      setVersions(vers);
      if (vers.length > 0) {
        setSelectedVersion(vers[0]);
      } else {
        setSelectedVersion(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    await createPageVersion('Manual Snapshot');
    await loadVersions();
  };

  const handleRestore = async (version: PageVersion) => {
    if (confirm(`Restore version from ${new Date(version.created_at).toLocaleString()}? Current changes will be snapshotted automatically.`)) {
      await restorePageVersion(version);
      onClose();
    }
  };

  if (!isOpen || !activePage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[75vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Page Version History
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-md">{activePage.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateSnapshot}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
            >
              Take Snapshot Now
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2-Pane Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Versions List Left Pane */}
          <div className="w-64 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-2 space-y-1 bg-slate-50/50 dark:bg-slate-900/50">
            {versions.map((ver) => {
              const isSelected = selectedVersion?.id === ver.id;
              const dateStr = new Date(ver.created_at).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={ver.id}
                  onClick={() => setSelectedVersion(ver)}
                  className={`p-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] mb-1">
                    <Clock className="w-3 h-3" />
                    <span>{dateStr}</span>
                  </div>
                  <p className="truncate text-slate-800 dark:text-slate-200">
                    {ver.snapshot_reason}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono tabular-nums mt-0.5">
                    {ver.blocks_snapshot.length} blocks
                  </p>
                </div>
              );
            })}

            {versions.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                No previous snapshots yet. Click "Take Snapshot Now" to record current state.
              </div>
            )}
          </div>

          {/* Version Preview Right Pane */}
          <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-950 flex flex-col">
            {selectedVersion ? (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedVersion.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Snapshot taken on {new Date(selectedVersion.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestore(selectedVersion)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore this Version</span>
                  </button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto text-sm text-slate-800 dark:text-slate-200">
                  {selectedVersion.blocks_snapshot.map((block) => (
                    <div
                      key={block.id}
                      className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/40"
                    >
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                        {block.type}
                      </span>
                      {block.type === 'checklist' && block.metadata?.checklistItems ? (
                        <div className="space-y-1">
                          {block.metadata.checklistItems.map((ci) => (
                            <div key={ci.id} className="flex items-center gap-2 text-xs">
                              <span>{ci.completed ? '☑' : '☐'}</span>
                              <span className={ci.completed ? 'line-through text-slate-400' : ''}>
                                {ci.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : block.type === 'table' && block.metadata?.tableData ? (
                        <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                          [Table with {block.metadata.tableData.rows.length} rows]
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{block.content || '(empty block)'}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="m-auto text-center text-xs text-slate-400">
                Select a version on the left to preview.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
