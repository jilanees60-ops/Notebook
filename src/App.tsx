import React, { useState } from 'react';
import { NotebookProvider, useNotebook } from './context/NotebookContext';
import { TopNavBar } from './components/layout/TopNavBar';
import { NotebooksSidebar } from './components/navigation/NotebooksSidebar';
import { SectionsListSidebar } from './components/navigation/SectionsListSidebar';
import { PageEditor } from './components/editor/PageEditor';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { VersionHistoryModal } from './components/modals/VersionHistoryModal';
import { TrashModal } from './components/modals/TrashModal';
import { ConnectNotebookScreen } from './components/auth/ConnectNotebookScreen';
import { isLocalOnlyPreferred } from './services/supabase/client';

const NotebookAppContent: React.FC = () => {
  const { isInitialized, currentUser } = useNotebook();
  const [isLocalMode, setIsLocalMode] = useState<boolean>(() => isLocalOnlyPreferred());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 text-slate-500">
        <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs mb-2 animate-pulse">
          JN
        </div>
        <p className="text-xs font-medium text-slate-400">Opening notebook...</p>
      </div>
    );
  }

  // First run connection screen: Shown only when unauthenticated and not set to local mode
  if (!currentUser && !isLocalMode) {
    return (
      <ConnectNotebookScreen
        onConnected={() => {}}
        onContinueLocal={() => setIsLocalMode(true)}
      />
    );
  }

  const showNavigation = sidebarOpen && !isFocusMode;

  return (
    <div className="h-screen w-screen flex flex-col bg-white dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 antialiased font-sans">
      {/* 1. Ultra Clean Header: ☰ JNAS Notebook              [Saved]   Search   ⚙ */}
      <TopNavBar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenGlobalSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 2. Main Desktop Structure: NOTEBOOKS | SECTIONS | PAGE / EDITOR */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Notebooks */}
        <NotebooksSidebar
          isOpen={showNavigation}
          onClose={() => setSidebarOpen(false)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenTrash={() => setIsTrashOpen(true)}
        />

        {/* Column 2: Sections */}
        <SectionsListSidebar isOpen={showNavigation} />

        {/* Main Area: Page Tabs & Large Editor (Pages are displayed as horizontal tabs at the top of the editor) */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <PageEditor
            onOpenVersionHistory={() => setIsVersionHistoryOpen(true)}
            onOpenGlobalSearch={() => setIsSearchOpen(true)}
            onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
            isFocusMode={isFocusMode}
          />
        </main>
      </div>

      {/* Modals & Dialogs */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <VersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
      />

      <TrashModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <NotebookProvider>
      <NotebookAppContent />
    </NotebookProvider>
  );
}
