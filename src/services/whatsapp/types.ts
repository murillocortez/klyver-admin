export interface NotificationSettingsData {
    id?: string;
    whatsapp_enabled: boolean;
    whatsapp_provider: 'ultramsg' | 'evolution_api' | 'zapapi' | 'whatsapp_business' | 'twilio' | 'simulated';
    whatsapp_api_key?: string; // Token/API Key
    whatsapp_business_number?: string; // Sender Number or Phone ID

    // New fields for specific providers (e.g. Evolution API)
    whatsapp_url?: string; // Base URL
    whatsapp_instance?: string; // Instance Name/ID

    send_on_created: boolean;
    send_on_approved: boolean;
    send_on_delivery_start: boolean;
    send_on_ready_for_pickup: boolean;
    send_on_delivered: boolean;

    updated_at?: string;
}

export interface WhatsappLog {
    id: string;
    order_id?: string;
    customer_id?: string;
    message: string;
    status: 'sent' | 'failed' | 'simulated';
    response_json?: any;
    created_at: string;
}
