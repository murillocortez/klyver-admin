import React, { createContext, useContext, useEffect, useState } from 'react';
import { licenseService, LicenseStatus } from '../services/licenseService';
import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';

interface SubscriptionContextType {
    license: LicenseStatus | null;
    loading: boolean;
    isFeatureEnabled: (feature: keyof LicenseStatus['features']) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({} as SubscriptionContextType);

// Tela de Bloqueio Integrada
const BlockScreen = ({ license }: { license: LicenseStatus }) => (
    <div className="fixed inset-0 z-[9999] bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl text-center border border-gray-100">
            <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Temporariamente Bloqueado</h2>
            <p className="text-gray-500 mb-6">
                Identificamos uma pendência na assinatura da <strong>{license.tenantName}</strong>.
                Regularize para retomar o acesso imediato.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">Plano Atual:</span>
                    <span className="text-sm font-semibold text-gray-900">{license.plan}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Status:</span>
                    <span className="text-sm font-semibold text-red-600 uppercase">{license.status}</span>
                </div>
            </div>

            <div className="space-y-3">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors">
                    Renovar Assinatura Agora
                </button>
                <button className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium py-2.5 rounded-lg transition-colors">
                    Falar com Suporte
                </button>
            </div>

            <p className="mt-6 text-xs text-gray-400">
                Se você já realizou o pagamento, aguarde alguns instantes ou relogue no sistema.
            </p>
        </div>
    </div>
);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { tenant } = useTenant();
    const [license, setLicense] = useState<LicenseStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false); // Fix Deadlock: stop loading if no user
            return;
        }

        const check = async () => {
            try {
                // If we are strictly following "30min within panel or re-login", re-login is handled by this useEffect running on mount.
                // We add interval for the 30min check.
                // PASS TENANT ID from URL Context as Override if Auth fails!
                const data = await licenseService.checkLicense(tenant?.id);
                setLicense(data);
            } catch (err) {
                console.error("Falha ao verificar licença MASTER:", err);
            } finally {
                setLoading(false);
            }
        };

        check();

        // Revalidate every 30 minutes
        const intervalId = setInterval(check, 30 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [user, tenant]);

    const isFeatureEnabled = (feature: keyof LicenseStatus['features']) => {
        if (!license) return false;
        return license.features[feature] ?? false;
    };

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-gray-50">Validando licença...</div>;
    }

    if (license && license.status === 'blocked') {
        return <BlockScreen license={license} />;
    }

    return (
        <SubscriptionContext.Provider value={{ license, loading, isFeatureEnabled }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => useContext(SubscriptionContext);
