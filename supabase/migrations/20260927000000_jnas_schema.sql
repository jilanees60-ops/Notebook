-- JNAS Notebook — Supabase PostgreSQL Schema & Security Migration
-- Migration: 20260927000000_jnas_schema.sql

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Notebooks Table
CREATE TABLE IF NOT EXISTS notebooks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'BookOpen',
  color TEXT NOT NULL DEFAULT '#6366F1',
  position INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 3. Sections Table
CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  notebook_id TEXT REFERENCES notebooks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366F1',
  position INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 4. Pages Table
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  section_id TEXT REFERENCES sections(id) ON DELETE CASCADE NOT NULL,
  notebook_id TEXT REFERENCES notebooks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Page',
  icon TEXT,
  cover TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  paper_style TEXT DEFAULT 'blank',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 5. Blocks Table
CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  page_id TEXT REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 6. Tags Table
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366F1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Page Tags Mapping Table
CREATE TABLE IF NOT EXISTS page_tags (
  id TEXT PRIMARY KEY,
  page_id TEXT REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  tag_id TEXT REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- 8. Page Version History Table
CREATE TABLE IF NOT EXISTS page_versions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  page_id TEXT REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  user_id REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  blocks_snapshot JSONB NOT NULL,
  snapshot_reason TEXT DEFAULT 'Manual Snapshot',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Row Level Security (RLS)
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own notebooks access" ON notebooks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own sections access" ON sections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own pages access" ON pages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own blocks access" ON blocks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own tags access" ON tags
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own page tags access" ON page_tags
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own page versions access" ON page_versions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_notebooks_user ON notebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_sections_notebook ON sections(notebook_id);
CREATE INDEX IF NOT EXISTS idx_sections_user ON sections(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_section ON pages(section_id);
CREATE INDEX IF NOT EXISTS idx_pages_notebook ON pages(notebook_id);
CREATE INDEX IF NOT EXISTS idx_pages_user ON pages(user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_page ON blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_blocks_user ON blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_page_tags_page ON page_tags(page_id);
CREATE INDEX IF NOT EXISTS idx_page_tags_user ON page_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_page_versions_page ON page_versions(page_id);
CREATE INDEX IF NOT EXISTS idx_page_versions_user ON page_versions(user_id);

-- 11. Storage Bucket for Attachments & Images (PRIVATE)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('notebook_assets', 'notebook_assets', false)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE POLICY "Users can upload their own assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'notebook_assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'notebook_assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'notebook_assets' AND (storage.foldername(name))[1] = auth.uid()::text);
