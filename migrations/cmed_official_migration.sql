CREATE TABLE IF NOT EXISTS cmed_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drug_name TEXT NOT NULL,
  presentation TEXT,
  laboratory TEXT,
  registration_number TEXT,
  pf_value NUMERIC,
  pmc_value NUMERIC,
  pmvg_value NUMERIC,
  active_ingredient TEXT,
  therapeutic_class TEXT,
  last_update TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE cmed_prices ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for authenticated users" ON cmed_prices
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write access for authenticated users" ON cmed_prices
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Indexes for fast search
CREATE INDEX IF NOT EXISTS idx_cmed_drug_name ON cmed_prices (drug_name);
CREATE INDEX IF NOT EXISTS idx_cmed_registration ON cmed_prices (registration_number);
