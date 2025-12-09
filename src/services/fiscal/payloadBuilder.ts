import { supabase } from '../supabase';
import { db } from '../dbService';
import { InvoicePayload } from './types';

export async function buildFiscalPayload(orderId: string): Promise<InvoicePayload> {
    // Fetch order with full customer details
    const { data: order, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                *,
                products (*)
            ),
            customers (*)
        `)
        .eq('id', orderId)
        .single();

    if (error || !order) throw new Error('Order not found');

    // Map items
    const items = order.order_items.map((item: any) => ({
        code: item.products?.id || 'MISC',
        description: item.products?.name || 'Produto Diverso',
        ncm: '30049099', // Default NCM, should ideally come from product
        cfop: '5102', // Venda de mercadoria adquirida ou recebida de terceiros
        quantity: item.quantity,
        unitPrice: Number(item.price_at_purchase),
        totalPrice: Number(item.price_at_purchase) * item.quantity,
        unit: item.products?.unit || 'UN'
    }));

    // Customer parsing
    // Address is stored as string in 'address' or 'delivery_address' in order, 
    // or in customer record. Order address takes precedence.
    const addressString = order.delivery_address || order.customers?.address || '';

    // Simple address parser mock (assuming format: Street, Number, Neighborhood, City - State)
    // In a real app, this should be structured or parsed more robustly
    const addressParts = addressString.split(',').map((p: string) => p.trim());
    const street = addressParts[0] || 'Rua Não Informada';
    const number = addressParts[1] || 'S/N';
    const neighborhood = addressParts[2] || 'Bairro';

    // Try to extract City - State
    let city = 'Cidade';
    let state = 'UF';
    const lastPart = addressParts[addressParts.length - 1];
    if (lastPart && lastPart.includes('-')) {
        const cityState = lastPart.split('-');
        city = cityState[0].trim();
        state = cityState[1].trim();
    } else if (addressParts.length > 3) {
        city = addressParts[3];
    }

    const zipCode = '00000000'; // Placeholder

    return {
        orderId: order.id,
        customer: {
            name: order.customers?.name || 'Consumidor Final',
            email: order.customers?.email || 'email@naoinformado.com',
            cpf: order.customers?.cpf || '00000000000',
            phone: order.customers?.phone,
            address: {
                street,
                number,
                neighborhood,
                city,
                state,
                zipCode,
                complement: ''
            }
        },
        items,
        total: Number(order.total_amount),
        payment: {
            method: order.payment_method,
            amount: Number(order.total_amount)
        }
    };
}
