-- Execute este script no SQL Editor do Supabase para corrigir o erro de RLS ao finalizar pedidos.

-- 1. Recria a função create_order com SECURITY DEFINER e suporte a customer_id
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

-- 2. Garante permissões de execução para usuários anônimos e autenticados
grant execute on function create_order to anon, authenticated, service_role;
