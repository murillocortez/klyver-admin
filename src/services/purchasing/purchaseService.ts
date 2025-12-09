import { supabase } from '../supabase';
import { Purchase, PurchaseItem } from './types';

export const purchaseService = {
    async create(purchase: Omit<Purchase, 'id' | 'created_at' | 'items'>) {
        const { data, error } = await supabase
            .from('purchases' as any)
            .insert(purchase)
            .select()
            .single();

        if (error) throw error;
        return data as any;
    },

    async addItems(items: Omit<PurchaseItem, 'id' | 'created_at'>[]) {
        const { error } = await supabase
            .from('purchase_items' as any)
            .insert(items);

        if (error) throw error;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('purchases' as any)
            .select(`
                *,
                supplier:suppliers (*),
                items:purchase_items (
                    *,
                    product:products (name, sku)
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as any;
    },

    async getAll() {
        const { data, error } = await supabase
            .from('purchases' as any)
            .select(`
                *,
                supplier:suppliers (nome_fantasia, razao_social),
                items:purchase_items(count)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
