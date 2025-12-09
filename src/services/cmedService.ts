import { supabase } from './supabase';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface CMEDItem {
    product_name: string;
    presentation: string;
    manufacturer: string;
    active_ingredient: string;
    registration: string;
    class: string;
    price_pmc: number;
    price_pmvg: number;
    price_pf: number;
}

const API_1_URL = (import.meta as any).env.VITE_CMED_API_1 || 'https://api.bussoladoconsumidor.org/medicamentos';
const API_2_URL = (import.meta as any).env.VITE_CMED_API_2 || 'https://api.medapi.com.br/v1/medicamentos';
const API_KEY = (import.meta as any).env.VITE_CMED_API_KEY || '';

export async function searchCMED(query: string): Promise<CMEDItem[]> {
    if (!query || query.length < 3) return [];

    try {
        // 1. Check Cache (valid < 48 hours)
        const { data: cacheData } = await supabase
            .from('cmed_cache' as any)
            .select('response_json, created_at')
            .eq('query', query.toLowerCase())
            .single() as any;

        if (cacheData) {
            const created = new Date(cacheData.created_at);
            const now = new Date();
            const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

            if (diffHours < 48) {
                console.log('CMED: Returning cached data');
                return cacheData.response_json as CMEDItem[];
            }
        }

        let results: CMEDItem[] = [];
        let success = false;

        // 2. Try API 1 (Bússola)
        try {
            console.log('CMED: Trying API 1...');
            results = await fetchFromAPI1(query);
            if (results.length > 0) success = true;
        } catch (e) {
            console.warn('CMED: API 1 failed', e);
        }

        // 3. Try API 2 (MedAPI - Fallback)
        if (!success) {
            try {
                console.log('CMED: Trying API 2...');
                results = await fetchFromAPI2(query);
                if (results.length > 0) success = true;
            } catch (e) {
                console.warn('CMED: API 2 failed', e);
            }
        }

        // 4. Save to Cache if successful
        if (success && results.length > 0) {
            await saveToCache(query, results);
            return results;
        }

        // 5. Fallback to Local Table (cmed_prices - imported dump)
        // This acts as a permanent offline cache/database if APIs fail
        console.log('CMED: Fallback to local table');
        const { data: officialData } = await supabase
            .from('cmed_prices' as any)
            .select('*')
            .ilike('drug_name', `%${query}%`)
            .limit(20) as any;

        if (officialData && officialData.length > 0) {
            return officialData.map((item: any) => ({
                product_name: item.drug_name,
                presentation: item.presentation,
                manufacturer: item.laboratory,
                active_ingredient: item.active_ingredient,
                registration: item.registration_number,
                class: item.therapeutic_class || '',
                price_pmc: item.pmc_value,
                price_pmvg: item.pmvg_value,
                price_pf: item.pf_value
            }));
        }

        return [];

    } catch (error) {
        console.error('CMED Search Error:', error);
        return [];
    }
}

async function saveToCache(query: string, data: CMEDItem[]) {
    // Delete old cache for this query
    await supabase.from('cmed_cache' as any).delete().eq('query', query.toLowerCase());
    // Insert new
    await supabase.from('cmed_cache' as any).insert({
        query: query.toLowerCase(),
        response_json: data
    } as any);
}

