-- Create health_insurance_plans table
CREATE TABLE IF NOT EXISTS health_insurance_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_spent NUMERIC DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS purchase_count INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS insurance_plan_id UUID REFERENCES health_insurance_plans(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referrer TEXT;

-- Update orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'online'; -- 'online' or 'presencial'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT; -- 'credit_card', 'debit_card', 'money', 'pix'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount_paid NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS change_amount NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cashier_id UUID REFERENCES auth.users(id);

-- Create pdv_sessions table
CREATE TABLE IF NOT EXISTS pdv_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  initial_cash NUMERIC DEFAULT 0,
  final_cash NUMERIC,
  status TEXT DEFAULT 'open' -- 'open', 'closed'
);

-- Enable RLS
ALTER TABLE health_insurance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for health_insurance_plans
CREATE POLICY "Enable read access for authenticated users" ON health_insurance_plans
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON health_insurance_plans
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON health_insurance_plans
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON health_insurance_plans
    FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for pdv_sessions
CREATE POLICY "Users can manage their own sessions" ON pdv_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Insert some default plans
INSERT INTO health_insurance_plans (name, discount_percent) VALUES
('Amil', 12),
('Bradesco Saúde', 15),
('Unimed', 10),
('SulAmérica', 12),
('Particular (Sem Convênio)', 0);
