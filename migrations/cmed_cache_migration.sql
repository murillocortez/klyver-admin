CREATE TABLE IF NOT EXISTS cmed_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  response_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cmed_cache_query ON cmed_cache(query);
