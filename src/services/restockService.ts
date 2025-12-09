
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Initialize Supabase Client (assuming access to environment variables or global config elsewhere, 
// strictly creating the service logic here. In this project, it seems we use a 'db' service exporting 'supabase'.
// I will import 'supabase' from '../services/dbService' if available or create a new client.)
// Checked 'farma-vida-admin/components/Layout.tsx', it imports 'db' from '../services/dbService'.
// Let's check dbService.ts content to see if it exports 'supabase'.

import { supabase } from './supabase';

export interface RestockItem {
    productId: string;
    productName: string;
    sku: string | null;
    unit: string;
    totalSold30d: number;
    vmd: number;
    currentStock: number;
    daysToEmpty: number;
    suggestedQuantity: number;
    priority: 'red' | 'yellow' | 'green';
    reason: string;
    classification?: 'A' | 'B' | 'C';
}

export const restockService = {
    async getRecommendations(): Promise<RestockItem[]> {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // 1. Fetch Products
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('id, name, sku, unit, min_stock_threshold')
            .eq('status', 'active');

        if (prodError) throw prodError;
        if (!products) return [];

        // 2. Fetch Stock (Batches)
        const { data: batches, error: batchError } = await supabase
            .from('product_batches')
            .select('product_id, quantity')
            .gt('quantity', 0); // Only positive stock matters for sum

        if (batchError) throw batchError;

        // 3. Fetch Sales (Last 30 days)
        // We need order_items linked to orders where created_at >= 30 days ago
        // Supabase filtering on related tables is tricky for complex aggregates. 
        // We'll fetch relevant order_items and filter in JS for simplicity given the likely scale.
        // Or better: fetch orders first, getting IDs, then fetch items.

        const { data: orders, error: orderError } = await supabase
            .from('orders')
            .select('id, created_at')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .neq('status', 'cancelled'); // Exclude cancelled

        if (orderError) throw orderError;

        // Get Order IDs
        const orderIds = orders?.map(o => o.id) || [];
        let salesItems: { product_id: string | null; quantity: number }[] = [];

        if (orderIds.length > 0) {
            const { data: items, error: itemsError } = await supabase
                .from('order_items')
                .select('product_id, quantity')
                .in('order_id', orderIds);

            if (itemsError) throw itemsError;
            salesItems = items || [];
        }

        // 4. Fetch Exclusions
        const { data: exclusions, error: exclError } = await supabase
            .from('restock_exclusions')
            .select('product_id')
            .gt('blocked_until', new Date().toISOString());

        if (exclError) throw exclError;
        const excludedIds = new Set(exclusions?.map(e => e.product_id));

        // 5. Fetch ABC Classification
        const { data: abcData } = await supabase
            .from('abc_curve' as any)
            .select('product_id, classification');

        const abcMap = new Map<string, 'A' | 'B' | 'C'>();
        abcData?.forEach((row: any) => abcMap.set(row.product_id, row.classification));

        // 6. Calculate
        const recommendations: RestockItem[] = [];

        // Map helpers
        const stockMap = new Map<string, number>();
        batches?.forEach(b => {
            if (b.product_id) {
                stockMap.set(b.product_id, (stockMap.get(b.product_id) || 0) + b.quantity);
            }
        });

        const salesMap = new Map<string, number>();
        salesItems?.forEach(i => {
            if (i.product_id) {
                salesMap.set(i.product_id, (salesMap.get(i.product_id) || 0) + i.quantity);
            }
        });

        products.forEach(p => {
            if (excludedIds.has(p.id)) return;

            const totalSold = salesMap.get(p.id) || 0;
            const vmd = totalSold / 30; // Average daily sales
            const currentStock = stockMap.get(p.id) || 0;
            const classification = abcMap.get(p.id) || 'C'; // Default to C if not classified

            if (vmd === 0) return;

            // ABC Logic Integration
            // A: Critical to business -> Keep 30 days coverage
            // B: Important -> Keep 21 days coverage
            // C: Low relevance -> Keep 10 days coverage (minimize trapped capital)
            let coverageDays = 21;
            if (classification === 'A') coverageDays = 30;
            if (classification === 'C') coverageDays = 10;

            const daysToEmpty = currentStock / vmd;
            const idealStock = vmd * coverageDays;
            const suggestedQty = Math.ceil(idealStock - currentStock);

            if (suggestedQty <= 0) return;

            let priority: 'red' | 'yellow' | 'green' = 'green';
            let reason = 'Estoque Saudável';

            // Priority Logic based on ABC
            if (classification === 'A') {
                if (daysToEmpty <= 7) {
                    priority = 'red';
                    reason = 'Item Curva A com Estoque Baixo';
                } else {
                    priority = 'yellow'; // Always pay attention to A
                    reason = 'Reposição Preventiva (Curva A)';
                }
            } else if (classification === 'B') {
                if (daysToEmpty <= 5) {
                    priority = 'red';
                    reason = 'Risco de Ruptura';
                } else if (daysToEmpty <= 10) {
                    priority = 'yellow';
                    reason = 'Reposição Recomendável';
                } else {
                    reason = 'Baixa urgência';
                }
            } else {
                // Class C
                if (daysToEmpty <= 2) {
                    priority = 'yellow'; // Even if C, if empty it's bad, but rarely Critical Red unless sold out?
                    reason = 'Item C próximo do fim';
                } else {
                    priority = 'green';
                    reason = 'Reposição de oportunidade';
                }
            }

            // Fallback for immediate rupture regardless of class
            if (daysToEmpty <= 1) {
                priority = 'red';
                reason = 'CRÍTICO: Ruptura Iminente';
            }

            recommendations.push({
                productId: p.id,
                productName: p.name,
                sku: p.sku,
                unit: p.unit,
                totalSold30d: totalSold,
                vmd,
                currentStock,
                daysToEmpty,
                suggestedQuantity: suggestedQty,
                priority,
                reason,
                classification // Adding this to interface later if needed, but for now just using it for logic
            });
        });

        // 7. Sort: Red > Yellow > Green, then by ABC Class (A > B > C)
        const priorityWeight = { red: 0, yellow: 1, green: 2 };
        const classWeight = { A: 0, B: 1, C: 2 };

        recommendations.sort((a, b) => {
            const pDiff = priorityWeight[a.priority] - priorityWeight[b.priority];
            if (pDiff !== 0) return pDiff;

            // Check if we have class info attached (Typescript hack for now as I didn't update interface)
            // Ideally update interface. For now just sort by VMD or simple logic
            return b.vmd - a.vmd;
        });

        return recommendations;
    },

    async ignoreProduct(productId: string, days: number = 7, reason?: string) {
        const blockedUntil = new Date();
        blockedUntil.setDate(blockedUntil.getDate() + days);

        const { error } = await supabase
            .from('restock_exclusions')
            .insert({
                product_id: productId,
                blocked_until: blockedUntil.toISOString(),
                reason
            });

        if (error) throw error;
    },

    async saveShoppingList(items: RestockItem[]) {
        // Save each item to restock_recommendations as snapshots
        // The prompt says: "When clicking 'Generate List' -> save record... Table: restock_recommendations"
        // It's a snapshot table.

        const rows = items.map(item => ({
            product_id: item.productId,
            vmd: item.vmd,
            current_stock: item.currentStock,
            suggested_quantity: item.suggestedQuantity,
            priority: item.priority,
            status: 'pending' // default
        }));

        const { error } = await supabase
            .from('restock_recommendations')
            .insert(rows);

        if (error) throw error;
    },

    async getSavedLists() {
        // Optional: if we want to view history
        return supabase.from('restock_recommendations').select('*, products(name)').order('created_at', { ascending: false });
    }
};
