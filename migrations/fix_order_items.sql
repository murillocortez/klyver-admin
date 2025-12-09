-- Add missing columns to order_items for PDV
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS original_price NUMERIC;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS discount_applied NUMERIC DEFAULT 0;
