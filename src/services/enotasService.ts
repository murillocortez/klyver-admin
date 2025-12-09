import { supabase } from './supabase';
import { Order, OrderItem, Product } from '../types';

const ENOTAS_API_URL = (import.meta as any).env.VITE_ENOTAS_API_URL || 'https://api.enotas.com.br/v2';
const ENOTAS_API_KEY = (import.meta as any).env.VITE_ENOTAS_API_KEY || '';
const ENOTAS_ENABLED = (import.meta as any).env.VITE_ENOTAS_ENABLED === 'true';

// ... imports

// ... constants

export interface Invoice {
    id: string;
    order_id: string;
    invoice_number?: string;
    status: 'disabled' | 'pending' | 'processing' | 'approved' | 'rejected' | 'canceled';
    xml_url?: string;
    pdf_url?: string;
    sefaz_protocol?: string;
    error_message?: string;
    created_at: string;
}

async function emitNFe(order: Order): Promise<{ success: boolean; message: string; invoiceId?: string }> {
    const orderId = order.id;
    try {
        console.log(`[eNotas] Emitting NFe for Order ${orderId}. Enabled: ${ENOTAS_ENABLED}`);

        // 1. Fetch Order Data (if needed, or use passed order)
        // We might need full items with product details, so fetching is safer or we ensure 'order' has everything.
        // For now, let's trust the passed order or fetch if items are missing details.

        // ... (rest of emitNFe logic, ensure it uses 'order' correctly)
        // Re-using existing logic but ensuring types match

        // 2. Build Payload
        const payload = await buildFiscalPayload(order);

        // 3. Create Invoice Record
        const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
                order_id: orderId,
                status: ENOTAS_ENABLED ? 'processing' : 'pending',
                error_message: ENOTAS_ENABLED ? null : 'Simulação: Aguardando ativação do eNotas.',
            } as any)
            .select()
            .single();

        if (invoiceError) throw invoiceError;
        if (!invoiceData) throw new Error('Failed to create invoice record');

        const invoice = invoiceData as any;

        await logInvoiceAction(invoice.id, 'EMIT_REQUEST', payload, null);

        if (!ENOTAS_ENABLED) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            return {
                success: true,
                message: 'NFe registrada em modo de simulação.',
                invoiceId: invoice.id
            };
        } else {
            // Real API Call
            const response = await fetch(`${ENOTAS_API_URL}/empresas/{empresaId}/nf-e`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${ENOTAS_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            await logInvoiceAction(invoice.id, 'API_RESPONSE', null, data);

            if (!response.ok) {
                await supabase.from('invoices').update({ status: 'rejected', error_message: data.message } as any).eq('id', invoice.id);
                throw new Error(data.message || 'Erro na API eNotas');
            }

            await supabase.from('invoices').update({ status: 'processing', invoice_number: data.nfeId } as any).eq('id', invoice.id);
            return { success: true, message: 'NFe enviada para processamento.', invoiceId: invoice.id };
        }

    } catch (error: any) {
        console.error('[eNotas] Error:', error);
        return { success: false, message: error.message };
    }
}

async function getInvoiceByOrderId(orderId: string): Promise<Invoice | null> {
    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false }) // Get latest
        .limit(1)
        .single();

    if (error) return null;
    return data as any as Invoice;
}

async function getNFeStatus(invoiceId: string) {
    const { data: invoice } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();
    return invoice as any as Invoice | null;
}

async function cancelNFe(invoiceId: string, reason?: string) {
    if (!ENOTAS_ENABLED) {
        await supabase
            .from('invoices')
            .update({ status: 'canceled', error_message: 'Cancelamento simulado.' } as any)
            .eq('id', invoiceId);

        await logInvoiceAction(invoiceId, 'CANCEL_REQUEST', { reason }, { success: true, simulated: true });
        return { success: true, message: 'NFe cancelada (Simulação)' };
    }
    // Real API implementation placeholder
    return { success: false, message: 'Cancelamento real não implementado.' };
}

// ... helper functions (buildFiscalPayload, getPaymentType, logInvoiceAction) ...
// (Keep them as they were, just ensuring they are available to the exported functions)

async function buildFiscalPayload(order: any) {
    // Fetch full product details for NCM/CFOP
    const productIds = order.items.map((i: any) => i.productId || i.product_id); // Handle different casing
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

    const productMap = new Map(products?.map(p => [p.id, p]) || []);

    const items = order.items.map((item: any) => {
        const product = productMap.get(item.productId || item.product_id) as any;
        return {
            cfop: product?.cfop || '5102', // Default Venda
            codigo: product?.sku || '000',
            descricao: item.productName || item.name,
            ncm: product?.ncm || '30049099', // Default Medicamento
            quantidade: item.quantity,
            unidadeMedida: product?.unit || 'UN',
            valorUnitario: item.priceAtPurchase || item.price,
            impostos: {
                icms: {
                    situacaoTributaria: product?.taxSource ? `${product.taxSource}00` : '000', // Simples Nacional default
                    origem: product?.taxSource || '0'
                }
            }
        };
    });

    return {
        tipo: 'NFe',
        idExterno: order.id,
        ambiente: 'Homologacao', // Or Production based on env
        cliente: {
            nome: order.customerName || 'Cliente Consumidor',
            cpfCnpj: '00000000000', // TODO: Fetch from customer
            endereco: {
                logradouro: order.address || 'Balcão',
                numero: 'S/N',
                bairro: 'Centro',
                municipio: 'Cidade',
                uf: 'SP',
                cep: '00000000'
            }
        },
        itens: items,
        pagamento: {
            tipo: getPaymentType(order.paymentMethod),
            valor: order.totalAmount
        }
    };
}

function getPaymentType(method: string) {
    const map: any = { 'credit_card': 'CartaoCredito', 'debit_card': 'CartaoDebito', 'pix': 'Pix', 'cash': 'Dinheiro' };
    return map[method] || 'Outros';
}

async function logInvoiceAction(invoiceId: string, action: string, payload: any, response: any) {
    await supabase.from('invoice_logs').insert({ invoice_id: invoiceId, action, payload, response } as any);
}

export const enotasService = {
    emitNFe,
    getInvoiceByOrderId,
    getNFeStatus,
    cancelNFe
};
