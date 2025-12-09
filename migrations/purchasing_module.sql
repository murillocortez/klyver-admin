-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj TEXT UNIQUE,
    telefone TEXT,
    whatsapp TEXT,
    email TEXT,
    endereco JSONB DEFAULT '{}'::jsonb,
    observacao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Quotations (Header)
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT CHECK (status IN ('aberta', 'fechada', 'cancelada')) DEFAULT 'aberta',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Quotation Items (Products requested)
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity_requested INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Quotation Prices (Responses from suppliers)
CREATE TABLE IF NOT EXISTS quotation_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_item_id UUID REFERENCES quotation_items(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id),
    unit_price NUMERIC(10, 2) NOT NULL,
    delivery_days INTEGER,
    payment_terms TEXT,
    observation TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Purchases (Orders to suppliers)
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES suppliers(id),
    invoice_number TEXT,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status TEXT CHECK (status IN ('lancado', 'recebido', 'pendente', 'cancelado')) DEFAULT 'lancado',
    payment_terms TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    batch_number TEXT,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Accounts Payable (Financeiro)
CREATE TABLE IF NOT EXISTS accounts_payable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES purchases(id),
    supplier_id UUID REFERENCES suppliers(id),
    amount NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT CHECK (status IN ('pendente', 'pago', 'atrasado')) DEFAULT 'pendente',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for Admin/CEO)
-- Authenticated users can read (operators need to see suppliers etc)
CREATE POLICY "Allow read access for authenticated users" ON suppliers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow write for staff" ON suppliers FOR ALL USING (auth.role() = 'authenticated'); -- Ideally restricted to admin/manager

CREATE POLICY "Allow read access for authenticated users" ON quotations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow write for staff" ON quotations FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON quotation_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow write for staff" ON quotation_items FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON quotation_prices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow write for staff" ON quotation_prices FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON purchases FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow write for staff" ON purchases FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON purchase_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow write for staff" ON purchase_items FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON accounts_payable FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow write for staff" ON accounts_payable FOR ALL USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_cnpj ON suppliers(cnpj);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_status ON accounts_payable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_due_date ON accounts_payable(due_date);
