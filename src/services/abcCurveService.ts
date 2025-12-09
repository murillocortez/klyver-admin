import { supabase } from './supabase';

export interface AbcCurveData {
    id: string;
    product_id: string;
    classification: 'A' | 'B' | 'C';
    participation_percentage: number;
    accumulated_percentage: number;
    total_sold_amount: number;
    total_sold_quantity: number;
    turnover_rate: number;
    average_stock: number;
    last_calculated: string;
    product?: {
        name: string;
        sku: string;
        current_stock: number;
    };
}

export class AbcCurveService {

    /**
     * Calculates the ABC Curve for all products based on the last 90 days of sales.
     * Logic:
     * 1. Fetch all completed orders in last 90 days.
     * 2. Aggregate sales by product_id (sum quantity, sum total value).
     * 3. Calculate total revenue of the period.
     * 4. Calculate participation % for each product.
     * 5. Sort by participation DESC.
     * 6. Calculate cumulative %.
     * 7. Assign A (up to 70%), B (up to 90%), C (rest).
     * 8. Calculate Turnover (Total Sold Qty / Current Stock). *Approximation based on current stock.
     * 9. Upsert into abc_curve table.
     */
    async calculateAbcCurve(): Promise<void> {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // 1. Fetch Sales Data
        // We need to join order_items with orders to filter by date and status
        const { data: items, error } = await supabase
            .from('order_items')
            .select(`
                quantity,
                price_at_purchase,
                product_id,
                orders!inner (
                    created_at,
                    status
                )
            `)
            .gte('orders.created_at', ninetyDaysAgo.toISOString())
            .neq('orders.status', 'Cancelado') // Filter out cancelled
            .neq('orders.status', 'Pendente');  // Only count confirmed/completed sales? Usually yes.

        if (error) throw error;
        if (!items || items.length === 0) return;

        // 2. Aggregate Data
        const productStats = new Map<string, { totalValue: number, totalQty: number }>();
        let grandTotalRevenue = 0;

        items.forEach((item: any) => {
            if (!item.product_id) return;

            const current = productStats.get(item.product_id) || { totalValue: 0, totalQty: 0 };
            const value = (item.price_at_purchase || 0) * (item.quantity || 0);

            current.totalValue += value;
            current.totalQty += item.quantity;
            productStats.set(item.product_id, current);

            grandTotalRevenue += value;
        });

        // 3. Fetch current stock for Turnover calculation
        // stockTotal column does not exist on products, must calculate from batches
        const { data: batches } = await supabase
            .from('product_batches')
            .select('product_id, quantity');

        const stockMap = new Map<string, number>();
        batches?.forEach((b: any) => {
            if (b.product_id) {
                const current = stockMap.get(b.product_id) || 0;
                stockMap.set(b.product_id, current + b.quantity);
            }
        });

        // 4. Prepare List for Sorting
        const abcList = [];
        for (const [pid, stats] of productStats.entries()) {
            abcList.push({
                product_id: pid,
                totalValue: stats.totalValue,
                totalQty: stats.totalQty,
                participation: grandTotalRevenue > 0 ? (stats.totalValue / grandTotalRevenue) * 100 : 0
            });
        }

        // 5. Sort by Participation DESC
        abcList.sort((a, b) => b.totalValue - a.totalValue);

        // 6. Calculate Cumulative & Classification
        let accumulated = 0;
        const upsertData = abcList.map(item => {
            accumulated += item.participation;
            let classification = 'C';

            // Logic: A <= 70%, B <= 90%, C > 90%
            // But we need to handle the boundary carefully.
            // If accumulated passes 70% ON this item, does it belong to A or B?
            // Standard approach: If it *starts* below 70, it's A. 
            // Or simple: If accumulated <= 70 -> A. If it jumps from 69 to 75, typically that item is A.
            // Let's use strict cut-offs based on item's cumulative ending point.

            // Re-reading user request: 
            // "Itens A → até 70% do faturamento acumulado"
            // "Itens B → 71% até 90% do acumulado"

            if (accumulated <= 70) {
                classification = 'A';
            } else if (accumulated <= 90) {
                // Check if crossover
                const prevAccumulated = accumulated - item.participation;
                if (prevAccumulated < 70) classification = 'A'; // Borderline case, keep as A
                else classification = 'B';
            } else {
                // C
                const prevAccumulated = accumulated - item.participation;
                if (prevAccumulated < 90) classification = 'B'; // Borderline case
                else classification = 'C';
            }

            // Turnover (Giro) = Total Sold / Avg Stock
            // We use current stock as proxy for avg stock
            const currentStock = stockMap.get(item.product_id) || 0;
            // Avoid division by zero
            // If stock is 0, turnover is technically undefined or infinite if sales > 0.
            // Let's use totalQty if stock is 0 to indicate high turnover pressure? 
            // Or just 0. Let's use a safe value. 
            // Standard: Turnover = COGS / AvgInv. Here QtySold / CurrentStock.
            const verifiedTurnover = currentStock > 0 ? Number((item.totalQty / currentStock).toFixed(2)) : 0;

            return {
                product_id: item.product_id,
                classification,
                participation_percentage: item.participation,
                accumulated_percentage: accumulated,
                total_sold_amount: item.totalValue,
                total_sold_quantity: item.totalQty,
                turnover_rate: currentStock > 0 ? Number((item.totalQty / currentStock).toFixed(2)) : 0,
                average_stock: currentStock, // Storing what we used
                last_calculated: new Date().toISOString()
            };
        });

        // 7. Upsert to DB
        // Process in chunks if too big, but likely OK for now.
        if (upsertData.length > 0) {
            // Salvar no Supabase (Upsert)
            // @ts-ignore
            const { error: upsertError } = await (supabase as any)
                .from('abc_curve')
                .upsert(upsertData, { onConflict: 'product_id' });

            if (upsertError) throw upsertError;
        }
    }

    async getAbcData(filterClass?: string): Promise<AbcCurveData[]> {
        let query = supabase
            .from('abc_curve' as any)
            .select(`
                *,
                product:products (
                    name,
                    sku
                )
            `)
            .order('participation_percentage', { ascending: false });

        if (filterClass) {
            query = query.eq('classification', filterClass);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Map to simpler structure if needed, or return raw
        return data.map((d: any) => ({
            ...d,
            product: {
                name: d.product?.name || 'Produto Desconhecido',
                sku: d.product?.sku || '',
                current_stock: d.average_stock // Use stored stock snapshot
            }
        }));
    }

    async getProductDetails(productId: string) {
        // Here we would fetch history, for now just the ABC entry
        const { data, error } = await supabase
            .from('abc_curve' as any)
            .select('*')
            .eq('product_id', productId)
            .single();

        if (error) return null;
        return data;
    }
}

export const abcCurveService = new AbcCurveService();
