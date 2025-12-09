# Klyver Admin - Painel Administrativo Farmácia

## Instalação

```bash
npm install
```

## Variáveis de Ambiente (.env)

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_DEFAULT_TENANT_SLUG_ADMIN=farma-vida
```

## Rodar Localmente

```bash
npm run dev
# Acesso: http://localhost:5173/farma-vida/dashboard
```

## Deploy (Vercel)

1. Importe este repositório/pasta na Vercel.
2. Configure as variáveis de ambiente.
3. Certifique-se de que o Output Directory seja `dist`.
