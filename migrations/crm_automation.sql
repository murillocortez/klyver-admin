-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Coupons Table (needed for campaigns)
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
    discount_value NUMERIC(10,2) NOT NULL,
    min_purchase NUMERIC(10,2),
    max_discount NUMERIC(10,2),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    customer_id UUID REFERENCES customers(id), -- Optional: specific to a customer
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CRM Campaigns Configuration
CREATE TABLE IF NOT EXISTS crm_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE, -- 'reactivation', 'birthday', 'vip'
    name TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT FALSE,
    message_template TEXT,
    discount_percent NUMERIC(5,2),
    last_run_at TIMESTAMPTZ,
    config JSONB, -- For extra settings like days_inactive, spend_threshold
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CRM Logs (General - predominantly for Reactivation)
CREATE TABLE IF NOT EXISTS crm_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    campaign_slug TEXT NOT NULL,
    status TEXT NOT NULL, -- 'sent', 'failed', 'skipped'
    channel TEXT DEFAULT 'whatsapp',
    message_sent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CRM Birthday Control
CREATE TABLE IF NOT EXISTS crm_birthday (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    coupon_id UUID REFERENCES coupons(id),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    year INTEGER -- To prevent duplicate sending in the same year
);

-- 5. CRM VIP Control
CREATE TABLE IF NOT EXISTS crm_vip (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    coupon_id UUID REFERENCES coupons(id),
    status TEXT DEFAULT 'emitido', -- 'emitido', 'utilizado'
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT -- 'spend_threshold' or 'order_count'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crm_logs_customer_campaign ON crm_logs(customer_id, campaign_slug);
CREATE INDEX IF NOT EXISTS idx_crm_logs_created_at ON crm_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_crm_birthday_customer_year ON crm_birthday(customer_id, year);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- RLS Policies
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_birthday ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_vip ENABLE ROW LEVEL SECURITY;

-- Allow full access to authenticated users (admin staff)
CREATE POLICY "Staff Full Access Coupons" ON coupons FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Staff Full Access Campaigns" ON crm_campaigns FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Staff Full Access CRMLogs" ON crm_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Staff Full Access CRMBirthday" ON crm_birthday FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Staff Full Access CRMVip" ON crm_vip FOR ALL USING (auth.role() = 'authenticated');

-- Insert Default Campaigns
INSERT INTO crm_campaigns (slug, name, description, active, message_template, discount_percent, config)
VALUES 
(
    'reactivation', 
    'Reativação de Clientes', 
    'Clientes sem compra há 60 dias', 
    TRUE, 
    'Oi {{nome}}, sentimos sua falta! Temos uma condição especial esperando você. Aproveite na FarmaVida! ❤️', 
    5.00,
    '{"days_inactive": 60, "cooldown_days": 20}'::jsonb
),
(
    'birthday', 
    'Aniversariantes do Dia', 
    'Mensagem e cupom para aniversariantes', 
    TRUE, 
    'PARABÉNS, {{nome}} 🎉! Aproveite um presente especial da FarmaVida! 🎁', 
    10.00,
    '{"validity_days": 7}'::jsonb
),
(
    'vip', 
    'Cliente VIP', 
    'Bonificação por meta de compras', 
    TRUE, 
    'Parabéns! Você alcançou o nível VIP na FarmaVida! Aqui está seu cupom exclusivo de 15%.', 
    15.00,
    '{"spend_threshold": 500, "order_count_threshold": 10, "validity_days": 30}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
