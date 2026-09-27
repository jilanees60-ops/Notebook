export type PaperStyle = 'blank' | 'ruled' | 'grid' | 'dots';

export interface Notebook {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  position: number;
  is_archived: boolean;
  is_favorite: boolean;
  is_pinned?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Section {
  id: string;
  notebook_id: string;
  user_id: string;
  name: string;
  color: string;
  position: number;
  is_archived: boolean;
  is_pinned?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Page {
  id: string;
  section_id: string;
  notebook_id: string;
  user_id: string;
  title: string;
  icon?: string;
  cover?: string;
  position: number;
  is_archived: boolean;
  is_favorite: boolean;
  is_pinned?: boolean;
  paper_style?: PaperStyle;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export type BlockType =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'text'
  | 'checklist'
  | 'quote'
  | 'code'
  | 'table'
  | 'image'
  | 'file'
  | 'divider'
  | 'drawing'
  | 'callout';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface DrawingStroke {
  color: string;
  width: number;
  mode: 'brush' | 'highlighter' | 'eraser';
  points: { x: number; y: number }[];
}

export interface BlockMetadata {
  checklistItems?: ChecklistItem[];
  tableData?: TableData;
  language?: string;
  caption?: string;
  altText?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  align?: 'left' | 'center' | 'right';
  calloutType?: 'info' | 'warning' | 'tip' | 'note';
  drawingData?: {
    strokes: DrawingStroke[];
    previewUrl?: string;
  };
  linkUrl?: string;
}

export interface Block {
  id: string;
  page_id: string;
  user_id: string;
  type: BlockType;
  content: string;
  position: number;
  metadata?: BlockMetadata;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface PageTag {
  page_id: string;
  tag_id: string;
}

export interface PageVersion {
  id: string;
  page_id: string;
  user_id: string;
  title: string;
  blocks_snapshot: Block[];
  snapshot_reason: string;
  created_at: string;
}

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'syncing' | 'synced' | 'offline' | 'error' | 'local';

export interface SyncQueueItem {
  id: string;
  table: 'notebooks' | 'sections' | 'pages' | 'blocks' | 'tags' | 'page_tags';
  action: 'insert' | 'update' | 'delete';
  record_id: string;
  payload: Record<string, any>;
  timestamp: number;
  retry_count: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  userEmail?: string;
  userId?: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}

export interface SearchResultItem {
  type: 'page' | 'section' | 'notebook' | 'block' | 'tag';
  id: string;
  title: string;
  subtitle: string;
  matchedSnippet?: string;
  notebookId?: string;
  sectionId?: string;
  pageId?: string;
  updatedAt: string;
}
