export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "13.0.5"
    }
    public: {
        Tables: {
            cmed_cache: {
                Row: {
                    created_at: string
                    id: string
                    query: string
                    response_json: Json
                }
                Insert: {
                    created_at?: string
                    id?: string
                    query: string
                    response_json: Json
                }
                Update: {
                    created_at?: string
                    id?: string
                    query?: string
                    response_json?: Json
                }
                Relationships: []
            }
            cmed_prices: {
                Row: {
                    active_ingredient: string | null
                    drug_name: string | null
                    id: string
                    laboratory: string | null
                    last_update: string | null
                    pf_value: number | null
                    pmc_value: number | null
                    pmvg_value: number | null
                    presentation: string | null
                    registration_number: string | null
                    therapeutic_class: string | null
                }
                Insert: {
                    active_ingredient?: string | null
                    drug_name?: string | null
                    id?: string
                    laboratory?: string | null
                    last_update?: string | null
                    pf_value?: number | null
                    pmc_value?: number | null
                    pmvg_value?: number | null
                    presentation?: string | null
                    registration_number?: string | null
                    therapeutic_class?: string | null
                }
                Update: {
                    active_ingredient?: string | null
                    drug_name?: string | null
                    id?: string
                    laboratory?: string | null
                    last_update?: string | null
                    pf_value?: number | null
                    pmc_value?: number | null
                    pmvg_value?: number | null
                    presentation?: string | null
                    registration_number?: string | null
                    therapeutic_class?: string | null
                }
                Relationships: []
            }
            customers: {
                Row: {
                    address: string | null
                    birth_date: string | null
                    cpf: string | null
                    created_at: string
                    email: string | null
                    id: string
                    insurance_plan_id: string | null
                    internal_notes: string | null
                    name: string
                    phone: string
                    referrer: string | null
                    status: string
                    tags: string[] | null
                    updated_at: string
                }
                Insert: {
                    address?: string | null
                    birth_date?: string | null
                    cpf?: string | null
                    created_at?: string
                    email?: string | null
                    id?: string
                    insurance_plan_id?: string | null
                    internal_notes?: string | null
                    name: string
                    phone: string
                    referrer?: string | null
                    status?: string
                    tags?: string[] | null
                    updated_at?: string
                }
                Update: {
                    address?: string | null
                    birth_date?: string | null
                    cpf?: string | null
                    created_at?: string
                    email?: string | null
                    id?: string
                    insurance_plan_id?: string | null
                    internal_notes?: string | null
                    name?: string
                    phone?: string
                    referrer?: string | null
                    status?: string
                    tags?: string[] | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "customers_insurance_plan_id_fkey"
                        columns: ["insurance_plan_id"]
                        isOneToOne: false
                        referencedRelation: "health_insurance_plans"
                        referencedColumns: ["id"]
                    },
                ]
            }
            daily_offers: {
                Row: {
                    active: boolean | null
                    created_at: string
                    id: string
                    image_url: string | null
                    product_id: string | null
                    subtitle: string | null
                    title: string
                    updated_at: string
                }
                Insert: {
                    active?: boolean | null
                    created_at?: string
                    id?: string
                    image_url?: string | null
                    product_id?: string | null
                    subtitle?: string | null
                    title: string
                    updated_at?: string
                }
                Update: {
                    active?: boolean | null
                    created_at?: string
                    id?: string
                    image_url?: string | null
                    product_id?: string | null
                    subtitle?: string | null
                    title?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "daily_offers_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            favorites: {
                Row: {
                    created_at: string
                    id: string
                    product_id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    product_id: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    product_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "favorites_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "favorites_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "customers"
                        referencedColumns: ["id"]
                    },
                ]
            }
            fiscal_documents: {
                Row: {
                    created_at: string
                    id: string
                    order_id: string | null
                    pdf_url: string | null
                    provider: string
                    raw_response: Json | null
                    status: string
                    type: string
                    updated_at: string
                    xml_url: string | null
                }
                Insert: {
                    created_at?: string
                    id?: string
                    order_id?: string | null
                    pdf_url?: string | null
                    provider: string
                    raw_response?: Json | null
                    status?: string
                    type: string
                    updated_at?: string
                    xml_url?: string | null
                }
                Update: {
                    created_at?: string
                    id?: string
                    order_id?: string | null
                    pdf_url?: string | null
                    provider?: string
                    raw_response?: Json | null
                    status?: string
                    type?: string
                    updated_at?: string
                    xml_url?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "fiscal_documents_order_id_fkey"
                        columns: ["order_id"]
                        isOneToOne: false
                        referencedRelation: "orders"
                        referencedColumns: ["id"]
                    }
                ]
            }
            fiscal_settings: {
                Row: {
                    ecf_endpoint_url: string | null
                    id: string
                    last_updated: string | null
                    mode: string
                    nfe_provider: string | null
                    sat_endpoint_url: string | null
                    store_id: string
                }
                Insert: {
                    ecf_endpoint_url?: string | null
                    id?: string
                    last_updated?: string | null
                    mode?: string
                    nfe_provider?: string | null
                    sat_endpoint_url?: string | null
                    store_id: string
                }
                Update: {
                    ecf_endpoint_url?: string | null
                    id?: string
                    last_updated?: string | null
                    mode?: string
                    nfe_provider?: string | null
                    sat_endpoint_url?: string | null
                    store_id?: string
                }
                Relationships: []
            }
            health_insurance_plans: {
                Row: {
                    created_at: string
                    discount_percent: number
                    id: string
                    name: string
                    rules: Json | null
                }
                Insert: {
                    created_at?: string
                    discount_percent?: number
                    id?: string
                    name: string
                    rules?: Json | null
                }
                Update: {
                    created_at?: string
                    discount_percent?: number
                    id?: string
                    name?: string
                    rules?: Json | null
                }
                Relationships: []
            }
            invoice_logs: {
                Row: {
                    action: string | null
                    details: Json | null
                    id: string
                    invoice_id: string | null
                    payload: Json | null
                    response: Json | null
                    timestamp: string
                }
                Insert: {
                    action?: string | null
                    details?: Json | null
                    id?: string
                    invoice_id?: string | null
                    payload?: Json | null
                    response?: Json | null
                    timestamp?: string
                }
                Update: {
                    action?: string | null
                    details?: Json | null
                    id?: string
                    invoice_id?: string | null
                    payload?: Json | null
                    response?: Json | null
                    timestamp?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "invoice_logs_invoice_id_fkey"
                        columns: ["invoice_id"]
                        isOneToOne: false
                        referencedRelation: "invoices"
                        referencedColumns: ["id"]
                    },
                ]
            }
            invoices: {
                Row: {
                    created_at: string
                    error_message: string | null
                    id: string
                    invoice_number: string | null
                    order_id: string | null
                    pdf_url: string | null
                    provider: string | null
                    sefaz_protocol: string | null
                    status: string
                    xml_url: string | null
                }
                Insert: {
                    created_at?: string
                    error_message?: string | null
                    id?: string
                    invoice_number?: string | null
                    order_id?: string | null
                    pdf_url?: string | null
                    provider?: string | null
                    sefaz_protocol?: string | null
                    status?: string
                    xml_url?: string | null
                }
                Update: {
                    created_at?: string
                    error_message?: string | null
                    id?: string
                    invoice_number?: string | null
                    order_id?: string | null
                    pdf_url?: string | null
                    provider?: string | null
                    sefaz_protocol?: string | null
                    status?: string
                    xml_url?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "invoices_order_id_fkey"
                        columns: ["order_id"]
                        isOneToOne: false
                        referencedRelation: "orders"
                        referencedColumns: ["id"]
                    },
                ]
            }
            newsletter_subscribers: {
                Row: {
                    created_at: string
                    email: string
                    id: string
                }
                Insert: {
                    created_at?: string
                    email: string
                    id?: string
                }
                Update: {
                    created_at?: string
                    email?: string
                    id?: string
                }
                Relationships: []
            }
            notifications: {
                Row: {
                    created_at: string
                    id: string
                    message: string
                    read: boolean
                    title: string
                    type: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    message: string
                    read?: boolean
                    title: string
                    type: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    message?: string
                    read?: boolean
                    title?: string
                    type?: string
                }
                Relationships: []
            }
            order_items: {
                Row: {
                    batch_id: string | null
                    discount_applied: number | null
                    id: string
                    order_id: string | null
                    original_price: number | null
                    price_at_purchase: number
                    product_id: string | null
                    quantity: number
                }
                Insert: {
                    batch_id?: string | null
                    discount_applied?: number | null
                    id?: string
                    order_id?: string | null
                    original_price?: number | null
                    price_at_purchase: number
                    product_id?: string | null
                    quantity: number
                }
                Update: {
                    batch_id?: string | null
                    discount_applied?: number | null
                    id?: string
                    order_id?: string | null
                    original_price?: number | null
                    price_at_purchase?: number
                    product_id?: string | null
                    quantity?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "order_items_batch_id_fkey"
                        columns: ["batch_id"]
                        isOneToOne: false
                        referencedRelation: "product_batches"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "order_items_order_id_fkey"
                        columns: ["order_id"]
                        isOneToOne: false
                        referencedRelation: "orders"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "order_items_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            orders: {
                Row: {
                    amount_paid: number | null
                    cancellation_reason: string | null
                    cashier_id: string | null
                    change_amount: number | null
                    created_at: string
                    customer_id: string | null
                    delivery_address: string | null
                    id: string
                    origin: string
                    payment_method: string
                    status: string
                    total_amount: number
                    updated_at: string
                }
                Insert: {
                    amount_paid?: number | null
                    cancellation_reason?: string | null
                    cashier_id?: string | null
                    change_amount?: number | null
                    created_at?: string
                    customer_id?: string | null
                    delivery_address?: string | null
                    id?: string
                    origin?: string
                    payment_method: string
                    status?: string
                    total_amount: number
                    updated_at?: string
                }
                Update: {
                    amount_paid?: number | null
                    cancellation_reason?: string | null
                    cashier_id?: string | null
                    change_amount?: number | null
                    created_at?: string
                    customer_id?: string | null
                    delivery_address?: string | null
                    id?: string
                    origin?: string
                    payment_method?: string
                    status?: string
                    total_amount?: number
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "orders_customer_id_fkey"
                        columns: ["customer_id"]
                        isOneToOne: false
                        referencedRelation: "customers"
                        referencedColumns: ["id"]
                    },
                ]
            }
            price_history: {
                Row: {
                    changed_by: string | null
                    created_at: string
                    field_name: string
                    id: string
                    new_value: string | null
                    old_value: string | null
                    product_id: string | null
                }
                Insert: {
                    changed_by?: string | null
                    created_at?: string
                    field_name: string
                    id?: string
                    new_value?: string | null
                    old_value?: string | null
                    product_id?: string | null
                }
                Update: {
                    changed_by?: string | null
                    created_at?: string
                    field_name?: string
                    id?: string
                    new_value?: string | null
                    old_value?: string | null
                    product_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "price_history_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            product_batches: {
                Row: {
                    batch_number: string
                    created_at: string
                    expiry_date: string
                    id: string
                    product_id: string | null
                    quantity: number
                }
                Insert: {
                    batch_number: string
                    created_at?: string
                    expiry_date: string
                    id?: string
                    product_id?: string | null
                    quantity: number
                }
                Update: {
                    batch_number?: string
                    created_at?: string
                    expiry_date?: string
                    id?: string
                    product_id?: string | null
                    quantity?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "product_batches_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            products: {
                Row: {
                    category: string
                    cost_price: number | null
                    created_at: string
                    custom_category: string | null
                    description: string | null
                    desired_margin_percent: number | null
                    expiry_alert_threshold: number | null
                    id: string
                    images: string[] | null
                    instructions: string | null
                    manual_margin: boolean | null
                    manufacturer: string | null
                    min_stock_threshold: number
                    name: string
                    pmc_price: number | null
                    prescription_notes: string | null
                    price: number
                    promotional_price: number | null
                    real_margin: number | null
                    requires_prescription: boolean
                    sku: string | null
                    status: string
                    suggested_price: number | null
                    unit: string
                    updated_at: string
                }
                Insert: {
                    category: string
                    cost_price?: number | null
                    created_at?: string
                    custom_category?: string | null
                    description?: string | null
                    desired_margin_percent?: number | null
                    expiry_alert_threshold?: number | null
                    id?: string
                    images?: string[] | null
                    instructions?: string | null
                    manual_margin?: boolean | null
                    manufacturer?: string | null
                    min_stock_threshold?: number
                    name: string
                    pmc_price?: number | null
                    prescription_notes?: string | null
                    price: number
                    promotional_price?: number | null
                    real_margin?: number | null
                    requires_prescription?: boolean
                    sku?: string | null
                    status?: string
                    suggested_price?: number | null
                    unit?: string
                    updated_at?: string
                }
                Update: {
                    category?: string
                    cost_price?: number | null
                    created_at?: string
                    custom_category?: string | null
                    description?: string | null
                    desired_margin_percent?: number | null
                    expiry_alert_threshold?: number | null
                    id?: string
                    images?: string[] | null
                    instructions?: string | null
                    manual_margin?: boolean | null
                    manufacturer?: string | null
                    min_stock_threshold?: number
                    name?: string
                    pmc_price?: number | null
                    prescription_notes?: string | null
                    price?: number
                    promotional_price?: number | null
                    real_margin?: number | null
                    requires_prescription?: boolean
                    sku?: string | null
                    status?: string
                    suggested_price?: number | null
                    unit?: string
                    updated_at?: string
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    full_name: string | null
                    id: string
                    role: string
                    updated_at: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    full_name?: string | null
                    id: string
                    role?: string
                    updated_at?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    full_name?: string | null
                    id?: string
                    role?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            store_plans: {
                Row: {
                    created_at: string
                    features: string[] | null
                    id: string
                    name: string
                    price_month: number
                    price_year: number
                }
                Insert: {
                    created_at?: string
                    features?: string[] | null
                    id?: string
                    name: string
                    price_month: number
                    price_year: number
                }
                Update: {
                    created_at?: string
                    features?: string[] | null
                    id?: string
                    name?: string
                    price_month?: number
                    price_year?: number
                }
                Relationships: []
            }
            store_settings: {
                Row: {
                    additional_pharmacists: Json | null
                    address: string
                    api_token: string | null
                    banner_url: string | null
                    cnae: string | null
                    cnpj: string
                    created_at: string
                    delivery_fee_type: string
                    email: string
                    enotas_enabled: boolean | null
                    estimated_delivery_time: number
                    fiscal_api_key: string | null
                    fiscal_certificate_password: string | null
                    fiscal_certificate_url: string | null
                    fiscal_company_id: string | null
                    fiscal_provider: string | null
                    fixed_delivery_fee: number
                    free_shipping_threshold: number
                    id: string
                    ie: string | null
                    im: string | null
                    logo_url: string | null
                    notification_email_channel: boolean
                    notification_low_stock: boolean
                    notification_new_order: boolean
                    notification_push_channel: boolean
                    opening_hours: string
                    payment_cash_enabled: boolean
                    payment_credit_enabled: boolean
                    payment_credit_max_installments: number
                    payment_debit_enabled: boolean
                    payment_pix_enabled: boolean
                    payment_pix_key: string | null
                    pharmacist_name: string | null
                    pharmacist_register: string | null
                    pharmacy_name: string
                    phone: string
                    primary_color: string
                    secondary_color: string
                    social_facebook: string | null
                    social_instagram: string | null
                    social_linkedin: string | null
                    social_tiktok: string | null
                    social_twitter: string | null
                    social_whatsapp: string | null
                    tax_regime: string | null
                    updated_at: string
                    vip_discount_percentage: number
                    vip_enabled: boolean
                    vip_inactivity_days: number
                    vip_min_order_count: number
                    vip_min_spent: number
                    welcome_message: string | null
                    welcome_message_bg_color: string | null
                    welcome_message_text_color: string | null
                }
                Insert: {
                    additional_pharmacists?: Json | null
                    address: string
                    api_token?: string | null
                    banner_url?: string | null
                    cnae?: string | null
                    cnpj: string
                    created_at?: string
                    delivery_fee_type?: string
                    email: string
                    enotas_enabled?: boolean | null
                    estimated_delivery_time?: number
                    fiscal_api_key?: string | null
                    fiscal_certificate_password?: string | null
                    fiscal_certificate_url?: string | null
                    fiscal_company_id?: string | null
                    fiscal_provider?: string | null
                    fixed_delivery_fee?: number
                    free_shipping_threshold?: number
                    id?: string
                    ie?: string | null
                    im?: string | null
                    logo_url?: string | null
                    notification_email_channel?: boolean
                    notification_low_stock?: boolean
                    notification_new_order?: boolean
                    notification_push_channel?: boolean
                    opening_hours: string
                    payment_cash_enabled?: boolean
                    payment_credit_enabled?: boolean
                    payment_credit_max_installments?: number
                    payment_debit_enabled?: boolean
                    payment_pix_enabled?: boolean
                    payment_pix_key?: string | null
                    pharmacist_name?: string | null
                    pharmacist_register?: string | null
                    pharmacy_name: string
                    phone: string
                    primary_color?: string
                    secondary_color?: string
                    social_facebook?: string | null
                    social_instagram?: string | null
                    social_linkedin?: string | null
                    social_tiktok?: string | null
                    social_twitter?: string | null
                    social_whatsapp?: string | null
                    tax_regime?: string | null
                    updated_at?: string
                    vip_discount_percentage?: number
                    vip_enabled?: boolean
                    vip_inactivity_days?: number
                    vip_min_order_count?: number
                    vip_min_spent?: number
                    welcome_message?: string | null
                    welcome_message_bg_color?: string | null
                    welcome_message_text_color?: string | null
                }
                Update: {
                    additional_pharmacists?: Json | null
                    address?: string
                    api_token?: string | null
                    banner_url?: string | null
                    cnae?: string | null
                    cnpj?: string
                    created_at?: string
                    delivery_fee_type?: string
                    email?: string
                    enotas_enabled?: boolean | null
                    estimated_delivery_time?: number
                    fiscal_api_key?: string | null
                    fiscal_certificate_password?: string | null
                    fiscal_certificate_url?: string | null
                    fiscal_company_id?: string | null
                    fiscal_provider?: string | null
                    fixed_delivery_fee?: number
                    free_shipping_threshold?: number
                    id?: string
                    ie?: string | null
                    im?: string | null
                    logo_url?: string | null
                    notification_email_channel?: boolean
                    notification_low_stock?: boolean
                    notification_new_order?: boolean
                    notification_push_channel?: boolean
                    opening_hours?: string
                    payment_cash_enabled?: boolean
                    payment_credit_enabled?: boolean
                    payment_credit_max_installments?: number
                    payment_debit_enabled?: boolean
                    payment_pix_enabled?: boolean
                    payment_pix_key?: string | null
                    pharmacist_name?: string | null
                    pharmacist_register?: string | null
                    pharmacy_name?: string
                    phone?: string
                    primary_color?: string
                    secondary_color?: string
                    social_facebook?: string | null
                    social_instagram?: string | null
                    social_linkedin?: string | null
                    social_tiktok?: string | null
                    social_twitter?: string | null
                    social_whatsapp?: string | null
                    tax_regime?: string | null
                    updated_at?: string
                    vip_discount_percentage?: number
                    vip_enabled?: boolean
                    vip_inactivity_days?: number
                    vip_min_order_count?: number
                    vip_min_spent?: number
                    welcome_message?: string | null
                    welcome_message_bg_color?: string | null
                    welcome_message_text_color?: string | null
                }
                Relationships: []
            }
            notification_settings: {
                Row: {
                    created_at: string
                    id: string
                    send_on_approved: boolean
                    send_on_created: boolean
                    send_on_delivered: boolean
                    send_on_delivery_start: boolean
                    send_on_ready_for_pickup: boolean
                    updated_at: string
                    whatsapp_business_id: string | null
                    whatsapp_enabled: boolean
                    whatsapp_instance_id: string | null
                    whatsapp_provider: string
                    whatsapp_token: string | null
                }
                Insert: {
                    created_at?: string
                    id?: string
                    send_on_approved?: boolean
                    send_on_created?: boolean
                    send_on_delivered?: boolean
                    send_on_delivery_start?: boolean
                    send_on_ready_for_pickup?: boolean
                    updated_at?: string
                    whatsapp_business_id?: string | null
                    whatsapp_enabled?: boolean
                    whatsapp_instance_id?: string | null
                    whatsapp_provider?: string
                    whatsapp_token?: string | null
                }
                Update: {
                    created_at?: string
                    id?: string
                    send_on_approved?: boolean
                    send_on_created?: boolean
                    send_on_delivered?: boolean
                    send_on_delivery_start?: boolean
                    send_on_ready_for_pickup?: boolean
                    updated_at?: string
                    whatsapp_business_id?: string | null
                    whatsapp_enabled?: boolean
                    whatsapp_instance_id?: string | null
                    whatsapp_provider?: string
                    whatsapp_token?: string | null
                }
                Relationships: []
            }
            whatsapp_notifications: {
                Row: {
                    created_at: string
                    customer_id: string | null
                    error_message: string | null
                    id: string
                    message: string
                    order_id: string | null
                    phone: string
                    provider: string
                    provider_message_id: string | null
                    status: string
                    response_json: Json | null
                }
                Insert: {
                    created_at?: string
                    customer_id?: string | null
                    error_message?: string | null
                    id?: string
                    message: string
                    order_id?: string | null
                    phone: string
                    provider: string
                    provider_message_id?: string | null
                    status: string
                    response_json?: Json | null
                }
                Update: {
                    created_at?: string
                    customer_id?: string | null
                    error_message?: string | null
                    id?: string
                    message?: string
                    order_id?: string | null
                    phone?: string
                    provider?: string
                    provider_message_id?: string | null
                    status?: string
                    response_json?: Json | null
                }
                Relationships: [
                    {
                        foreignKeyName: "whatsapp_notifications_customer_id_fkey"
                        columns: ["customer_id"]
                        isOneToOne: false
                        referencedRelation: "customers"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "whatsapp_notifications_order_id_fkey"
                        columns: ["order_id"]
                        isOneToOne: false
                        referencedRelation: "orders"
                        referencedColumns: ["id"]
                    }
                ]
            }
            restock_exclusions: {
                Row: {
                    blocked_until: string
                    created_at: string
                    id: string
                    product_id: string
                    reason: string | null
                }
                Insert: {
                    blocked_until: string
                    created_at?: string
                    id?: string
                    product_id: string
                    reason?: string | null
                }
                Update: {
                    blocked_until?: string
                    created_at?: string
                    id?: string
                    product_id?: string
                    reason?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "restock_exclusions_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    }
                ]
            }
            restock_recommendations: {
                Row: {
                    created_at: string
                    current_stock: number
                    id: string
                    priority: string
                    product_id: string
                    status: string | null
                    suggested_quantity: number
                    vmd: number
                }
                Insert: {
                    created_at?: string
                    current_stock: number
                    id?: string
                    priority: string
                    product_id: string
                    status?: string | null
                    suggested_quantity: number
                    vmd: number
                }
                Update: {
                    created_at?: string
                    current_stock?: number
                    id?: string
                    priority?: string
                    product_id?: string
                    status?: string | null
                    suggested_quantity?: number
                    vmd?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "restock_recommendations_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    }
                ]
            }
            store_subscriptions: {
                Row: {
                    created_at: string
                    id: string
                    payment_provider: string | null
                    period: string
                    plan_id: string
                    renew_at: string | null
                    status: string
                    store_id: string
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    payment_provider?: string | null
                    period: string
                    plan_id: string
                    renew_at?: string | null
                    status: string
                    store_id: string
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    payment_provider?: string | null
                    period?: string
                    plan_id?: string
                    renew_at?: string | null
                    status?: string
                    store_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "store_subscriptions_plan_id_fkey"
                        columns: ["plan_id"]
                        isOneToOne: false
                        referencedRelation: "store_plans"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "store_subscriptions_store_id_fkey"
                        columns: ["store_id"]
                        isOneToOne: false
                        referencedRelation: "stores"
                        referencedColumns: ["id"]
                    },
                ]
            }
            stores: {
                Row: {
                    created_at: string
                    id: string
                    name: string
                    owner_id: string | null
                }
                Insert: {
                    created_at?: string
                    id?: string
                    name: string
                    owner_id?: string | null
                }
                Update: {
                    created_at?: string
                    id?: string
                    name?: string
                    owner_id?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            create_pdv_sale: {
                Args: {
                    p_customer_id: string
                    p_total_amount: number
                    p_payment_method: string
                    p_amount_paid: number
                    p_change_amount: number
                    p_items: Json
                }
                Returns: {
                    success: boolean
                    order_id: string
                    error: string
                }[]
            }
            login_or_register_customer: {
                Args: {
                    p_name: string
                    p_phone: string
                }
                Returns: {
                    address: string | null
                    birth_date: string | null
                    cpf: string | null
                    created_at: string
                    email: string | null
                    id: string
                    insurance_plan_id: string | null
                    internal_notes: string | null
                    name: string
                    phone: string
                    referrer: string | null
                    status: string
                    tags: string[] | null
                    updated_at: string
                }[]
            }
            update_customer_profile: {
                Args: {
                    p_id: string
                    p_name: string
                    p_email: string
                    p_address: string
                    p_cpf: string
                    p_birth_date: string
                }
                Returns: undefined
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<T = any> = any;
export type TablesInsert<T = any> = any;
export type TablesUpdate<T = any> = any;
export type Enums<T = any> = any;
export type CompositeTypes<T = any> = any;
