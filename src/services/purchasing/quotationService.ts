import { supabase } from '../supabase';
import { Quotation, QuotationItem, QuotationPrice } from './types';

export const quotationService = {
    async getAll() {
        const { data, error } = await supabase
            .from('quotations' as any)
            .select(`
                *,
                items:quotation_items(count)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('quotations' as any)
            .select(`
                *,
                items:quotation_items (
                    *,
                    product:products (name, sku),
                    prices:quotation_prices (
                        *,
                        supplier:suppliers (nome_fantasia, razao_social)
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(status: string = 'aberta') {
        const { data, error } = await supabase
            .from('quotations' as any)
            .insert({ status })
            .select()
            .single();

        if (error) throw error;
        return data as any;
    },

    async updateStatus(id: string, status: string) {
        const { error } = await supabase
            .from('quotations' as any)
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('quotations' as any)
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Items
    async addItem(quotationId: string, productId: string, qty: number) {
        // Check if exists
        const { data: existing } = await supabase
            .from('quotation_items' as any)
            .select('id')
            .eq('quotation_id', quotationId)
            .eq('product_id', productId)
            .single();

        if (existing) {
            const { error } = await supabase
                .from('quotation_items' as any)
                .update({ quantity_requested: qty })
                .eq('id', (existing as any).id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('quotation_items' as any)
                .insert({
                    quotation_id: quotationId,
                    product_id: productId,
                    quantity_requested: qty
                });
            if (error) throw error;
        }
    },

    async updateItemQuantity(itemId: string, qty: number) {
        const { error } = await supabase
            .from('quotation_items' as any)
            .update({ quantity_requested: qty })
            .eq('id', itemId);
        if (error) throw error;
    },

    async removeItem(itemId: string) {
        const { error } = await supabase
            .from('quotation_items' as any)
            .delete()
            .eq('id', itemId);
        if (error) throw error;
    },

    // Prices
    async savedPrice(itemId: string, supplierId: string, price: number, delivery?: number, payment?: string) {
        const { data: existing } = await supabase
            .from('quotation_prices' as any)
            .select('id')
            .eq('quotation_item_id', itemId)
            .eq('supplier_id', supplierId)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from('quotation_prices' as any)
                .update({
                    unit_price: price,
                    delivery_days: delivery,
                    payment_terms: payment
                })
                .eq('id', (existing as any).id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('quotation_prices' as any)
                .insert({
                    quotation_item_id: itemId,
                    supplier_id: supplierId,
                    unit_price: price,
                    delivery_days: delivery,
                    payment_terms: payment
                });
            if (error) throw error;
        }
    },

    // Suppliers Management
    async getParticipatingSuppliers(quotationId: string) {
        const { data, error } = await supabase
            .from('quotation_suppliers' as any)
            .select(`
                supplier_id,
                supplier:suppliers (*)
            `)
            .eq('quotation_id', quotationId);

        if (error) throw error;
        return data?.map((d: any) => d.supplier) || [];
    },

    async addSupplier(quotationId: string, supplierId: string) {
        const { error } = await supabase
            .from('quotation_suppliers' as any)
            .insert({ quotation_id: quotationId, supplier_id: supplierId });

        if (error && error.code !== '23505') throw error; // Ignore duplicates
    },

    async removeSupplier(quotationId: string, supplierId: string) {
        const { error } = await supabase
            .from('quotation_suppliers' as any)
            .delete()
            .eq('quotation_id', quotationId)
            .eq('supplier_id', supplierId);
        if (error) throw error;
    }
};
