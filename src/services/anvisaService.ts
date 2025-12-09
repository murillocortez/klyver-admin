import { supabase } from './supabase';

export interface AnvisaDrug {
    product_name: string;
    presentation: string;
    registration: string;
    manufacturer: string;
    therapeutic_class: string;
    active_ingredient: string;
}

const ANVISA_API_URL = (import.meta as any).env.VITE_ANVISA_API_URL || 'https://consultas.anvisa.gov.br/api/medicamentos';

export async function searchAnvisa(query: string): Promise<AnvisaDrug[]> {
    if (!query || query.length < 3) return [];

    try {
        // Note: The official ANVISA API might have CORS issues when called directly from the browser.
        // If it does, we might need a proxy. For now, we implement as requested.
        // Also, the ANVISA API often requires a specific structure or token, but the prompt says "public API".
        // Let's try the simple GET first.

        // The prompt URL: https://consultas.anvisa.gov.br/api/medicamentos?nome={query}
        // However, usually ANVISA API uses filters like ?filter[nome]={query} or similar.
        // Let's assume the prompt is correct for now, but be ready to adjust.
        // Actually, looking at common usage, it might be ?nome=... or a POST.
        // But I will follow the prompt's URL structure.

        const response = await fetch(`${ANVISA_API_URL}?nome=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`ANVISA API Error: ${response.statusText}`);
        }

        const data = await response.json();

        // The structure of ANVISA response usually contains a 'content' array or similar.
        // I will assume a standard list or content wrapper.
        const items = data.content || data || [];

        return items.map((item: any) => ({
            product_name: item.nome || item.produto || '',
            presentation: item.apresentacao || item.apresentacaoModelo || '',
            registration: item.numeroRegistro || item.registro || '',
            manufacturer: item.empresa?.razaoSocial || item.laboratorio || '',
            therapeutic_class: item.classeTerapeutica || '',
            active_ingredient: item.principioAtivo || ''
        })).filter((i: AnvisaDrug) => i.product_name);

    } catch (error) {
        console.error('ANVISA Search Error:', error);
        // Return empty array to not break the UI
        return [];
    }
}
