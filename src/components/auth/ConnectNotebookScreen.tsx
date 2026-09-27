import React, { useState } from 'react';
import {
  sendMagicLink,
  setLocalOnlyPreferred,
  getSupabaseConfig,
  saveSupabaseConfig,
} from '../../services/supabase/client';
import { Mail, CheckCircle2, ArrowRight, HardDrive, Settings, AlertCircle, RefreshCw } from 'lucide-react';

interface ConnectNotebookScreenProps {
  onConnected: () => void;
  onContinueLocal: () => void;
}

export const ConnectNotebookScreen: React.FC<ConnectNotebookScreenProps> = ({
  onContinueLocal,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Supabase URL & Anon Key for custom projects
  const initialConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(initialConfig.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialConfig.anonKey || '');
  const [configSaved, setConfigSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setMessage(null);

    // Save config if custom values entered
    if (supabaseUrl && supabaseAnonKey) {
      saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
    }

    const res = await sendMagicLink(email.trim());

    setIsLoading(false);
    if (res.success) {
      setMessage({
        type: 'success',
        text: res.message || `Check your inbox! We sent a secure sign-in link to ${email.trim()}.`,
      });
    } else {
      setMessage({
        type: 'error',
        text: res.message || 'Failed to send secure sign-in link. Please check your Supabase configuration.',
      });
    }
  };

  const handleLocalClick = () => {
    setLocalOnlyPreferred(true);
    onContinueLocal();
  };

  const handleSaveConfig = () => {
    saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 text-slate-800 dark:text-slate-100 select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-indigo-600 text-white items-center justify-center font-bold text-lg shadow-sm mx-auto mb-1">
            JN
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            JNAS Notebook
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Connect your notebook
          </p>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            )}
            <div className="flex-1 leading-relaxed">{message.text}</div>
          </div>
        )}

        {/* Magic Link Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-sm pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sending link...</span>
              </>
            ) : (
              <>
                <span>Send secure sign-in link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
            Your notebook data will be stored in your private Supabase project.
          </p>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          <span className="shrink-0 mx-3 text-[11px] text-slate-400 font-medium">OR</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
        </div>

        {/* Local-Only Mode Option */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleLocalClick}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>Continue in Local-Only mode</span>
          </button>
          <p className="text-[11px] text-center text-slate-400">
            IndexedDB saves locally. You can connect your cloud account at any time in Settings.
          </p>
        </div>

        {/* Expandable Project Settings for Supabase */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="text-[11px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-1.5 w-full transition-colors"
          >
            <Settings className="w-3 h-3" />
            <span>{showConfig ? 'Hide Supabase Project URL & Key' : 'Configure Supabase Project'}</span>
          </button>

          {showConfig && (
            <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3 text-left">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Publishable Anon Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGci..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">Public anon key only</span>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[11px] font-medium hover:bg-indigo-700 transition-colors"
                >
                  {configSaved ? 'Saved!' : 'Save Config'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
