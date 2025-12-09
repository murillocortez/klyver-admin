-- Update create_order to handle stock management via product_batches (FIFO)
CREATE OR REPLACE FUNCTION create_order(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_address TEXT,
  p_items JSONB,
  p_payment_method TEXT,
  p_delivery_method TEXT,
  p_delivery_fee NUMERIC,
  p_customer_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
  v_item JSONB;
  v_total NUMERIC := 0;
  v_product_id UUID;
  v_quantity INTEGER;
  v_remaining_qty INTEGER;
  v_batch RECORD;
BEGIN
  -- Find or create customer
  IF p_customer_id IS NOT NULL THEN
    v_customer_id := p_customer_id;
    -- Update customer info
    UPDATE customers SET name = p_customer_name, address = p_address WHERE id = v_customer_id;
  ELSE
    SELECT id INTO v_customer_id FROM customers WHERE phone = p_customer_phone;
    
    IF v_customer_id IS NULL THEN
      INSERT INTO customers (name, phone, address)
      VALUES (p_customer_name, p_customer_phone, p_address)
      RETURNING id INTO v_customer_id;
    ELSE
      UPDATE customers SET address = p_address, name = p_customer_name WHERE id = v_customer_id;
    END IF;
  END IF;

  -- Calculate total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_total := v_total + (v_item->>'price')::NUMERIC * (v_item->>'quantity')::INTEGER;
  END LOOP;
  v_total := v_total + p_delivery_fee;

  -- Create Order
  INSERT INTO orders (customer_id, total_amount, payment_method, delivery_method, delivery_address, delivery_fee, status)
  VALUES (v_customer_id, v_total, p_payment_method, p_delivery_method, p_address, p_delivery_fee, 'Pendente')
  RETURNING id INTO v_order_id;

  -- Create Order Items and Update Stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'productId')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;

    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (
      v_order_id, 
      v_product_id, 
      v_quantity, 
      (v_item->>'price')::NUMERIC
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

    -- Force decrement if still remaining (allow negative stock for tracking)
    IF v_remaining_qty > 0 THEN
      UPDATE product_batches
      SET quantity = quantity - v_remaining_qty
      WHERE id = (SELECT id FROM product_batches WHERE product_id = v_product_id ORDER BY created_at DESC LIMIT 1);
    END IF;

  END LOOP;

  RETURN jsonb_build_object('order_id', v_order_id, 'customer_id', v_customer_id);
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error creating order: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_order TO anon, authenticated, service_role;
