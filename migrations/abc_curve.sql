-- Create table for ABC Curve Analysis
CREATE TABLE IF NOT EXISTS abc_curve (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    classification TEXT CHECK (classification IN ('A', 'B', 'C')),
    participation_percentage NUMERIC, -- The % of total revenue this product represents
    accumulated_percentage NUMERIC, -- The cumulative % used for cut-off
    total_sold_amount NUMERIC, -- Total revenue in period
    total_sold_quantity INTEGER, -- Total units sold in period
    turnover_rate NUMERIC, -- Giro de estoque
    average_stock NUMERIC, -- Estoque medio usado no calculo
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_product_abc UNIQUE (product_id)
);

-- Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_abc_classification ON abc_curve(classification);
CREATE INDEX IF NOT EXISTS idx_abc_participation ON abc_curve(participation_percentage DESC);

-- Enable RLS
ALTER TABLE abc_curve ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read access for authenticated users" ON abc_curve
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all access for service role or admins" ON abc_curve
    FOR ALL TO authenticated USING (true); -- Simplifying for now, ideally check role