async function fetchFromAPI1(query: string): Promise<CMEDItem[]> {
    const response = await fetch(`${API_1_URL}?nome=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('API 1 Error');
    const data = await response.json();

    // Map response to CMEDItem
    // Adjust based on actual API response structure
    const list = Array.isArray(data) ? data : (data.content || [data]);

    return list.map((item: any) => ({
        product_name: item.nome || item.produto || item.product_name,
        presentation: item.apresentacao || item.presentation,
        manufacturer: item.laboratorio || item.manufacturer,
        active_ingredient: item.principio_ativo || item.active_ingredient || '',
        registration: item.registro || item.registration || '',
        class: item.classe || item.class || '',
        price_pmc: Number(item.pmc || item.price_pmc || 0),
        price_pmvg: Number(item.pmvg || item.price_pmvg || 0),
        price_pf: Number(item.pf_com_imposto || item.price_pf || 0)
    })).filter((i: any) => i.product_name && i.price_pmc > 0);
}

async function fetchFromAPI2(query: string): Promise<CMEDItem[]> {
    const response = await fetch(`${API_2_URL}?nome=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('API 2 Error');
    const data = await response.json();
    const list = Array.isArray(data) ? data : (data.results || []);

    return list.map((item: any) => ({
        product_name: item.nome,
        presentation: item.apresentacao,
        manufacturer: item.laboratorio,
        active_ingredient: item.principio_ativo,
        registration: item.registro,
        class: item.classe,
        price_pmc: Number(item.pmc),
        price_pmvg: Number(item.pmvg),
        price_pf: Number(item.pf)
    }));
}

// Function to import Data (CSV, Excel, PDF)
export async function importCMEDData(file: File): Promise<{ success: boolean; count: number; error?: string }> {
    return new Promise(async (resolve) => {
        try {
            let rows: any[] = [];

            if (file.name.endsWith('.csv')) {
                // Parse CSV
                const text = await readFileAsText(file);
                const result = Papa.parse(text, { header: true, skipEmptyLines: true });
                rows = result.data;

            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                // Parse Excel
                const data = await readFileAsBinary(file);
                const workbook = XLSX.read(data, { type: 'binary' });

                let foundData = false;

                for (const sheetName of workbook.SheetNames) {
                    const sheet = workbook.Sheets[sheetName];
                    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

                    if (!rawData || rawData.length === 0) continue;

                    // Find header row index
                    let headerRowIndex = -1;

                    // Helper to normalize string for comparison
                    const norm = (str: any) => String(str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

                    for (let i = 0; i < Math.min(rawData.length, 100); i++) {
                        const row = rawData[i];
                        if (!Array.isArray(row)) continue;

                        // Check for key columns presence in the row
                        const hasSubstance = row.some(cell => {
                            const n = norm(cell);
                            return n.includes('substancia') || n.includes('principio ativo');
                        });
                        const hasLab = row.some(cell => {
                            const n = norm(cell);
                            return n.includes('laboratorio') || n.includes('fabricante');
                        });
                        const hasPresentation = row.some(cell => {
                            const n = norm(cell);
                            return n.includes('apresentacao') || n.includes('produto');
                        });

                        if (hasSubstance && hasLab && hasPresentation) {
                            headerRowIndex = i;
                            break;
                        }
                    }

                    if (headerRowIndex !== -1) {
                        // Found headers!
                        const headers = rawData[headerRowIndex].map(h => String(h || '').trim());

                        // Create objects from subsequent rows
                        rows = rawData.slice(headerRowIndex + 1).map(row => {
                            const obj: any = {};
                            headers.forEach((header: string, index: number) => {
                                if (header) obj[header] = row[index];
                            });
                            return obj;
                        });
                        foundData = true;
                        break;
                    }
                }

                if (!foundData) {
                    // Fallback: Try the first sheet with default headers
                    console.warn('CMED Import: No explicit header row found. Trying loose parsing on first sheet.');
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    rows = XLSX.utils.sheet_to_json(sheet);
                }

            } else if (file.name.endsWith('.pdf')) {
                throw new Error('Importação de PDF não suportada. Use o arquivo .XLS ou .CSV oficial.');
            } else {
                throw new Error('Formato de arquivo não suportado. Use .csv, .xls ou .xlsx');
            }

            // Normalize and Filter Data
            const normalizedRows = rows.map((row: any) => {
                // Helper to find value by fuzzy key match
                const findVal = (keys: string[]) => {
                    // Normalize keys we are looking for
                    const normKeys = keys.map(k => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim());

                    for (const key of Object.keys(row)) {
                        const cleanKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                        // Check exact match or partial match
                        if (normKeys.some(k => cleanKey === k || cleanKey.includes(k))) {
                            return row[key];
                        }
                    }
                    return null;
                };

                // Specific logic for prices to prioritize 18% or 20% or Sem Impostos
                // We want to find specific columns if possible
                const findPrice = (types: string[]) => {
                    for (const type of types) {
                        const val = findVal([type]);
                        if (val !== null && val !== undefined && val !== '') return parsePrice(val);
                    }
                    return 0;
                };

                return {
                    drug_name: findVal(['produto', 'nome', 'medicamento']) || row['PRODUTO'],
                    presentation: findVal(['apresentacao', 'concentracao']) || row['APRESENTAÇÃO'],
                    laboratory: findVal(['laboratorio', 'fabricante', 'empresa']) || row['LABORATÓRIO'],
                    registration_number: findVal(['registro', 'reg.']) || row['REGISTRO'],
                    // Prioritize PF 18% (standard) -> 20% -> Sem Impostos
                    pf_value: findPrice(['pf 18%', 'pf 18', 'pf 20%', 'pf 20', 'pf 17%', 'pf 17', 'pf sem impostos']),
                    // Prioritize PMC 18% -> 20%
                    pmc_value: findPrice(['pmc 18%', 'pmc 18', 'pmc 20%', 'pmc 20', 'pmc 17%', 'pmc 17', 'pmc 0%', 'pmc']),
                    pmvg_value: findPrice(['pmvg sem impostos', 'pmvg 0%', 'pmvg']),
                    active_ingredient: findVal(['substancia', 'principio ativo']) || row['SUBSTÂNCIA'],
                    therapeutic_class: findVal(['classe terapeutica', 'classe']) || row['CLASSE TERAPÊUTICA'],
                    last_update: new Date().toISOString()
                };
            }).filter((r: any) => r.drug_name && (r.pmc_value > 0 || r.pf_value > 0));

            if (normalizedRows.length === 0) {
                throw new Error('Nenhum dado válido encontrado. Verifique se o arquivo possui as colunas: Produto, Apresentação, Laboratório e Preços (PF/PMC).');
            }

            // Insert in batches
            const BATCH_SIZE = 1000;
            for (let i = 0; i < normalizedRows.length; i += BATCH_SIZE) {
                const batch = normalizedRows.slice(i, i + BATCH_SIZE);
                const { error } = await supabase.from('cmed_prices' as any).upsert(batch as any, { onConflict: 'registration_number' as any });
                if (error) throw error;
            }

            resolve({ success: true, count: normalizedRows.length });

        } catch (err: any) {
            console.error('Import Error:', err);
            resolve({ success: false, count: 0, error: err.message });
        }
    });
}

// Helpers
function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function readFileAsBinary(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsBinaryString(file);
    });
}

function parsePrice(value: any): number {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        // Clean string (remove R$, spaces)
        let clean = value.trim().replace(/^R\$\s?/, '');

        // Handle Brazilian format "1.234,56" -> 1234.56
        if (clean.includes(',') && clean.includes('.')) {
            return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
        } else if (clean.includes(',')) {
            return parseFloat(clean.replace(',', '.'));
        }
        return parseFloat(clean);
    }
    return 0;
}
