-- Create fiscal_settings table
CREATE TABLE IF NOT EXISTS fiscal_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL, -- Assuming single store for now, or link to store table if exists
    mode TEXT NOT NULL DEFAULT 'none' CHECK (mode IN ('none', 'nfe', 'sat', 'ecf', 'simulated')),
    sat_endpoint_url TEXT,
    ecf_endpoint_url TEXT,
    nfe_provider TEXT, -- e.g., 'enotas', 'plugnotas', 'nuvemfiscal'
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookup by store_id
CREATE INDEX IF NOT EXISTS idx_fiscal_settings_store_id ON fiscal_settings(store_id);

-- Create fiscal_documents table (unified structure)
CREATE TABLE IF NOT EXISTS fiscal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('nfe', 'sat', 'ecf', 'simulated')),
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, approved, rejected, canceled, simulated
    provider TEXT NOT NULL, -- enotas, plugnotas, sat-local, ecf-local, simulated
    xml_url TEXT, -- URL or TEXT content
    pdf_url TEXT, -- Link to printable version
    raw_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for order lookups
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_order_id ON fiscal_documents(order_id);

-- Add column for metadata in invoices if we want to keep using it, but user asked for fiscal_documents.
-- The prompt suggests: "Se ainda não existir, criar tabela fiscal_documents (ou adaptar a tabela invoices)"
-- I will choose to create fiscal_documents as it's cleaner for this new module.

-- Grant permissions if necessary (adjust public/authenticator roles as needed for your Supabase setup)
GRANT ALL ON fiscal_settings TO authenticated;
GRANT ALL ON fiscal_documents TO authenticated;
GRANT ALL ON fiscal_settings TO service_role;
GRANT ALL ON fiscal_documents TO service_role;
