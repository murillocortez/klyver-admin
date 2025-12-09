-- Seed Data

-- Products
do $$
declare
  v_p1 uuid;
  v_p2 uuid;
  v_p3 uuid;
  v_p4 uuid;
  v_c1 uuid;
  v_c2 uuid;
  v_c3 uuid;
begin

-- Product 1
insert into products (name, description, sku, price, cost_price, category, requires_prescription, min_stock_threshold, status, unit, images)
values ('Paracetamol 500mg', 'Analgésico e antitérmico indicado para redução de febre e alívio de dores leves a moderadas.', '789123456001', 15.00, 8.50, 'OTC (Isento)', false, 20, 'active', 'cx 20 comp', ARRAY['https://picsum.photos/200/200?random=1'])
returning id into v_p1;

insert into product_batches (product_id, batch_number, quantity, expiry_date)
values (v_p1, 'L001', 100, '2025-12-31'), (v_p1, 'L002', 50, '2024-06-30');

-- Product 2
insert into products (name, description, sku, price, cost_price, category, requires_prescription, prescription_notes, min_stock_threshold, status, unit, images)
values ('Amoxicilina 875mg', 'Antibiótico de amplo espectro indicado para infecções bacterianas.', '789123456002', 45.50, 28.00, 'Medicamento', true, 'Retenção de receita obrigatória.', 10, 'active', 'cx 14 comp', ARRAY['https://picsum.photos/200/200?random=2'])
returning id into v_p2;

insert into product_batches (product_id, batch_number, quantity, expiry_date)
values (v_p2, 'L003', 40, '2024-11-20');

-- Product 3
insert into products (name, description, sku, price, promotional_price, cost_price, category, requires_prescription, min_stock_threshold, status, unit, images)
values ('Shampoo Anticaspa', 'Controle eficaz da caspa e oleosidade.', '789123456003', 32.90, 29.90, 15.00, 'Higiene', false, 10, 'active', 'frasco 200ml', ARRAY['https://picsum.photos/200/200?random=3'])
returning id into v_p3;

-- Product 4
insert into products (name, description, sku, price, cost_price, category, requires_prescription, min_stock_threshold, status, unit, images)
values ('Vitamina C 1g', 'Suplemento vitamínico efervescente.', '789123456004', 18.00, 9.00, 'Suplemento', false, 15, 'active', 'tubo 10 comp', ARRAY['https://picsum.photos/200/200?random=4'])
returning id into v_p4;

insert into product_batches (product_id, batch_number, quantity, expiry_date)
values (v_p4, 'L004', 60, '2023-11-15');

-- Customers
insert into customers (name, phone, email, address, total_spent, order_count, last_order_date, status)
values ('Maria Silva', '(11) 99999-1111', 'maria.silva@email.com', 'Rua das Flores, 123 - Centro', 450.00, 5, '2023-10-25', 'active')
returning id into v_c1;

insert into customers (name, phone, email, address, total_spent, order_count, last_order_date, status)
values ('João Santos', '(11) 98888-2222', 'joao.santos@email.com', 'Av. Paulista, 1000 - Bela Vista', 89.90, 1, '2023-10-26', 'active')
returning id into v_c2;

insert into customers (name, phone, email, address, total_spent, order_count, last_order_date, status)
values ('Ana Costa', '(21) 97777-3333', 'ana.costa@email.com', 'Rua do Porto, 50 - Porto', 1200.00, 12, '2023-10-20', 'active')
returning id into v_c3;

-- Orders (Mocking some orders)
insert into orders (customer_id, status, total_amount, payment_method, delivery_address, created_at)
values (v_c1, 'Pendente', 30.00, 'Pix', 'Rua das Flores, 123', now());

insert into orders (customer_id, status, total_amount, payment_method, delivery_address, created_at)
values (v_c2, 'Entregue', 29.90, 'Credit Card', 'Av. Paulista, 1000', now() - interval '1 day');

-- Settings
insert into store_settings (pharmacy_name, cnpj, address, phone, email, opening_hours, estimated_delivery_time, logo_url, primary_color, secondary_color, delivery_fee_type, fixed_delivery_fee, free_shipping_threshold, payment_pix_enabled, payment_credit_enabled, payment_debit_enabled, payment_cash_enabled, notification_low_stock, notification_new_order)
values ('PharmaDash Drugstore', '12.345.678/0001-90', 'Av. Principal, 100 - Centro, São Paulo - SP', '(11) 3000-0000', 'contato@pharmadash.com', 'Seg-Sáb 08:00 - 22:00', 45, 'https://cdn-icons-png.flaticon.com/512/3022/3022646.png', '#2563eb', '#1e40af', 'fixed', 5.90, 100.00, true, true, true, true, true, true);

end $$;

-- Plans & Subscriptions
do $$
declare
  v_plan_free uuid;
  v_plan_essential uuid;
  v_plan_pro uuid;
  v_plan_advanced uuid;
  v_plan_enterprise uuid;
  v_store_id uuid;
begin

-- Plans
insert into store_plans (name, code, price_month, price_year, limits, features)
values 
('Free / Start', 'free', 0, 0, '{"users":1,"orders":20,"products":50}', '["no_support"]'::jsonb)
returning id into v_plan_free;

insert into store_plans (name, code, price_month, price_year, limits, features)
values 
('Essencial', 'essential', 49.90, 499.00, '{"users":2,"orders":-1,"products":-1}', '["basic_stock","simple_reports"]'::jsonb)
returning id into v_plan_essential;

insert into store_plans (name, code, price_month, price_year, limits, features)
values 
('Profissional', 'pro', 99.90, 999.00, '{"users":5,"orders":-1,"products":-1}', '["crm","print_orders","team_roles","advanced_reports","auto_campaigns","whatsapp_support"]'::jsonb)
returning id into v_plan_pro;

insert into store_plans (name, code, price_month, price_year, limits, features)
values 
('Avançado', 'advanced', 199.90, 1999.00, '{"users":10,"orders":-1,"products":-1}', '["crm","print_orders","team_roles","advanced_reports","auto_campaigns","whatsapp_support","ai_description","smart_vip","meta_pixel","auto_seo","ai_banners"]'::jsonb)
returning id into v_plan_advanced;

insert into store_plans (name, code, price_month, price_year, limits, features)
values 
('Enterprise', 'enterprise', 499.90, 4999.00, '{"users":-1,"orders":-1,"products":-1}', '["crm","print_orders","team_roles","advanced_reports","auto_campaigns","whatsapp_support","ai_description","smart_vip","meta_pixel","auto_seo","ai_banners","multi_store","api_access","bi_reports","erp_integration","24h_support"]'::jsonb)
returning id into v_plan_enterprise;

-- Store
insert into stores (name) values ('Farma Vida') returning id into v_store_id;

-- Subscription (Default to Enterprise for Dev)
insert into store_subscriptions (store_id, plan_id, status, period, renew_at)
values (v_store_id, v_plan_enterprise, 'active', 'monthly', now() + interval '1 month');

end $$;

