import { supabase } from './supabase';

export interface LicenseStatus {
    status: 'active' | 'pending' | 'blocked';
    plan: string;
    daysRemaining: number;
    features: {
        cashback: boolean;
        api_whatsapp: boolean;
        curve_abc: boolean;
        multi_loja: boolean;
        lista_inteligente: boolean;
    };
    tenantId: string;
    tenantName: string;
}

const PLAN_FEATURES: Record<string, any> = {
    'free': {
        cashback: false,
        api_whatsapp: false,
        curve_abc: false,
        multi_loja: false,
        lista_inteligente: false
    },
    'pro': {
        cashback: true,
        api_whatsapp: true,
        curve_abc: true,
        multi_loja: false,
        lista_inteligente: true
    },
    'enterprise': {
        cashback: true,
        api_whatsapp: true,
        curve_abc: true,
        multi_loja: true,
        lista_inteligente: true
    }
};

export const licenseService = {
    async checkLicense(tenantIdOverride?: string): Promise<LicenseStatus> {
        const tenantId = await this.getTenantId(tenantIdOverride);

        if (!tenantId) {
            console.error('Tenant ID não encontrado.');
            return {
                status: 'blocked',
                plan: 'Unknown',
                daysRemaining: 0,
                features: PLAN_FEATURES['free'],
                tenantId: 'unknown',
                tenantName: 'Erro ao identificar farmácia'
            };
        }

        try {
            // Fetch tenant status and plan details via join
            // @ts-ignore
            const { data: tenant, error } = await (supabase as any)
                .from('tenants')
                .select(`
                    status, 
                    plan_code, 
                    display_name,
                    created_at,
                    plan:store_plans (
                        name,
                        features
                    )
                `)
                .eq('id', tenantId)
                .single();

            if (error || !tenant) {
                console.error('Erro ao buscar dados do tenant:', error);
                throw new Error('Tenant not found');
            }

            // Map tenant status to license status
            let licenseStatus: 'active' | 'pending' | 'blocked' = 'active';
            if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
                licenseStatus = 'blocked';
            } else if (tenant.status === 'trial') {
                licenseStatus = 'active';
            }

            const planDetails = tenant.plan as any; // Cast because nested join might not be typed perfectly yet
            const features = planDetails?.features || PLAN_FEATURES['free'];
            const planName = planDetails?.name || tenant.plan_code;

            // Calculate days remaining
            let daysRemaining = 30; // Default
            if (tenant.created_at) {
                const created = new Date(tenant.created_at);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - created.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                // Simple logic: Assuming 30 day cycle, remaining = 30 - (days since creation % 30)
                daysRemaining = 30 - (diffDays % 30);

                // If specific next_billing_date exists (add it to select if available), use it.
                // But generally for MVP this cycle calc works.
            }

            return {
                status: licenseStatus,
                plan: planName, // Dynamic name from store_plans
                daysRemaining: daysRemaining,
                features: features,
                tenantId: tenantId,
                tenantName: tenant.display_name
            };

        } catch (error) {
            console.warn('Falha verificar licença no Banco. Usando Fallback.', error);

            // Critical Failure Fallback - Avoid blocking completely if just a glitch, 
            // but ideally we should block if we can't verify.
            // For now, let's allow basic access if it fails to ensure user isn't locked out by bugs.
            return {
                status: 'active',
                plan: 'Fallback Basic',
                daysRemaining: 1,
                features: PLAN_FEATURES['free'],
                tenantId: tenantId,
                tenantName: 'Modo Offline (Erro)'
            };
        }
    },

    async getTenantId(override?: string): Promise<string | null> {
        if (override) return override;

        // First try to check if we have tenant from URL context (if accessible)
        // But since this is a service, we rely on user profile or current session.

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // 1. Try to get from app_metadata (secure/admin set)
        if (user.app_metadata?.tenant_id) {
            return user.app_metadata.tenant_id as string;
        }

        // 2. Try to get from user_metadata (set on signup)
        if (user.user_metadata?.tenant_id) {
            return user.user_metadata.tenant_id as string;
        }

        // 3. Last resource: Fetch from profiles table
        const { data, error } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        if (error) {
            console.warn('Could not fetch tenant_id from profiles:', error);
        }

        // @ts-ignore
        return data?.tenant_id || null;
    }
};
