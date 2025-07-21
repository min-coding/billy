-- Migration: Add 'tag' column to bills table for grouping/categorization
ALTER TABLE bills ADD COLUMN IF NOT EXISTS tag TEXT;
-- Optionally, you can add an index for faster filtering by tag:
CREATE INDEX IF NOT EXISTS idx_bills_tag ON bills(tag); 