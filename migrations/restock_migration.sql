-- Create table for excluded/ignored products in restock logic
CREATE TABLE IF NOT EXISTS restock_exclusions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id),
    blocked_until TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for saved restock lists/recommendations
CREATE TABLE IF NOT EXISTS restock_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id),
    vmd NUMERIC NOT NULL,
    current_stock INTEGER NOT NULL,
    suggested_quantity INTEGER NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('red', 'yellow', 'green')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS Policies
ALTER TABLE restock_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE restock_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON restock_exclusions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON restock_recommendations
    FOR ALL USING (auth.role() = 'authenticated');

-- Create an index to quickly find exclusions
CREATE INDEX IF NOT EXISTS idx_restock_exclusions_product_blocked 
    ON restock_exclusions(product_id, blocked_until);
