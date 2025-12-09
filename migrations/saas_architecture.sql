-- 1. Criação da estrutura de Tenants (SaaS)
-- Tabela de Tenants (Farmácias)
create table if not exists public.tenants (
    id uuid not null default uuid_generate_v4() primary key,
    name text not null,
    cnpj text,
    status text default 'active', -- active, pending, blocked
    plan_tier text default 'free',
    created_at timestamp with time zone default now()
);

-- Habilitar RLS em Tenants (ninguém vê tenants dos outros, só o seu próprio se associado)
alter table public.tenants enable row level security;

-- Inserir um Tenant Padrão para migrar dados existentes
insert into public.tenants (id, name, status, plan_tier)
select '00000000-0000-0000-0000-000000000000'::uuid, 'Farmácia Demo', 'active', 'premium'
where not exists (select 1 from public.tenants);

-- 2. Adicionar Tenant ID nas tabelas principais
-- Função auxiliar para adicionar coluna se não existir
create or replace function add_tenant_column(tbl text) returns void as $$
begin
    if exists (select from pg_tables where schemaname = 'public' and tablename = tbl) then
        execute format('alter table public.%I add column if not exists tenant_id uuid references public.tenants(id)', tbl);
        -- Atualizar dados antigos para o tenant demo (se houver dados)
        execute format('update public.%I set tenant_id = %L where tenant_id is null', tbl, '00000000-0000-0000-0000-000000000000');
    else
        raise notice 'Tabela % nao encontrada. Pulando adicao de tenant_id.', tbl;
    end if;
end;
$$ language plpgsql;

-- Aplicar a todas as tabelas de negócio
select add_tenant_column('profiles');
select add_tenant_column('products');
select add_tenant_column('product_batches');
select add_tenant_column('customers'); -- Clientes pertencem à farmácia? Sim, em modelo SaaS isolado.
select add_tenant_column('orders');
select add_tenant_column('order_items');
select add_tenant_column('cashback_settings');
select add_tenant_column('cashback_wallet');
select add_tenant_column('cashback_transactions');
select add_tenant_column('store_settings');
select add_tenant_column('notifications');
select add_tenant_column('daily_offers');

-- 3. Atualizar Políticas de Segurança (RLS)
-- Criar função helper para pegar o tenant do usuário logado (Admin ou Cliente)
create or replace function public.get_current_tenant_id() returns uuid as $$
declare
    v_tenant_id uuid;
begin
    -- Tenta pegar de profiles (Admin/Staff)
    select tenant_id into v_tenant_id from public.profiles where id = auth.uid() limit 1;
    
    if v_tenant_id is null then
        -- Tenta pegar de customers (Loja) - Assumindo que o ID do cliente é o mesmo do Auth
        select tenant_id into v_tenant_id from public.customers where id = auth.uid() limit 1;
    end if;
    
    return v_tenant_id;
end;
$$ language plpgsql security definer stable;

-- Exemplo de Policy Template (Replicar para todas as tabelas)

-- PRODUTOS
drop policy if exists "Tenant Isolation" on public.products;
create policy "Tenant Isolation" on public.products
    using (tenant_id = public.get_current_tenant_id());

-- CLIENTES
drop policy if exists "Tenant Isolation" on public.customers;
create policy "Tenant Isolation" on public.customers
    using (tenant_id = public.get_current_tenant_id());

-- PEDIDOS
drop policy if exists "Tenant Isolation" on public.orders;
create policy "Tenant Isolation" on public.orders
    using (tenant_id = public.get_current_tenant_id());

-- CASHBACK (Garantir segurança multi-loja nas tabelas do cashback)
do $$
begin
    if exists (select from pg_tables where schemaname = 'public' and tablename = 'cashback_settings') then
        drop policy if exists "Enable read access for all users" on public.cashback_settings;
        drop policy if exists "Enable all access for admins" on public.cashback_settings;
        drop policy if exists "Tenant Isolation" on public.cashback_settings;
        create policy "Tenant Isolation" on public.cashback_settings
            using (tenant_id = public.get_current_tenant_id());
    end if;

    if exists (select from pg_tables where schemaname = 'public' and tablename = 'cashback_wallet') then
        drop policy if exists "Users can view own wallet" on public.cashback_wallet; 
        drop policy if exists "Admins can all wallet" on public.cashback_wallet;
        drop policy if exists "Tenant Isolation" on public.cashback_wallet;
        create policy "Tenant Isolation" on public.cashback_wallet
            using (tenant_id = public.get_current_tenant_id());
    end if;

    if exists (select from pg_tables where schemaname = 'public' and tablename = 'cashback_transactions') then
        drop policy if exists "Users can view own transactions" on public.cashback_transactions;
        drop policy if exists "Admins can all transactions" on public.cashback_transactions;
        drop policy if exists "Tenant Isolation" on public.cashback_transactions;
        create policy "Tenant Isolation" on public.cashback_transactions
             using (tenant_id = public.get_current_tenant_id());
    end if;
end
$$;

-- 4. Trigger para auto-atribuir tenant_id em novos inserts
-- Se o backend não mandar tenant_id, o banco tenta preencher com o do usuário logado.
create or replace function public.trg_set_tenant_id()
returns trigger as $$
begin
    if new.tenant_id is null then
        new.tenant_id := public.get_current_tenant_id();
    end if;
    return new;
end;
$$ language plpgsql;

-- Aplicar triggers (Safe execution)
do $$
begin
    if not exists (select 1 from pg_trigger where tgname = 'set_tenant_products') then
        create trigger set_tenant_products before insert on public.products for each row execute function public.trg_set_tenant_id();
    end if;
    
    if not exists (select 1 from pg_trigger where tgname = 'set_tenant_orders') then
        create trigger set_tenant_orders before insert on public.orders for each row execute function public.trg_set_tenant_id();
    end if;

    if not exists (select 1 from pg_trigger where tgname = 'set_tenant_customers') then
        create trigger set_tenant_customers before insert on public.customers for each row execute function public.trg_set_tenant_id();
    end if;
    
    -- Triggers para Cashback (se existir)
    if exists (select from pg_tables where schemaname = 'public' and tablename = 'cashback_transactions') and 
       not exists (select 1 from pg_trigger where tgname = 'set_tenant_cashback_transactions') then
        create trigger set_tenant_cashback_transactions before insert on public.cashback_transactions for each row execute function public.trg_set_tenant_id();
    end if;
end
$$;

-- Limpeza
drop function add_tenant_column(text);
