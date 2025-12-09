import { supabase } from './supabase';
import { FiscalSettingsData, FiscalDocument } from './fiscal/types';

class FiscalService {

    async getSettings(storeId?: string): Promise<FiscalSettingsData | null> {
        let query = supabase.from('fiscal_settings').select('*');
        if (storeId) {
            query = query.eq('store_id', storeId);
        }

        // If single store, just take the first one or the only one
        const { data, error } = await query.limit(1).maybeSingle();

        if (error) {
            console.error('Error fetching fiscal settings:', error);
            throw error;
        }

        return data as FiscalSettingsData;
    }

    async saveSettings(settings: FiscalSettingsData): Promise<void> {
        // If id exists, update
        if (settings.id) {
            const { error } = await supabase
                .from('fiscal_settings')
                .update({
                    mode: settings.mode,
                    sat_endpoint_url: settings.sat_endpoint_url,
                    ecf_endpoint_url: settings.ecf_endpoint_url,
                    nfe_provider: settings.nfe_provider,
                    last_updated: new Date().toISOString()
                })
                .eq('id', settings.id);

            if (error) throw error;
        } else {
            // Check if one exists for store_id to avoid duplicates if ID was missing but record exists
            // For now assuming ID is always passed if editing, or we insert new.
            // But we should default store_id if missing.

            // If we don't have store_id in settings, fetch current store/user? 
            // Simplified: Assume we are creating for the current store. 
            // In a real multi-tenant app, we'd need context. 
            // For this project, let's assume one store or we'll fetch store_settings to get ID.

            // Just insert.
            const { error } = await supabase
                .from('fiscal_settings')
                .insert({
                    store_id: settings.store_id!, // Must be provided
                    mode: settings.mode,
                    sat_endpoint_url: settings.sat_endpoint_url,
                    ecf_endpoint_url: settings.ecf_endpoint_url,
                    nfe_provider: settings.nfe_provider
                });
            if (error) throw error;
        }
    }

    // Initialize default settings for a store if none exist
    async initSettings(storeId: string): Promise<FiscalSettingsData> {
        const current = await this.getSettings(storeId);
        if (current) return current;

        const newSettings: FiscalSettingsData = {
            store_id: storeId,
            mode: 'none',
            nfe_provider: 'none'
        };

        const { data, error } = await supabase
            .from('fiscal_settings')
            .insert(newSettings)
            .select()
            .single();

        if (error) throw error;
        return data as FiscalSettingsData;
    }

    // Documents
    async createDocument(doc: Partial<FiscalDocument>): Promise<FiscalDocument> {
        const { data, error } = await supabase
            .from('invoices')
            .insert({
                order_id: doc.order_id,
                type: doc.type,
                provider: doc.provider,
                status: doc.status,
                xml_url: doc.xml_url,
                pdf_url: doc.pdf_url,
                raw_response: doc.raw_response,
                invoice_number: doc.invoice_number, // saving mapped fields
                sefaz_protocol: doc.sefaz_protocol
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapInvoiceToFiscalDocument(data);
    }

    async updateDocument(id: string, updates: Partial<FiscalDocument>): Promise<FiscalDocument> {
        const { data, error } = await supabase
            .from('invoices')
            .update({
                status: updates.status,
                xml_url: updates.xml_url,
                pdf_url: updates.pdf_url,
                raw_response: updates.raw_response,
                invoice_number: updates.invoice_number,
                sefaz_protocol: updates.sefaz_protocol,
                error_message: updates.error_message
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this.mapInvoiceToFiscalDocument(data);
    }

    async getDocumentsByOrder(orderId: string): Promise<FiscalDocument[]> {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(this.mapInvoiceToFiscalDocument);
    }

    private mapInvoiceToFiscalDocument(row: any): FiscalDocument {
        return {
            id: row.id,
            order_id: row.order_id,
            type: row.type || 'nfe', // Default to nfe if null (legacy)
            status: row.status as any,
            provider: row.provider,
            xml_url: row.xml_url,
            pdf_url: row.pdf_url,
            raw_response: row.raw_response,
            created_at: row.created_at,
            updated_at: row.created_at, // invoices doesn't have updated_at in schema visible, use created or fetch if added
            invoice_number: row.invoice_number,
            sefaz_protocol: row.sefaz_protocol,
            error_message: row.error_message
        };
    }
}

export const fiscalService = new FiscalService();
