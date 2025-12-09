-- CORREÇÃO DE PERMISSÕES E DADOS - CASHBACK (FINAL)
-- Execute este script no SQL Editor do Supabase para corrigir o erro "Erro ao salvar" e "Não aparece nada".

-- 1. Remover políticas antigas que podem estar conflitando ou quebradas
drop policy if exists "Admins can update settings" on public.cashback_settings;
drop policy if exists "Admins can insert settings" on public.cashback_settings;
drop policy if exists "Everyone can read settings" on public.cashback_settings;
drop policy if exists "Enable read access for all users" on public.cashback_settings;
drop policy if exists "Enable all access for admins" on public.cashback_settings;

-- 2. Criar Políticas Robustas (usando a tabela 'profiles' diretamente)

-- LEITURA: Qualquer usuário logado pode ler as configurações (para ver quantos % ganha)
create policy "Read Settings" 
on public.cashback_settings for select 
to authenticated 
using (true);

-- ATUALIZAÇÃO: Apenas Admin, CEO e Gerente podem alterar
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

-- INSERÇÃO: Apenas Admin e CEO podem criar a configuração inicial (se não existir)
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

-- 3. GARANTIA DE DADOS: Insere a configuração padrão se a tabela estiver vazia
-- Isso corrige o problema de "não aparecer nada" na tela.
insert into public.cashback_settings (percentual_padrao, dias_validade)
select 5.00, 30
where not exists (select 1 from public.cashback_settings);
