export interface AppConfig {
  appName: string;
  appVersion: string;
  storagePrefix: string;
  defaultNotebookColor: string;
  availableColors: { label: string; value: string; border: string; bg: string; text: string }[];
  paperStyles: { id: 'blank' | 'ruled' | 'grid' | 'dots'; label: string; icon: string }[];
}

export const APP_CONFIG: AppConfig = {
  appName: 'JNAS Notebook',
  appVersion: '1.0.0',
  storagePrefix: 'jnas_notebook_',
  defaultNotebookColor: '#6366F1', // Indigo
  availableColors: [
    { label: 'Indigo', value: '#6366F1', border: 'border-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600' },
    { label: 'Emerald', value: '#10B981', border: 'border-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600' },
    { label: 'Violet', value: '#8B5CF6', border: 'border-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-600' },
    { label: 'Rose', value: '#F43F5E', border: 'border-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600' },
    { label: 'Amber', value: '#F59E0B', border: 'border-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600' },
    { label: 'Cyan', value: '#06B6D4', border: 'border-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-600' },
    { label: 'Sky', value: '#0EA5E9', border: 'border-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-600' },
    { label: 'Teal', value: '#14B8A6', border: 'border-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-600' },
    { label: 'Slate', value: '#64748B', border: 'border-slate-500', bg: 'bg-slate-50 dark:bg-slate-900', text: 'text-slate-600' },
  ],
  paperStyles: [
    { id: 'blank', label: 'Plain White', icon: 'Square' },
    { id: 'ruled', label: 'College Ruled', icon: 'AlignJustify' },
    { id: 'grid', label: 'Grid / Engineering', icon: 'Grid' },
    { id: 'dots', label: 'Dot Matrix', icon: 'MoreHorizontal' },
  ]
};
