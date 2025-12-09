
export type FiscalMode = 'none' | 'nfe' | 'sat' | 'ecf' | 'simulated';

export interface FiscalSettingsData {
    id?: string;
    store_id: string;
    mode: FiscalMode;
    sat_endpoint_url?: string;
    ecf_endpoint_url?: string;
    nfe_provider?: string;
    last_updated?: string;
}

export interface FiscalDocument {
    id: string;
    order_id: string;
    type: 'nfe' | 'sat' | 'ecf' | 'simulated';
    status: 'pending' | 'processing' | 'approved' | 'rejected' | 'canceled' | 'simulated' | 'error';
    provider: string;
    xml_url?: string;
    pdf_url?: string;
    raw_response?: any;
    created_at: string;
    updated_at: string;

    // Legacy fields mapping if needed for UI compatibility
    invoice_number?: string;
    sefaz_protocol?: string;
    error_message?: string;
}

export interface FiscalResult {
    success: boolean;
    status: FiscalDocument['status'];
    providerId?: string;
    invoiceNumber?: string; // SAT coupon number or NF number
    protocol?: string;
    xmlUrl?: string;
    pdfUrl?: string;
    message?: string;
    rawResponse?: any;
    printData?: string; // For SAT/ECF direct printing
}

export interface FiscalProvider {
    emit(invoicePayload: InvoicePayload): Promise<FiscalResult>;
    getStatus(providerId: string): Promise<FiscalResult>;
    cancel(providerId: string, reason?: string): Promise<FiscalResult>;
}

export type FiscalProviderType = 'none' | 'plugnotas' | 'nuvemfiscal' | 'notafacil' | 'sat-local' | 'ecf-local' | 'simulated';

export interface InvoicePayload {
    orderId: string;
    customer: {
        name: string;
        email: string;
        cpf: string;
        phone?: string;
        address: {
            street: string;
            number: string;
            neighborhood: string;
            city: string;
            state: string;
            zipCode: string;
            complement?: string;
        };
    };
    items: {
        code: string;
        description: string;
        ncm: string;
        cfop: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        unit: string;
    }[];
    total: number;
    payment: {
        method: string;
        amount: number;
    };
    store?: {
        cnpj: string;
        ie: string;
        pis_rate?: number;
        cofins_rate?: number;
    }
}
