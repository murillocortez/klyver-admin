-- Create cmed_cache table if not exists
CREATE TABLE IF NOT EXISTS cmed_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    response_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cmed_cache ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists to avoid errors on re-run
DROP POLICY IF EXISTS "Enable read/write for authenticated users" ON cmed_cache;

-- Policy for authenticated users
CREATE POLICY "Enable read/write for authenticated users" ON cmed_cache
    FOR ALL USING (auth.role() = 'authenticated');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cmed_cache_query ON cmed_cache(query);
