import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { TenantProvider, useTenant } from '../context/TenantContext';
import { AuthProvider } from '../context/AuthContext';
import { SubscriptionProvider } from '../context/SubscriptionContext';

const TenantStatusGuard: React.FC = () => {
    const { tenant, loading, error } = useTenant();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-500">Carregando farmácia...</p>
                </div>
            </div>
        );
    }

    if (error || !tenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Farmácia não encontrada</h1>
                    <p className="text-gray-500 mb-6">A URL acessada não corresponde a nenhuma farmácia ativa.</p>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                            Debug Error: {error}
                        </div>
                    )}
                    <a href="/" className="text-blue-600 hover:text-blue-800 font-medium">Voltar ao início</a>
                </div>
            </div>
        );
    }

    if (tenant.status === 'suspended') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Suspenso</h1>
                    <p className="text-gray-500 mb-6">O acesso a esta farmácia foi temporariamente suspenso. Por favor, entre em contato com o suporte ou financeiro.</p>
                </div>
            </div>
        );
    }

    // Wraps inner contexts that might depend on Tenant (like Auth checking if user belongs to tenant)
    return (
        <AuthProvider>
            <SubscriptionProvider>
                <Outlet />
            </SubscriptionProvider>
        </AuthProvider>
    );
};

export const TenantRoot: React.FC = () => {
    return (
        <TenantProvider>
            <TenantStatusGuard />
        </TenantProvider>
    );
};
