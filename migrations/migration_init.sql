-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Dashboard Users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text check (role in ('ADMIN', 'MANAGER', 'OPERATOR')) default 'OPERATOR',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CUSTOMERS (Store Users)
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null unique,
  email text,
  address text,
  total_spent numeric default 0,
  order_count integer default 0,
  last_order_date timestamptz,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PRODUCTS
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  sku text unique,
  price numeric not null,
  promotional_price numeric,
  cost_price numeric,
  category text,
  custom_category text,
  requires_prescription boolean default false,
  prescription_notes text,
  min_stock_threshold integer default 5,
  status text default 'active',
  manufacturer text,
  unit text,
  instructions text,
  images text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PRODUCT BATCHES (Lots)
create table if not exists product_batches (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  batch_number text not null,
  quantity integer not null default 0,
  expiry_date date not null,
  created_at timestamptz default now()
);

-- ORDERS
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id),
  status text default 'Pendente',
  total_amount numeric not null,
  payment_method text,
  delivery_method text,
  delivery_address text,
  delivery_fee numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ORDER ITEMS
create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  batch_id uuid references product_batches(id),
  quantity integer not null,
  price_at_purchase numeric not null
);

-- SETTINGS
create table if not exists store_settings (
  id integer primary key generated always as identity,
  pharmacy_name text,
  cnpj text,
  address text,
  phone text,
  email text,
  opening_hours text,
  estimated_delivery_time integer,
  logo_url text,
  primary_color text,
  secondary_color text,
  delivery_fee_type text,
  fixed_delivery_fee numeric,
  free_shipping_threshold numeric,
  payment_pix_enabled boolean,
  payment_pix_key text,
  payment_credit_enabled boolean,
  payment_debit_enabled boolean,
  payment_cash_enabled boolean,
  notification_low_stock boolean,
  notification_new_order boolean
);

-- RLS
alter table profiles enable row level security;
alter table customers enable row level security;
alter table products enable row level security;
alter table product_batches enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table store_settings enable row level security;

-- POLICIES
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN')
);

create policy "Public read products" on products for select using (true);
create policy "Staff write products" on products for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('ADMIN', 'MANAGER'))
);

create policy "Public read batches" on product_batches for select using (true);
create policy "Staff write batches" on product_batches for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('ADMIN', 'MANAGER'))
);

create policy "Staff full access customers" on customers for all using (
  exists (select 1 from profiles where id = auth.uid())
);

create policy "Staff full access orders" on orders for all using (
  exists (select 1 from profiles where id = auth.uid())
);
create policy "Staff full access order_items" on order_items for all using (
  exists (select 1 from profiles where id = auth.uid())
);

create policy "Public read settings" on store_settings for select using (true);
create policy "Staff write settings" on store_settings for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'ADMIN')
);

-- FUNCTIONS

-- Handle New User
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'User'), 'OPERATOR');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create Order RPC
create or replace function create_order(
  p_customer_name text,
  p_customer_phone text,
  p_address text,
  p_items jsonb,
  p_payment_method text,
  p_delivery_method text,
  p_delivery_fee numeric,
  p_customer_id uuid default null
) returns jsonb as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_item jsonb;
  v_total numeric := 0;
begin
  -- Find or create customer
  if p_customer_id is not null then
    v_customer_id := p_customer_id;
    -- Update customer info
    update customers set name = p_customer_name, address = p_address where id = v_customer_id;
  else
    select id into v_customer_id from customers where phone = p_customer_phone;
    
    if v_customer_id is null then
      insert into customers (name, phone, address)
      values (p_customer_name, p_customer_phone, p_address)
      returning id into v_customer_id;
    else
      update customers set address = p_address, name = p_customer_name where id = v_customer_id;
    end if;
  end if;

  -- Calculate total
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_total := v_total + (v_item->>'price')::numeric * (v_item->>'quantity')::integer;
  end loop;
  v_total := v_total + p_delivery_fee;

  -- Create Order
  insert into orders (customer_id, total_amount, payment_method, delivery_method, delivery_address, delivery_fee)
  values (v_customer_id, v_total, p_payment_method, p_delivery_method, p_address, p_delivery_fee)
  returning id into v_order_id;

  -- Create Order Items
  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into order_items (order_id, product_id, quantity, price_at_purchase)
    values (
      v_order_id, 
      (v_item->>'productId')::uuid, 
      (v_item->>'quantity')::integer, 
      (v_item->>'price')::numeric
    );
  end loop;

  return jsonb_build_object('order_id', v_order_id, 'customer_id', v_customer_id);
end;
$$ language plpgsql security definer;

-- View for Products with Stock
create or replace view product_stock_view as
select 
  p.*,
  coalesce(sum(pb.quantity), 0) as stock_total
from products p
left join product_batches pb on p.id = pb.product_id and pb.expiry_date >= current_date
group by p.id;

-- STORES & SUBSCRIPTIONS

-- STORES
create table if not exists stores (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- STORE PLANS
create table if not exists store_plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text not null,
  price_month numeric,
  price_year numeric,
  limits jsonb,
  features jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- STORE SUBSCRIPTIONS
create table if not exists store_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  store_id uuid references stores(id) not null,
  plan_id uuid references store_plans(id) not null,
  status text not null check (status in ('active', 'past_due', 'canceled')),
  period text not null check (period in ('monthly', 'yearly')),
  renew_at timestamptz,
  payment_provider text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for New Tables
alter table stores enable row level security;
alter table store_plans enable row level security;
alter table store_subscriptions enable row level security;

-- Policies
create policy "Public read plans" on store_plans for select using (true);

create policy "Auth read stores" on stores for select using (true);

create policy "Auth read subscriptions" on store_subscriptions for select using (true);
create policy "Auth update subscriptions" on store_subscriptions for update using (true);
