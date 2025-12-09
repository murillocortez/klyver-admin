import { supabase } from '../supabase';
import { AccountPayable } from './types';

export const financialService = {
    async getAll() {
        const { data, error } = await supabase
            .from('accounts_payable' as any)
            .select(`
                *,
                supplier:suppliers (nome_fantasia, razao_social),
                purchase:purchases (id, invoice_number)
            `)
            .order('due_date', { ascending: true });

        if (error) throw error;
        return data as any[];
    },

    async create(payable: Omit<AccountPayable, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('accounts_payable' as any)
            .insert(payable)
            .select()
            .single();

        if (error) throw error;
        return data as any;
    },

    async markAsPaid(id: string, date: string = new Date().toISOString()) {
        const { error } = await supabase
            .from('accounts_payable' as any)
            .update({
                status: 'pago',
                paid_at: date
            })
            .eq('id', id);

        if (error) throw error;
    },

    async getSummary() {
        // This would ideally be a database function or optimized query
        const { data, error } = await supabase
            .from('accounts_payable' as any)
            .select('*');

        if (error) throw error;

        const totalPending = data
            .filter((p: any) => p.status === 'pendente')
            .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

        const totalOverdue = data
            .filter((p: any) => p.status === 'atrasado' || (p.status === 'pendente' && new Date(p.due_date) < new Date()))
            .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

        const totalPaid = data
            .filter((p: any) => p.status === 'pago')
            .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

        return { totalPending, totalOverdue, totalPaid };
    }
};
