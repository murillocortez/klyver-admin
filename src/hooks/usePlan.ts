import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/dbService';
import { StorePlan, StoreSubscription } from '../types';

export const usePlan = () => {
    const [subscription, setSubscription] = useState<StoreSubscription | null>(null);
    const [plan, setPlan] = useState<StorePlan | null>(null);
    const [loading, setLoading] = useState(true);

    const loadPlan = useCallback(async () => {
        try {
            setLoading(true);
            const sub = await db.getSubscription();
            setSubscription(sub);
            if (sub && sub.plan) {
                setPlan(sub.plan);
            }
        } catch (error) {
            console.error('Error loading plan:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPlan();
    }, [loadPlan]);

    const checkAccess = (featureCode: string): boolean => {
        if (!plan) return false;
        // Enterprise has everything
        if (plan.code === 'enterprise') return true;

        // Check features array
        if (plan.features.includes(featureCode)) return true;

        return false;
    };

    const checkLimit = (resource: 'orders' | 'products' | 'users', currentCount: number): boolean => {
        if (!plan) return false;
        const limit = plan.limits[resource];

        // -1 means unlimited
        if (limit === -1) return true;

        return currentCount < limit;
    };

    return {
        subscription,
        plan,
        loading,
        checkAccess,
        checkLimit,
        refreshPlan: loadPlan
    };
};
