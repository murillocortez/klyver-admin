import { supabase } from './supabase';
import { whatsappService } from './whatsappService';

export interface CRMSettings {
    id: string;
    slug: 'reactivation' | 'birthday' | 'vip';
    name: string;
    active: boolean;
    message_template: string;
    discount_percent: number;
    last_run_at: string | null;
    config: any;
}

export const crmService = {
    // --- Settings & Stats ---
    async getSettings() {
        const { data, error } = await supabase
            .from('crm_campaigns' as any)
            .select('*')
            .order('name');
        if (error) throw error;
        return data as any as CRMSettings[];
    },

    async updateSettings(id: string, updates: Partial<CRMSettings>) {
        const { error } = await supabase
            .from('crm_campaigns' as any)
            .update(updates)
            .eq('id', id);
        if (error) throw error;
    },

    async getStats(period: '7d' | '30d' | '6m' = '30d') {
        const now = new Date();
        let startDate = new Date();
        if (period === '7d') startDate.setDate(now.getDate() - 7);
        if (period === '30d') startDate.setDate(now.getDate() - 30);
        if (period === '6m') startDate.setMonth(now.getMonth() - 6);

        const isoStart = startDate.toISOString();

        // 1. Reactivated (Logs with status 'sent' for reactivation)
        const { count: reactivatedCount } = await supabase
            .from('crm_logs' as any)
            .select('*', { count: 'exact', head: true })
            .eq('campaign_slug', 'reactivation')
            .eq('status', 'sent')
            .gte('created_at', isoStart);

        // 2. Birthday Reach
        const { count: birthdayCount } = await supabase
            .from('crm_logs' as any)
            .select('*', { count: 'exact', head: true })
            .eq('campaign_slug', 'birthday')
            .gte('created_at', isoStart);

        // 3. VIPs Issued
        const { count: vipCount } = await supabase
            .from('crm_vip' as any)
            .select('*', { count: 'exact', head: true })
            .gte('issued_at', isoStart);

        // 4. Coupon Usage (This assumes we can link created coupons to usage)
        // We'll simplify: Count coupons created by CRM that have usage_count > 0
        // Ideally we filter by created_at of coupon, but let's approximate.
        const { data: usedCoupons } = await supabase
            .from('coupons' as any)
            .select('id')
            .gt('usage_count', 0)
            .gte('created_at', isoStart);

        return {
            reactivated: reactivatedCount || 0,
            birthday: birthdayCount || 0,
            vip: vipCount || 0,
            couponsUsed: usedCoupons?.length || 0
        };
    },

    // --- Campaigns Runners ---

    // 1. Reactivation
    async runReactivationCampaign() {
        // 1. Get Config
        const { data: settings } = await supabase.from('crm_campaigns' as any).select('*').eq('slug', 'reactivation').single();
        if (!settings || !(settings as any).active) return { status: 'skipped', reason: 'disabled' };

        const config = (settings as any).config || {};
        const daysInactive = config.days_inactive || 60;
        const cooldownDays = config.cooldown_days || 20;

        // 2. Find eligible customers
        // Last purchase > 60 days ago OR no purchase (if created date > 60 days) behavior? 
        // Let's stick to "data_ultima_compra" (last_purchase_at column on customers usually, or query orders)
        // Assuming `customers` has a `last_purchase_at`. If not we query orders.
        // Let's query orders first to be safe or assuming we have a computed view.
        // For simplicity/performance, let's assume we can fetch customers and filtering.

        // Optimization: Get customers with last_purchase < 60 days ago
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

        // Fetch customers who haven't purchased since cutoff
        // Note: Using `!inner` on orders could work, but let's try a simpler approach if table is small-ish
        // Better: Query customers where NOT EXISTS (orders > cutoff)

        // Let's assume we fetch all customers for now (if base is < 10k ok). 
        // Or safer: RPC function. But I can't create RPC easily.
        // Use standard queries: 

        const { data: customers } = await supabase.from('customers' as any).select('id, name, phone, last_purchase_date');
        if (!customers) return;

        let processed = 0;

        for (const customer of customers) {
            const lastBuy = (customer as any).last_purchase_date ? new Date((customer as any).last_purchase_date) : new Date(0); // If never bought, use old date? Or ignore?
            // "Clientes ausentes": implies they bought before.
            if (!(customer as any).last_purchase_date) continue;

            if (lastBuy < cutoffDate) {
                // Eligible based on time. Check logs for cooldown.
                const cooldownCutoff = new Date();
                cooldownCutoff.setDate(cooldownCutoff.getDate() - cooldownDays);

                const { data: recentLogs } = await supabase
                    .from('crm_logs' as any)
                    .select('id')
                    .eq('customer_id', (customer as any).id)
                    .eq('campaign_slug', 'reactivation')
                    .gte('created_at', cooldownCutoff.toISOString());

                if (recentLogs && recentLogs.length > 0) continue; // Skip

                // SEND
                await this.sendCampaignMessage(customer, settings, 'reativacao');
                processed++;
            }
        }

        await this.logRun((settings as any).id);
        return { status: 'success', processed };
    },

    // 2. Birthday
    async runBirthdayCampaign() {
        const { data: settings } = await supabase.from('crm_campaigns' as any).select('*').eq('slug', 'birthday').single();
        if (!settings || !(settings as any).active) return { status: 'skipped', reason: 'disabled' };

        // Check who has birthday today
        // This is tricky in standard PostgREST without specific functions.
        // We can fetch all customers with birth_date NOT NULL and filter in JS if not massive.
        const { data: customers } = await supabase.from('customers' as any).select('id, name, phone, birth_date').not('birth_date', 'is', null);

        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
        const currentYear = today.getFullYear();

        let processed = 0;

        if (customers) {
            for (const c of customers) {
                const bdate = new Date((c as any).birth_date);
                // Adjust for timezone issues - usually birth_date is YYYY-MM-DD string.
                // safer to parse string parts
                const [bYear, bMonth, bDay] = (c as any).birth_date.split('-').map(Number);

                if (bMonth === currentMonth && bDay === currentDay) {
                    // It's birthday!
                    // Check if already sent this year
                    const { data: existing } = await supabase
                        .from('crm_birthday' as any)
                        .select('id')
                        .eq('customer_id', (c as any).id)
                        .eq('year', currentYear);

                    if (existing && existing.length > 0) continue;

                    // Generate Coupon
                    const firstName = (c as any).name.split(' ')[0].toUpperCase();
                    const couponCode = `ANIVER-${firstName}-${(c as any).id.split('-')[0]}`.substring(0, 20); // Unique-ish

                    const coupon = await this.createCoupon({
                        code: couponCode,
                        discount_value: (settings as any).discount_percent,
                        customer_id: (c as any).id,
                        days_valid: (settings as any).config.validity_days || 7
                    });

                    // Send Message
                    const msg = (settings as any).message_template.replace('{{nome}}', (c as any).name);
                    const fullMsg = `${msg} Use o cupom: *${couponCode}* (${(settings as any).discount_percent}% OFF)`;

                    await whatsappService.sendWhatsappMessage((c as any).phone, fullMsg);

                    // Log
                    await supabase.from('crm_logs' as any).insert({
                        customer_id: (c as any).id,
                        campaign_slug: 'birthday',
                        status: 'sent',
                        message_sent: fullMsg
                    });

                    // Log Control
                    await supabase.from('crm_birthday' as any).insert({
                        customer_id: (c as any).id,
                        coupon_id: (coupon as any).id,
                        valid_until: (coupon as any).end_date,
                        year: currentYear
                    });

                    processed++;
                }
            }
        }
        await this.logRun((settings as any).id);
        return { status: 'success', processed };
    },

    // 3. VIP
    async runVipCampaign() {
        const { data: settings } = await supabase.from('crm_campaigns' as any).select('*').eq('slug', 'vip').single();
        if (!settings || !(settings as any).active) return { status: 'skipped', reason: 'disabled' };

        const thresholdSpend = (settings as any).config.spend_threshold || 500;
        const thresholdCount = (settings as any).config.order_count_threshold || 10;

        // Window: 6 months
        const date6m = new Date();
        date6m.setMonth(date6m.getMonth() - 6);

        // Fetch Orders Summary
        // Ideally DB should do this. "rpc" call or querying orders.
        // We'll query orders since date6m
        const { data: orders } = await supabase
            .from('orders' as any)
            .select('customer_id, total_amount')
            .gte('created_at', date6m.toISOString())
            .eq('status', 'Entregue'); // Only completed

        if (!orders) return;

        // Aggregate
        const customerStats: Record<string, { total: number, count: number }> = {};
        orders.forEach((o: any) => {
            if (!customerStats[o.customer_id]) customerStats[o.customer_id] = { total: 0, count: 0 };
            customerStats[o.customer_id].total += (o.total_amount || 0);
            customerStats[o.customer_id].count += 1;
        });

        let processed = 0;

        for (const custId in customerStats) {
            const stats = customerStats[custId];
            if (stats.total >= thresholdSpend || stats.count >= thresholdCount) {
                // Eligible
                // Check if already VIP
                // Simplification based on requirements: check if received coupon
                const { data: existing } = await supabase
                    .from('crm_vip' as any)
                    .select('id')
                    .eq('customer_id', custId);

                if (existing && existing.length > 0) continue; // Already VIP

                // Get customer details
                const { data: customer } = await supabase.from('customers' as any).select('name, phone').eq('id', custId).single();
                if (!customer) continue;

                // Generate Coupon
                const couponCode = `VIP-${custId.split('-')[0]}`.toUpperCase();

                const coupon = await this.createCoupon({
                    code: couponCode,
                    discount_value: (settings as any).discount_percent,
                    customer_id: custId,
                    days_valid: (settings as any).config.validity_days || 30
                });

                // Send 
                const msg = (settings as any).message_template.replace('{{nome}}', (customer as any).name);
                const fullMsg = `${msg} Código: *${couponCode}*`;

                await whatsappService.sendWhatsappMessage((customer as any).phone, fullMsg);

                // Log Control
                await supabase.from('crm_vip' as any).insert({
                    customer_id: custId,
                    coupon_id: (coupon as any).id,
                    status: 'emitido',
                    reason: stats.total >= thresholdSpend ? 'spend_threshold' : 'order_count'
                });

                processed++;
            }
        }

        await this.logRun((settings as any).id);
        return { status: 'success', processed };
    },

    async runAll() {
        const r1 = await this.runReactivationCampaign();
        const r2 = await this.runBirthdayCampaign();
        const r3 = await this.runVipCampaign();
        return { reactivation: r1, birthday: r2, vip: r3 };
    },

    // Helpers
    async sendCampaignMessage(customer: any, settings: any, type: string) {
        if (!customer.phone) return;

        let msg = settings.message_template.replace('{{nome}}', customer.name);
        // Optional: Coupon for reactivation? (The spec mentions "Cupom opcional", but doesn't strictly require generating one for reactivation like it does for others. I'll skip generating unique coupon for reactivation for now unless configured, to keep it simple, or use a generic code if needed. The prompt example just says "condição especial". Usually implies existing manual offer or I could gen one. I'll stick to message for now as per minimal spec for that item).

        await whatsappService.sendWhatsappMessage(customer.phone, msg);

        await supabase.from('crm_logs' as any).insert({
            customer_id: customer.id,
            campaign_slug: settings.slug,
            status: 'sent',
            message_sent: msg
        });
    },

    async createCoupon({ code, discount_value, customer_id, days_valid }: any) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days_valid);

        const { data, error } = await supabase
            .from('coupons' as any)
            .insert({
                code,
                discount_type: 'percentage',
                discount_value,
                customer_id,
                end_date: endDate.toISOString(),
                active: true,
                usage_limit: 1
            })
            .select()
            .single();

        if (error) {
            // Handle duplicate code if exists?
            // If duplicate, maybe return existing?
            // For now throw
            throw error;
        }
        return data;
    },

    async logRun(campaignId: string) {
        await supabase
            .from('crm_campaigns' as any)
            .update({ last_run_at: new Date().toISOString() })
            .eq('id', campaignId);
    }
};
