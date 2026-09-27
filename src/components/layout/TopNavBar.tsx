import React from 'react';
import { useNotebook } from '../../context/NotebookContext';
import { APP_CONFIG } from '../../config/appConfig';
import {
  Search,
  Settings,
  Menu,
  Check,
  RefreshCw,
  CloudOff,
  AlertCircle,
  HardDrive,
} from 'lucide-react';

interface TopNavBarProps {
  onToggleSidebar: () => void;
  onOpenGlobalSearch: () => void;
  onOpenSettings: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  onToggleSidebar,
  onOpenGlobalSearch,
  onOpenSettings,
}) => {
  const { syncStatus, syncMessage, triggerManualSync, currentUser } = useNotebook();

  // Very small, quiet autosave / sync status indicator
  const renderSyncIndicator = () => {
    // If not authenticated with Supabase or in local mode
    if (!currentUser || syncStatus === 'local') {
      return (
        <div
          className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 px-1.5 py-0.5"
          title="Working locally in IndexedDB"
        >
          <HardDrive className="w-3 h-3 text-slate-400" />
          <span>Local only</span>
        </div>
      );
    }

    switch (syncStatus) {
      case 'saving':
      case 'syncing':
        return (
          <button
            type="button"
            onClick={triggerManualSync}
            className="flex items-center gap-1 text-[11px] text-indigo-500 font-normal px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={syncMessage || 'Syncing...'}
          >
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Saving...</span>
          </button>
        );
      case 'offline':
        return (
          <div
            className="flex items-center gap-1 text-[11px] text-amber-500 font-normal px-1.5 py-0.5"
            title="Offline - changes saved locally in IndexedDB"
          >
            <CloudOff className="w-3 h-3" />
            <span>Offline</span>
          </div>
        );
      case 'error':
        return (
          <button
            type="button"
            onClick={triggerManualSync}
            className="flex items-center gap-1 text-[11px] text-rose-500 font-normal px-1.5 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
            title={`Sync retry: ${syncMessage}`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>Retry</span>
          </button>
        );
      case 'synced':
      case 'saved':
      default:
        return (
          <div
            className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 px-1 py-0.5"
            title="Saved locally and synced to cloud"
          >
            <Check className="w-3 h-3 text-emerald-500" />
            <span className="hidden sm:inline">Saved</span>
          </div>
        );
    }
  };

  return (
    <header className="h-10 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 px-3 flex items-center justify-between gap-3 select-none shrink-0 z-40">
      {/* Left: ☰ JNAS Notebook */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
          {APP_CONFIG.appName}
        </span>
      </div>

      {/* Right: [Saved]   Search   ⚙ */}
      <div className="flex items-center gap-2">
        {renderSyncIndicator()}

        <button
          type="button"
          onClick={onOpenGlobalSearch}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 text-xs transition-colors"
          title="Search across all notebooks (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
          title="Settings & Cloud Sync"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
