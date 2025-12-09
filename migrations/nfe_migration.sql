CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  invoice_number text,
  status text NOT NULL DEFAULT 'disabled', -- disabled | pending | processing | approved | rejected | canceled
  xml_url text,
  pdf_url text,
  sefaz_protocol text,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id),
  action text,
  payload jsonb,
  response jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
