-- Standardize tenants table structure FIRST
DO $$
BEGIN
    -- If 'tenants' table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants' AND table_schema = 'public') THEN
        
        -- Fix "name" vs "display_name" conflict
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'name') THEN
            -- If 'display_name' does NOT exist, rename 'name' to 'display_name'
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'display_name') THEN
                ALTER TABLE public.tenants RENAME COLUMN "name" TO "display_name";
            ELSE
                -- If both exist, drop 'name' (assuming we want to use display_name and name is causing the NOT NULL error)
                ALTER TABLE public.tenants DROP COLUMN "name";
            END IF;
        END IF;

    END IF;
END $$;

-- Create tenants table if it doesn't exist (using the correct structure)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    logo_url TEXT,
    plan_code TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
    admin_base_url TEXT,
    store_base_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Allow public read access to tenants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tenants' AND policyname = 'Public read access to tenants'
    ) THEN
        CREATE POLICY "Public read access to tenants"
            ON public.tenants
            FOR SELECT
            USING (true);
    END IF;
END $$;


-- Add tenant_id to existing tables safely
DO $$ 
BEGIN 
    -- customers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.customers ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;

    -- products
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.products ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;

    -- product_batches
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_batches' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_batches' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.product_batches ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;

    -- price_history
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'price_history' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'price_history' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.price_history ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;

    -- orders
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.orders ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;

     -- order_items
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.order_items ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;

    -- profiles
     IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.profiles ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;

    -- store_plans
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_plans' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_plans' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.store_plans ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;
    
    -- store_settings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_settings' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'store_settings' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.store_settings ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;

    -- daily_offers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_offers' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_offers' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.daily_offers ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;

    -- health_insurance_plans
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'health_insurance_plans' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'health_insurance_plans' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.health_insurance_plans ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;
    
    -- favorites
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorites' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'favorites' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.favorites ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;

    -- invoices
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.invoices ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;

    -- fiscal_documents
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fiscal_documents' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fiscal_documents' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.fiscal_documents ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;
    
    -- newsletter_subscribers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'newsletter_subscribers' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_subscribers' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.newsletter_subscribers ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;
    
    -- notifications
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.notifications ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;

    -- invoice_logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_logs' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_logs' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.invoice_logs ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;
    
    -- cmed_prices
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cmed_prices' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cmed_prices' AND column_name = 'tenant_id') THEN
            ALTER TABLE public.cmed_prices ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        END IF;
    END IF;
END $$;

-- Enable RLS on core tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
    END IF;
     IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    END IF;
     IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies safely
DO $$
BEGIN
    -- Customers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Enable all for authenticated users') THEN
            CREATE POLICY "Enable all for authenticated users" ON public.customers FOR ALL USING (auth.role() = 'authenticated');
        END IF;
    END IF;
    
    -- Products
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Enable all for authenticated users') THEN
            CREATE POLICY "Enable all for authenticated users" ON public.products FOR ALL USING (auth.role() = 'authenticated');
        END IF;
    END IF;
    
    -- Orders
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Enable all for authenticated users') THEN
            CREATE POLICY "Enable all for authenticated users" ON public.orders FOR ALL USING (auth.role() = 'authenticated');
        END IF;
    END IF;
END $$;

-- Insert Initial Tenant (Farma Vida)
INSERT INTO public.tenants (slug, display_name, logo_url, plan_code, status, admin_base_url, store_base_url)
VALUES 
('farmavida', 'Farma Vida', 'https://sozgwjlsfkqnphbvaswc.supabase.co/storage/v1/object/public/images/farma_vida_logo.png', 'enterprise', 'active', 'https://farma-vida-admin.vercel.app', 'https://farmavida-loja.vercel.app')
ON CONFLICT (slug) DO NOTHING;

-- Insert Second Tenant (Drogamenos)
INSERT INTO public.tenants (slug, display_name, logo_url, plan_code, status, admin_base_url, store_base_url)
VALUES 
('drogamenos', 'Drogamenos', NULL, 'free', 'active', 'https://farma-vida-admin.vercel.app', 'https://farmavida-loja.vercel.app')
ON CONFLICT (slug) DO NOTHING;
