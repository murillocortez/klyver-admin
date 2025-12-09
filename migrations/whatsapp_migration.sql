-- Create table for storing WhatsApp notification logs
CREATE TABLE IF NOT EXISTS whatsapp_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    customer_id UUID REFERENCES customers(id),
    message TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'simulated')),
    response_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for storing Notification Settings
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    whatsapp_provider TEXT DEFAULT 'simulated', -- ultramsg, zapapi, etc
    whatsapp_api_key TEXT,
    whatsapp_business_number TEXT,
    
    -- Event Toggles
    send_on_created BOOLEAN DEFAULT TRUE,
    send_on_approved BOOLEAN DEFAULT TRUE,
    send_on_delivery_start BOOLEAN DEFAULT TRUE,
    send_on_ready_for_pickup BOOLEAN DEFAULT TRUE,
    send_on_delivered BOOLEAN DEFAULT TRUE,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated users (admins)
CREATE POLICY "Allow full access to whatsapp_notifications for authenticated"
ON whatsapp_notifications FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow full access to notification_settings for authenticated"
ON notification_settings FOR ALL TO authenticated USING (true);

-- Insert default settings if not exists
INSERT INTO notification_settings (whatsapp_enabled, whatsapp_provider, send_on_created)
SELECT false, 'simulated', true
WHERE NOT EXISTS (SELECT 1 FROM notification_settings);
