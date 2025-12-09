-- Create a secure function to handle PDV sales with Batch Management
-- Fixed: Use 'Entregue' status to match frontend Enum
CREATE OR REPLACE FUNCTION create_pdv_sale(
  p_customer_id UUID,
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_amount_paid NUMERIC,
  p_change_amount NUMERIC,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_price NUMERIC;
  v_original_price NUMERIC;
  v_discount NUMERIC;
  v_customer_total_spent NUMERIC;
  v_customer_purchase_count INTEGER;
  v_is_vip BOOLEAN;
  v_remaining_qty INTEGER;
  v_batch RECORD;
BEGIN
  -- 1. Insert Order
  INSERT INTO orders (
    customer_id,
    total_amount,
    status,
    payment_method,
    origin,
    amount_paid,
    change_amount,
    cashier_id,
    created_at
  ) VALUES (
    p_customer_id,
    p_total_amount,
    'Entregue', -- Changed from 'delivered' to match OrderStatus.DELIVERED
    p_payment_method,
    'presencial',
    p_amount_paid,
    p_change_amount,
    auth.uid(),
    NOW()
  ) RETURNING id INTO v_order_id;

  -- 2. Process Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    v_price := (v_item->>'priceAtPurchase')::NUMERIC;
    v_original_price := (v_item->>'originalPrice')::NUMERIC;
    v_discount := (v_item->>'discountApplied')::NUMERIC;

    -- Insert Order Item
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      price_at_purchase,
      original_price,
      discount_applied
    ) VALUES (
      v_order_id,
      v_product_id,
      v_quantity,
      v_price,
      v_original_price,
      v_discount
    );

    -- Update Stock (FIFO Strategy on Batches)
    v_remaining_qty := v_quantity;
    
    FOR v_batch IN 
      SELECT id, quantity 
      FROM product_batches 
      WHERE product_id = v_product_id AND quantity > 0 
      ORDER BY expiry_date ASC NULLS LAST, created_at ASC
    LOOP
      IF v_remaining_qty <= 0 THEN EXIT; END IF;

      IF v_batch.quantity >= v_remaining_qty THEN
        UPDATE product_batches SET quantity = quantity - v_remaining_qty WHERE id = v_batch.id;
        v_remaining_qty := 0;
      ELSE
        UPDATE product_batches SET quantity = 0 WHERE id = v_batch.id;
        v_remaining_qty := v_remaining_qty - v_batch.quantity;
      END IF;
    END LOOP;

    -- Force decrement if still remaining
    IF v_remaining_qty > 0 THEN
      UPDATE product_batches
      SET quantity = quantity - v_remaining_qty
      WHERE id = (SELECT id FROM product_batches WHERE product_id = v_product_id ORDER BY created_at DESC LIMIT 1);
    END IF;
    
  END LOOP;

  -- 3. Update Customer Stats
  IF p_customer_id IS NOT NULL THEN
    SELECT COALESCE(SUM(total_amount), 0), COUNT(*) INTO v_customer_total_spent, v_customer_purchase_count
    FROM orders WHERE customer_id = p_customer_id;
    
    v_is_vip := (v_customer_total_spent > 1000 OR v_customer_purchase_count > 10);

    UPDATE customers SET 
      total_spent = v_customer_total_spent,
      purchase_count = v_customer_purchase_count,
      last_purchase_date = NOW(),
      is_vip = v_is_vip
    WHERE id = p_customer_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_pdv_sale TO authenticated;

-- Fix existing orders
UPDATE orders SET status = 'Entregue' WHERE status = 'delivered';
