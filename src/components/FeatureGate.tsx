import React, { useState } from 'react';
import { usePlan } from '../hooks/usePlan';
import { UpgradeModal } from './UpgradeModal';

interface FeatureGateProps {
    feature: string;
    children: React.ReactNode;
    fallback?: React.ReactNode; // Optional custom fallback
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ feature, children, fallback }) => {
    const { checkAccess, loading } = usePlan();
    const [showModal, setShowModal] = useState(false);

    if (loading) return null; // Or skeleton

    const hasAccess = checkAccess(feature);

    if (hasAccess) {
        return <>{children}</>;
    }

    // If no access, show fallback (which might be a locked state that triggers modal on click)
    // Or just render nothing and show modal immediately if it was a route?
    // Better pattern: Render a "Locked" placeholder that opens the modal.

    return (
        <>
            <div onClick={() => setShowModal(true)} className="cursor-pointer relative group">
                <div className="pointer-events-none opacity-50 grayscale blur-[1px] select-none">
                    {children}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 backdrop-blur-[1px] rounded-xl border-2 border-dashed border-gray-300 group-hover:bg-gray-100/30 transition-all">
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm font-bold text-gray-500 flex items-center gap-2">
                        🔒 Recurso Bloqueado
                    </div>
                </div>
            </div>

            <UpgradeModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                featureName={feature}
                requiredPlan="Profissional" // Logic to determine plan name could be improved
            />
        </>
    );
};
