import React, { useState, useEffect } from 'react';
import { useNotebook } from '../../context/NotebookContext';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testConnection,
  sendMagicLink,
} from '../../services/supabase/client';
import { SUPABASE_SQL_SCHEMA } from '../../services/supabase/sqlSchema';
import { indexedDb } from '../../services/db/indexedDb';
import {
  X,
  Database,
  CheckCircle,
  AlertTriangle,
  Download,
  Upload,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  Mail,
  HardDrive,
  Cloud,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, syncStatus, triggerManualSync, refreshAllData, signOut } = useNotebook();

  const [activeTab, setActiveTab] = useState<'account' | 'database' | 'backup'>('account');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Magic link sign-in within settings
  const [authEmail, setAuthEmail] = useState('');
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [magicLinkResult, setMagicLinkResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setSupabaseUrl(config.url || '');
      setSupabaseAnonKey(config.anonKey || '');
      setTestResult(null);
      setMagicLinkResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
    setTestResult({
      success: true,
      message: 'Supabase configuration saved! Triggering sync...',
    });
    triggerManualSync();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection(supabaseUrl, supabaseAnonKey);
      setTestResult(res);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim()) return;

    setIsSendingMagicLink(true);
    setMagicLinkResult(null);

    // Save project config if user typed it
    if (supabaseUrl && supabaseAnonKey) {
      saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
    }

    const res = await sendMagicLink(authEmail.trim());
    setIsSendingMagicLink(false);

    if (res.success) {
      setMagicLinkResult({
        success: true,
        message: res.message || `Check your inbox! We sent a sign-in link to ${authEmail.trim()}.`,
      });
    } else {
      setMagicLinkResult({
        success: false,
        message: res.message || 'Failed to send sign-in link.',
      });
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  const handleExportBackup = async () => {
    const jsonStr = await indexedDb.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jnas_notebook_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const content = reader.result as string;
        const success = await indexedDb.importAllData(content);
        if (success) {
          setImportStatus('Backup restored successfully!');
          await refreshAllData();
        } else {
          setImportStatus('Error importing backup. Please verify file format.');
        }
      } catch (err) {
        setImportStatus('Failed to read backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Settings & Synchronization
              </h2>
              <p className="text-xs text-slate-400">Manage account, cloud sync & local backup</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`py-2.5 border-b-2 font-medium transition-colors ${
              activeTab === 'account'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Account & Supabase
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`py-2.5 border-b-2 font-medium transition-colors ${
              activeTab === 'database'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            SQL Migration Blueprint
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2.5 border-b-2 font-medium transition-colors ${
              activeTab === 'backup'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Backup & Export
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 text-sm space-y-4">
          {activeTab === 'account' && (
            <div className="space-y-4">
              {/* Account Status Card */}
              {currentUser ? (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        Connected to Supabase Cloud
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      Signed in as: <strong className="font-semibold">{currentUser.email || 'Authenticated User'}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      User ID: {currentUser.id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={triggerManualSync}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await signOut();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-medium transition-colors shadow-2xs"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Local-Only Mode
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Your notes and assets are stored privately in IndexedDB on this device. Connect to your private Supabase project to enable automatic cloud sync and multi-device access.
                  </p>

                  {/* Connect form */}
                  <form onSubmit={handleSendMagicLink} className="pt-2 flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="email"
                        required
                        placeholder="Enter email to sign in with link..."
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                      />
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                    <button
                      type="submit"
                      disabled={isSendingMagicLink || !authEmail.trim()}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
                    >
                      {isSendingMagicLink ? 'Sending...' : 'Send Sign-in Link'}
                    </button>
                  </form>

                  {magicLinkResult && (
                    <div
                      className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                        magicLinkResult.success
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {magicLinkResult.success ? (
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{magicLinkResult.message}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Supabase URL and Anon Key Inputs */}
              <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supabase Publishable Anon Key
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Only use your public Anon key. Never provide your Service Role key.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !supabaseUrl}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                >
                  Save Config
                </button>
                {supabaseUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      clearSupabaseConfig();
                      setSupabaseUrl('');
                      setSupabaseAnonKey('');
                      setTestResult({ success: true, message: 'Supabase configuration cleared.' });
                    }}
                    className="ml-auto text-xs text-rose-500 hover:underline"
                  >
                    Clear Credentials
                  </button>
                )}
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    PostgreSQL Tables & Row Level Security (RLS)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Run this SQL script in your Supabase SQL Editor to set up tables and private storage bucket.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySchema}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs shrink-0"
                >
                  {copiedSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSchema ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono max-h-60 overflow-y-auto leading-relaxed border border-slate-800">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Export Data (JSON)
                </h4>
                <p className="text-xs text-slate-500">
                  Download a complete offline archive of all your notebooks, sections, pages, checklists, drawings, and tags.
                </p>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup JSON</span>
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Restore from Backup
                </h4>
                <p className="text-xs text-slate-500">
                  Restore a previously downloaded JSON backup file to IndexedDB.
                </p>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select Backup File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
                {importStatus && (
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-2">
                    {importStatus}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
