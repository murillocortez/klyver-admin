interface HealthPlanCheckResult {
    has_plan: boolean;
    plan_name: string;
    discount_percent: number;
    valid: boolean;
}

export const healthPlanService = {
    async checkPlan(cpf: string, provider: 'vidalink' | 'funcional' | 'epharma'): Promise<HealthPlanCheckResult> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Stub logic based on provider
        switch (provider) {
            case 'vidalink':
                return {
                    has_plan: true,
                    plan_name: "Vidalink Corporativo",
                    discount_percent: 15,
                    valid: true
                };
            case 'funcional':
                return {
                    has_plan: true,
                    plan_name: "Funcional Health Gold",
                    discount_percent: 20,
                    valid: true
                };
            case 'epharma':
                return {
                    has_plan: true,
                    plan_name: "ePharma Standard",
                    discount_percent: 10,
                    valid: true
                };
            default:
                return {
                    has_plan: false,
                    plan_name: "",
                    discount_percent: 0,
                    valid: false
                };
        }
    }
};
