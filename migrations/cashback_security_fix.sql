-- Ajuste de segurança para permitir que clientes vejam suas próprias carteiras e transações

-- Remover policies antigas se existirem (para evitar conflito ou duplicação mal feita)
drop policy if exists "Admins can all wallet" on public.cashback_wallet;
drop policy if exists "Admins can all transactions" on public.cashback_transactions;

-- Novas Policies

-- WALLET
-- 1. Admin vê tudo
create policy "Admins view all wallets" 
on public.cashback_wallet for select 
using (auth.role() = 'authenticated' and (public.get_user_role(auth.uid()) in ('ADMIN', 'CEO', 'GERENTE')));

-- 2. Cliente vê apenas a sua
create policy "Customers view own wallet" 
on public.cashback_wallet for select 
using (auth.uid() = customer_id);

-- TRANSACTIONS
-- 1. Admin vê tudo
create policy "Admins view all transactions" 
on public.cashback_transactions for select 
using (auth.role() = 'authenticated' and (public.get_user_role(auth.uid()) in ('ADMIN', 'CEO', 'GERENTE')));

-- 2. Cliente vê apenas as suas
create policy "Customers view own transactions" 
on public.cashback_transactions for select 
using (auth.uid() = customer_id);

-- SETTINGS
-- (Já existe leitura publica/autenticada, mas escrita restrita)
drop policy if exists "Enable read access for all users" on public.cashback_settings;
create policy "Everyone can read settings" on public.cashback_settings for select using (true);

create policy "Admins can update settings" 
on public.cashback_settings for update 
using (public.get_user_role(auth.uid()) in ('ADMIN', 'CEO'));

create policy "Admins can insert settings" 
on public.cashback_settings for insert 
with check (public.get_user_role(auth.uid()) in ('ADMIN', 'CEO'));
