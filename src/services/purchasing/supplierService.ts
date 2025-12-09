import { supabase } from '../supabase';
import { Supplier } from './types';

export const supplierService = {
    async getAll(): Promise<Supplier[]> {
        const { data, error } = await supabase
            .from('suppliers' as any)
            .select('*')
            .order('razao_social');

        if (error) throw error;
        return (data as any) || [];
    },

    async getById(id: string): Promise<Supplier | null> {
        const { data, error } = await supabase
            .from('suppliers' as any)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return (data as any);
    },

    async create(supplier: Omit<Supplier, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('suppliers' as any)
            .insert(supplier)
            .select()
            .single();

        if (error) throw error;
        return (data as any);
    },

    async update(id: string, updates: Partial<Supplier>) {
        const { data, error } = await supabase
            .from('suppliers' as any)
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return (data as any);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('suppliers' as any)
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
