-- Add username column to users table
ALTER TABLE users ADD COLUMN username text UNIQUE NOT NULL;

-- Add unique index for username (redundant with UNIQUE constraint, but explicit)
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users(username); 