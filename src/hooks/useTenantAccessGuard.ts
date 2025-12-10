import { useTenant } from '../context/TenantContext';

export const useTenantAccessGuard = () => {
    const { tenant, loading, error } = useTenant();

    const isBlocked = tenant?.status === 'blocked' || tenant?.status === 'past_due' || tenant?.status === 'cancelled';
    const blockedReason = isBlocked ? (tenant?.blocked_reason || 'Assinatura Pendente') : null;

    return {
        tenant,
        loading,
        error,
        isBlocked,
        blockedReason
    };
};
