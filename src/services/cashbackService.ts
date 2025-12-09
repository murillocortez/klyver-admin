import { supabase } from './supabase';
import { CashbackSettings, CashbackTransaction, CashbackWallet } from '../types';

export const cashbackService = {
    // Configurações
    getSettings: async (): Promise<CashbackSettings | null> => {
        const { data, error } = await supabase
            .from('cashback_settings' as any)
            .select('percentual_padrao, dias_validade')
            .limit(1)
            .single() as any;

        if (error) {
            console.error('Error fetching cashback settings:', error);
            return null;
        }

        return {
            percentualPadrao: data.percentual_padrao,
            diasValidade: data.dias_validade
        };
    },

    updateSettings: async (settings: CashbackSettings): Promise<boolean> => {
        // Busca o ID existente ou cria novo
        const { data: existing } = await supabase.from('cashback_settings' as any).select('id').limit(1).single() as any;

        let error;
        if (existing) {
            const { error: updateError } = await supabase
                .from('cashback_settings' as any)
                .update({
                    percentual_padrao: settings.percentualPadrao,
                    dias_validade: settings.diasValidade,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('cashback_settings' as any)
                .insert({
                    percentual_padrao: settings.percentualPadrao,
                    dias_validade: settings.diasValidade
                });
            error = insertError;
        }

        if (error) {
            console.error('Error updating cashback settings:', error);
            return false;
        }
        return true;
    },

    // Wallet e Transações
    getWallet: async (customerId: string): Promise<CashbackWallet | null> => {
        const { data, error } = await supabase
            .from('cashback_wallet' as any)
            .select('saldo_atual, ultimo_credito, ultimo_debito, updated_at')
            .eq('customer_id', customerId)
            .single() as any;

        if (error && error.code !== 'PGRST116') { // Ignora erro de não encontrado (wallet vazia)
            console.error('Error fetching cashback wallet:', error);
            return null;
        }

        if (!data) return { saldoAtual: 0, updatedAt: new Date().toISOString() };

        return {
            saldoAtual: data.saldo_atual,
            ultimoCredito: data.ultimo_credito,
            ultimoDebito: data.ultimo_debito,
            updatedAt: data.updated_at
        };
    },

    getTransactions: async (customerId: string): Promise<CashbackTransaction[]> => {
        const { data, error } = await supabase
            .from('cashback_transactions' as any)
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false }) as any;

        if (error) {
            console.error('Error fetching cashback transactions:', error);
            return [];
        }

        return data.map((t: any) => ({
            id: t.id,
            customerId: t.customer_id,
            orderId: t.order_id,
            tipo: t.tipo,
            valor: t.valor,
            dataExpiracao: t.data_expiracao,
            createdAt: t.created_at
        }));
    },

    // Admin Reports
    getGlobalStats: async () => {
        const { data: totalGenerated } = await supabase
            .from('cashback_transactions' as any)
            .select('valor')
            .eq('tipo', 'credito') as any;

        const { data: totalUsed } = await supabase
            .from('cashback_transactions' as any)
            .select('valor')
            .eq('tipo', 'debito') as any;

        const { data: totalExpired } = await supabase
            .from('cashback_transactions' as any)
            .select('valor')
            .eq('tipo', 'expirado') as any;

        const sum = (arr: any[]) => arr?.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0) || 0;

        return {
            generated: sum(totalGenerated || []),
            used: sum(totalUsed || []),
            expired: sum(totalExpired || [])
        };
    },

    // Função para rodar expiração manualmente
    runDailyExpiration: async () => {
        const { error } = await supabase.rpc('expire_cashback_daily' as any);
        if (error) console.error('Error running expiration job:', error);
        return !error;
    }
};
