CREATE TABLE IF NOT EXISTS cmed_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL UNIQUE,
  response_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE cmed_cache ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated users
CREATE POLICY "Enable read/write for authenticated users" ON cmed_cache
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Grant access to anon/service_role if needed (depending on how the app connects)
GRANT ALL ON cmed_cache TO anon, authenticated, service_role;
