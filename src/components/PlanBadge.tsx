import React from 'react';
import { usePlan } from '../hooks/usePlan';

export const PlanBadge: React.FC = () => {
    const { plan, loading } = usePlan();

    if (loading || !plan) return null;

    const getBadgeStyle = (code: string) => {
        switch (code) {
            case 'free': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'essential': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'pro': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'advanced': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'enterprise': return 'bg-black text-white border-black';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(plan.code)} flex items-center gap-1 uppercase tracking-wide`}>
            {plan.name}
        </div>
    );
};
