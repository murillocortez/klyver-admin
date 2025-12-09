-- Tenta habilitar a extensão pg_cron caso não esteja
-- Nota: Em alguns planos/ambientes do Supabase, isso precisa ser feito pelo Dashboard em Database > Extensions.

create extension if not exists pg_cron with schema extensions;

-- Concede uso para postgres (padrão)
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- Agora tenta agendar novamente (se falhar, é erro de permissão ou plano)
select cron.schedule('0 0 * * *', $$select public.expire_cashback_daily()$$);
