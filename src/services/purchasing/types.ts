export interface Supplier {
    id: string;
    razao_social: string;
    nome_fantasia: string | null;
    cnpj: string | null;
    telefone: string | null;
    whatsapp: string | null;
    email: string | null;
    endereco: any; // JSONB
    observacao: string | null;
    ativo: boolean;
    created_at?: string;
}

export interface Quotation {
    id: string;
    status: 'aberta' | 'fechada' | 'cancelada';
    created_at: string;
    items?: QuotationItem[];
}

export interface QuotationItem {
    id: string;
    quotation_id: string;
    product_id: string;
    quantity_requested: number;
    product_name?: string; // Relation
    prices?: QuotationPrice[];
}

export interface QuotationPrice {
    id: string;
    quotation_item_id: string;
    supplier_id: string;
    unit_price: number;
    delivery_days: number | null;
    payment_terms: string | null;
    observation: string | null;
    supplier_name?: string; // Relation
}

export interface Purchase {
    id: string;
    supplier_id: string;
    supplier_name?: string; // Relation
    invoice_number: string | null;
    total_amount: number;
    status: 'lancado' | 'recebido' | 'pendente' | 'cancelado';
    payment_terms: string | null;
    created_at: string;
    items?: PurchaseItem[];
}

export interface PurchaseItem {
    id: string;
    purchase_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    batch_number: string | null;
    expiry_date: string | null;
    product_name?: string;
}

export interface AccountPayable {
    id: string;
    purchase_id: string | null;
    supplier_id: string;
    amount: number;
    due_date: string;
    status: 'pendente' | 'pago' | 'atrasado';
    paid_at: string | null;
    supplier_name?: string;
}
