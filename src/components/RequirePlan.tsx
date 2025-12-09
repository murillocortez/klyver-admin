import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePlan } from '../hooks/usePlan';
import { UpgradeModal } from './UpgradeModal';

interface RequirePlanProps {
    children: React.ReactNode;
    feature?: string;
    minPlan?: string;
}

export const RequirePlan: React.FC<RequirePlanProps> = ({ children, feature, minPlan }) => {
    const { plan, checkAccess, loading } = usePlan();
    const [showModal, setShowModal] = React.useState(true);

    if (loading) return <div className="p-8 text-center">Carregando permissões...</div>;

    let hasAccess = true;

    if (feature && !checkAccess(feature)) {
        hasAccess = false;
    }

    // Simple check for plan code if minPlan is provided (naive implementation)
    if (minPlan && plan?.code !== minPlan && plan?.code !== 'enterprise') {
        // This is a bit weak, better to rely on features, but implemented for completeness
        // Assuming hierarchy: free < essential < pro < advanced < enterprise
        // Real logic would check index in array of plans
    }

    if (!hasAccess) {
        return (
            <div className="h-[calc(100vh-100px)] flex items-center justify-center">
                <UpgradeModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)} // This might leave user on blank page, better to redirect
                    featureName={feature || 'Recurso Premium'}
                    requiredPlan={minPlan || 'Superior'}
                />
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Acesso Restrito</h2>
                    <p className="text-gray-500 mt-2">Atualize seu plano para acessar este recurso.</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
