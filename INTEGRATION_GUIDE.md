# Guia de Integração Farma Vida + Supabase

Este guia documenta a integração das aplicações `farma-vida-loja` (Dashboard) e `farma-vida-store` (Loja) com o Supabase.

## 1. Configuração do Supabase

O projeto foi configurado com o ID: `nezmauiwtoersiwtpjmd`.

### Banco de Dados
As seguintes tabelas foram criadas:
- `profiles`: Perfis de usuários do Dashboard (Admin, Manager, Operator).
- `customers`: Clientes da Loja.
- `products`: Catálogo de produtos.
- `product_batches`: Lotes e validade.
- `orders`: Pedidos.
- `order_items`: Itens do pedido.
- `store_settings`: Configurações da loja.

### Autenticação
- **Dashboard**: Utiliza Supabase Auth (Email/Senha).
- **Loja**: Utiliza identificação por Nome + Telefone (sem senha/SMS), gerenciada via tabela `customers` e RPC `create_order`.

### Funções (RPC)
- `create_order`: Cria um pedido atomicamente, atualizando ou criando o cliente se necessário.
- `handle_new_user`: Trigger para criar perfil automaticamente ao registrar usuário no Auth.

## 2. Aplicações

### Farma Vida Loja (Dashboard)
- **Localização**: `farma-vida-loja`
- **Alterações**:
  - `services/supabase.ts`: Cliente Supabase configurado.
  - `services/dbService.ts`: Reescrevido para usar Supabase em vez de dados mockados.
  - `App.tsx`: Atualizado para usar `supabase.auth` para gerenciamento de sessão.
  - `pages/Login.tsx`: Atualizado para realizar login via Supabase.

### Farma Vida Store (Cliente)
- **Localização**: `farma-vida-store`
- **Alterações**:
  - `services/supabase.ts`: Cliente Supabase configurado.
  - `pages/Home.tsx`: Busca produtos do Supabase (tabela `products`).
  - `pages/Checkout.tsx`: Envia pedidos via RPC `create_order`.

## 3. Como Rodar

1. **Instalar Dependências**:
   Execute `npm install` em ambas as pastas (`farma-vida-loja` e `farma-vida-store`).

2. **Rodar Dashboard**:
   ```bash
   cd farma-vida-loja
   npm run dev
   ```
   Acesse em `http://localhost:5173` (ou porta indicada).
   Login inicial: Crie um usuário no Supabase Auth ou use o registro se habilitado.

3. **Rodar Loja**:
   ```bash
   cd farma-vida-store
   npm run dev
   ```
   Acesse em `http://localhost:5174` (ou porta indicada).

## 4. Próximos Passos
- **Segurança**: Configurar Policies RLS mais restritivas para produção.
- **Webhooks**: Configurar webhooks no Supabase para notificar eventos (ex: novo pedido).
- **Sincronização**: Implementar jobs para limpeza de estoque expirado (pode ser feito com pg_cron no Supabase).
