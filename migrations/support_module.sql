-- Tabela de Chamados de Suporte
create table if not exists public.support_tickets (
    id uuid not null default uuid_generate_v4() primary key,
    tenant_id uuid references public.tenants(id),
    user_id uuid references auth.users(id), -- Opcional, se logado
    requester_name text not null,
    requester_phone text,
    subject text, -- Adicionando assunto para facilitar visualização no histórico
    message text not null,
    urgency text default 'medium', -- low, medium, high
    status text default 'open', -- open, pending, answered, closed
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- RLS para Support Tickets
alter table public.support_tickets enable row level security;

-- Política de Isolamento
drop policy if exists "Tenant Isolation" on public.support_tickets;
create policy "Tenant Isolation" on public.support_tickets
    for select
    using (tenant_id = public.get_current_tenant_id());

-- Política de Inserção
drop policy if exists "Tenant Insert" on public.support_tickets;
create policy "Tenant Insert" on public.support_tickets
    for insert with check (tenant_id = public.get_current_tenant_id());
    
-- Update para o tenant apenas ler (ou fechar futuramente)
drop policy if exists "Tenant Update Own" on public.support_tickets;
create policy "Tenant Update Own" on public.support_tickets
    for update using (tenant_id = public.get_current_tenant_id());

-- Trigger para Tenant ID (Reutilizando a logica do saas_architecture se possivel ou criando especifico)
-- Como saas_architecture ja define o trigger function genérico, podemos apenas aplicar o trigger.
do $$
begin
    if not exists (select 1 from pg_trigger where tgname = 'set_tenant_support_tickets') then
        create trigger set_tenant_support_tickets before insert on public.support_tickets for each row execute function public.trg_set_tenant_id();
    end if;
end
$$;
