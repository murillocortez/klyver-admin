-- CRIAÇÃO COMPLETA DA TABELA CASHBACK_SETTINGS + POLÍTICAS + DADOS
-- Este script RECRIA a tabela caso ela tenha sido apagada acidentalmente

-- 1. Cria a tabela se ela não existir
create table if not exists public.cashback_settings (
    id uuid not null default uuid_generate_v4() primary key,
    percentual_padrao numeric(5,2) not null default 5.00,
    dias_validade integer not null default 30,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 2. Habilita RLS (Segurança)
alter table public.cashback_settings enable row level security;

-- 3. Limpa políticas antigas para evitar conflito
drop policy if exists "Admins can update settings" on public.cashback_settings;
drop policy if exists "Update Settings" on public.cashback_settings;
drop policy if exists "Admins can insert settings" on public.cashback_settings;
drop policy if exists "Insert Settings" on public.cashback_settings;
drop policy if exists "Everyone can read settings" on public.cashback_settings;
drop policy if exists "Read Settings" on public.cashback_settings;
drop policy if exists "Enable read access for all users" on public.cashback_settings;
drop policy if exists "Enable all access for admins" on public.cashback_settings;

-- 4. Cria Políticas Corretas
create policy "Read Settings" 
on public.cashback_settings for select 
to authenticated 
using (true);

create policy "Update Settings" 
on public.cashback_settings for update 
to authenticated 
using (
  exists (
    select 1 
    from public.profiles 
    where profiles.id = auth.uid() 
      and profiles.role in ('ADMIN', 'CEO', 'GERENTE')
  )
);

create policy "Insert Settings" 
on public.cashback_settings for insert 
to authenticated 
with check (
  exists (
    select 1 
    from public.profiles 
    where profiles.id = auth.uid() 
      and profiles.role in ('ADMIN', 'CEO')
  )
);

-- 5. Garante que existe o dado padrão
insert into public.cashback_settings (percentual_padrao, dias_validade)
select 5.00, 30
where not exists (select 1 from public.cashback_settings);
