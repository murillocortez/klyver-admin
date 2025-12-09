-- Migration to add support for multiple WhatsApp providers (Evolution API, etc)
ALTER TABLE notification_settings 
ADD COLUMN IF NOT EXISTS whatsapp_url TEXT, -- For Base URL (Evolution API)
ADD COLUMN IF NOT EXISTS whatsapp_instance TEXT; -- For Instance ID/Name

-- Rename/Reuse existing columns if needed, but adding new ones is safer for now to avoid confusion with 'whatsapp_business_number' which might be the sender number.
-- We will use:
-- whatsapp_api_key (already exists? inferred from types.ts usage, but DB schema showed whatsapp_token. Let's check DB schema mapping in service)
-- In service (Step 605): whatsapp_api_key in TS maps to ... wait.
-- The service 'saveSettings' did: 
-- whatsapp_api_key: settings.whatsapp_api_key
-- But supabase-types had whatsapp_token.
-- I need to align these. I will use 'whatsapp_token' in the DB and map 'whatsapp_api_key' to it, or strictly use 'whatsapp_token' in TS too.

-- Let's stick to adding the missing likely columns.
