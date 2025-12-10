import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase'; // Adjust based on actual path
// If services/supabaseClient.ts doesn't exist (I saw it didn't), I need to find where supabase is initialized.
// Based on file list, likely `services/supabase.ts` or similar. I'll check `services` dir content first.

interface Tenant {
    id: string;
    slug: string;
    display_name: string;
    logo_url: string | null;
    plan_id: string; // Needed for checkout
    plan_code: string;
    status: 'active' | 'suspended' | 'trial' | 'cancelled' | 'blocked' | 'past_due';
    admin_base_url: string | null;
    store_base_url: string | null;
    onboarding_status?: 'pending' | 'completed';
    blocked_reason?: string;
}

interface TenantContextType {
    tenant: Tenant | null;
    loading: boolean;
    error: string | null;
}

const TenantContext = createContext<TenantContextType>({
    tenant: null,
    loading: true,
    error: null,
});

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const params = useParams<{ slug: string }>();
    // Also check if we are in a path that *should* have a slug.
    // Ideally, the Router structure ensures this provider is only mounted when /:slug is present.

    const [searchParams] = useSearchParams();

    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Priority: query param > params.slug
        // Priority: query param > params.slug > env default
        // @ts-ignore
        // Priority logic expanded to catch global location search
        const slug = searchParams.get('tenant') ||
            new URLSearchParams(window.location.search).get('tenant') ||
            params.slug ||
            import.meta.env.VITE_DEFAULT_TENANT_SLUG_ADMIN;
        if (!slug) {
            setLoading(false);
            return;
        }

        const fetchTenant = async () => {
            try {
                setLoading(true);
                // @ts-ignore
                const { data, error } = await (supabase as any)
                    .from('tenants')
                    .select('*')
                    .eq('slug', slug)
                    .maybeSingle();

                if (error) throw error;
                if (!data) throw new Error('Farmácia não encontrada.');

                setTenant(data as unknown as Tenant);
            } catch (err: any) {
                console.error('Error fetching tenant:', err);
                setError(err.message || 'Erro ao carregar farmácia.');
                setTenant(null);
            } finally {
                setLoading(false);
            }
        };

        fetchTenant();
    }, [params.slug, searchParams]);

    const value = {
        tenant,
        loading,
        error,
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => useContext(TenantContext);
