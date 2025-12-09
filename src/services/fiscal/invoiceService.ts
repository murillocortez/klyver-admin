import { supabase } from '../supabase';
import { FiscalProvider, FiscalProviderType, InvoicePayload, FiscalResult } from './types';
import { SimulatedProvider } from './providers/SimulatedProvider';
import { PlugNotasProvider } from './providers/PlugNotasProvider';
import { NuvemFiscalProvider } from './providers/NuvemFiscalProvider';
import { NotaFacilProvider } from './providers/NotaFacilProvider';

import { db } from '../dbService';

async function getProvider(): Promise<FiscalProvider> {
    const settings = await db.getSettings();
    const providerType = settings.pharmacy.fiscalProvider || 'none';
    const apiKey = settings.pharmacy.fiscalApiKey || '';
    const companyId = settings.pharmacy.fiscalCompanyId || '';

    switch (providerType) {
        case 'plugnotas':
            return new PlugNotasProvider(apiKey, companyId);
        case 'nuvemfiscal':
            return new NuvemFiscalProvider(apiKey);
        case 'notafacil':
            return new NotaFacilProvider(apiKey);
        case 'none':
        default:
            return new SimulatedProvider();
    }
}

export const invoiceService = {
    async emitInvoice(orderId: string, payload: InvoicePayload) {
        const provider = await getProvider();
        const settings = await db.getSettings();
        const providerName = settings.pharmacy.fiscalProvider || 'none';

        // Log attempt
        await logInvoiceAction(null, 'emit_attempt', { orderId, provider: providerName, payload });

        try {
            const result = await provider.emit(payload);

            // Save to DB
            const { data: invoice, error } = await supabase
                .from('invoices')
                .insert({
                    order_id: orderId,
                    provider: providerName,
                    status: result.status,
                    invoice_number: result.invoiceNumber,
                    xml_url: result.xmlUrl,
                    pdf_url: result.pdfUrl,
                    sefaz_protocol: result.protocol,
                    error_message: result.message
                })
                .select()
                .single();

            if (error) throw error;

            // Log success
            await logInvoiceAction(invoice.id, 'emit_success', result);

            return invoice;
        } catch (error: any) {
            console.error('Emission error:', error);

            // Create failed invoice record
            const { data: invoice } = await supabase
                .from('invoices')
                .insert({
                    order_id: orderId,
                    provider: providerName,
                    status: 'error',
                    error_message: error.message || 'Unknown error'
                })
                .select()
                .single();

            if (invoice) {
                await logInvoiceAction(invoice.id, 'emit_error', { error: error.message });
            }

            throw error;
        }
    },

    async getInvoiceStatus(invoiceId: string) {
        const { data: invoice } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .single();

        if (!invoice) throw new Error('Invoice not found');

        const provider = await getProvider();
        // Ideally we store providerId in invoices table or extract from details
        // For now, assuming simulated or simple mapping
        // In a real scenario, we'd need the provider's ID for this invoice.
        // Let's assume invoice_number or we need to add provider_id column.
        // For simulated, it doesn't matter.

        try {
            const result = await provider.getStatus(invoice.invoice_number || invoiceId);

            // Update DB
            await supabase
                .from('invoices')
                .update({
                    status: result.status,
                    xml_url: result.xmlUrl || invoice.xml_url,
                    pdf_url: result.pdfUrl || invoice.pdf_url,
                    sefaz_protocol: result.protocol || invoice.sefaz_protocol
                })
                .eq('id', invoiceId);

            await logInvoiceAction(invoiceId, 'status_check', result);
            return result;
        } catch (error: any) {
            await logInvoiceAction(invoiceId, 'status_check_error', { error: error.message });
            throw error;
        }
    },

    async cancelInvoice(invoiceId: string, reason: string) {
        const { data: invoice } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .single();

        if (!invoice) throw new Error('Invoice not found');

        const provider = await getProvider();

        try {
            const result = await provider.cancel(invoice.invoice_number || invoiceId, reason);

            // Update DB
            await supabase
                .from('invoices')
                .update({
                    status: result.status,
                    error_message: result.message
                })
                .eq('id', invoiceId);

            await logInvoiceAction(invoiceId, 'cancel_success', result);
            return result;
        } catch (error: any) {
            await logInvoiceAction(invoiceId, 'cancel_error', { error: error.message });
            throw error;
        }
    },

    async getInvoiceByOrderId(orderId: string) {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found"
        return data;
    }
};

async function logInvoiceAction(invoiceId: string | null, action: string, details: any) {
    await supabase.from('invoice_logs').insert({
        invoice_id: invoiceId,
        action,
        details
    });
}
