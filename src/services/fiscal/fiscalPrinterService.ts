import { fiscalService } from '../fiscalService';
import { enotasService } from '../enotasService';
import { db } from '../dbService';
import { FiscalDocument, FiscalResult, InvoicePayload } from './types';

// Bridge interfaces for local services
interface SatBridgeResponse {
    success: boolean;
    satNumber?: string;
    xml?: string;
    printData?: string;
    message?: string;
}

interface EcfBridgeResponse {
    success: boolean;
    ecfNumber?: string;
    message?: string;
}

class FiscalPrinterService {

    async emitFiscalDocumentForOrder(orderId: string): Promise<FiscalResult> {
        try {
            // 1. Get Settings
            const settings = await fiscalService.getSettings(); // uses default store if single tenant
            const mode = settings?.mode || 'none';

            if (mode === 'none') {
                return { success: false, status: 'error', message: 'Emissão fiscal desativada nas configurações.' };
            }

            // 2. Fetch Order Data
            const order = await db.getOrder(orderId);
            if (!order) throw new Error('Pedido não encontrado');

            // 3. Dispatch based on mode
            if (mode === 'nfe') {
                // Delegate to existing NFe service
                // enotasService expects Order object
                const result = await enotasService.emitNFe(order);
                // Map result to FiscalResult
                return {
                    success: result.success,
                    status: result.success ? (settings?.nfe_provider === 'none' ? 'simulated' : 'processing') : 'error',
                    message: result.message,
                    providerId: result.invoiceId // reusing invoiceId as providerId reference
                };
            }

            if (mode === 'sat') {
                return this.emitSatCoupon(orderId, settings?.sat_endpoint_url);
            }

            if (mode === 'ecf') {
                return this.emitEcfCoupon(orderId, settings?.ecf_endpoint_url);
            }

            if (mode === 'simulated') {
                return this.simulateEmission(orderId, 'simulated');
            }

            return { success: false, status: 'error', message: 'Modo fiscal desconhecido.' };

        } catch (error: any) {
            console.error('Fiscal Emission Error:', error);
            // Log error to DB if possible
            return { success: false, status: 'error', message: error.message };
        }
    }

    async emitSatCoupon(orderId: string, endpointUrl?: string): Promise<FiscalResult> {
        console.log(`[SAT] Emitting for order ${orderId}. Endpoint: ${endpointUrl}`);

        // Check if existing document to avoid duplicates? 
        // For now, assuming re-emission allowed or caught by UI.

        if (!endpointUrl) {
            console.warn('[SAT] Endpoint not configured. Falling back to simulation.');
            return this.simulateEmission(orderId, 'sat');
        }

        try {
            const payload = await this.buildSatPayload(orderId);

            // Create pending document
            let doc = await fiscalService.createDocument({
                order_id: orderId,
                type: 'sat',
                provider: 'sat-local',
                status: 'processing'
            });

            // Call Bridge
            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data: SatBridgeResponse = await response.json();

            // Update Document
            doc = await fiscalService.updateDocument(doc.id, {
                status: data.success ? 'approved' : 'rejected',
                invoice_number: data.satNumber,
                xml_url: data.xml ? `data:text/xml;base64,${data.xml}` : undefined, // Assuming bridge returns base64 or text
                raw_response: data,
                error_message: data.message
            });

            return {
                success: data.success,
                status: doc.status,
                invoiceNumber: data.satNumber,
                printData: data.printData, // Base64 print data or raw
                message: data.message
            };

        } catch (error: any) {
            console.error('[SAT] Bridge Error:', error);
            // Log failure
            // We might want to save the document as 'error'
            await fiscalService.createDocument({
                order_id: orderId,
                type: 'sat',
                provider: 'sat-local',
                status: 'error',
                error_message: error.message
            });

            return { success: false, status: 'error', message: 'Erro ao comunicar com SAT: ' + error.message };
        }
    }

    async emitEcfCoupon(orderId: string, endpointUrl?: string): Promise<FiscalResult> {
        if (!endpointUrl) {
            return this.simulateEmission(orderId, 'ecf');
        }

        try {
            const payload = await this.buildEcfPayload(orderId);

            let doc = await fiscalService.createDocument({
                order_id: orderId,
                type: 'ecf',
                provider: 'ecf-local',
                status: 'processing'
            });

            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data: EcfBridgeResponse = await response.json();

            doc = await fiscalService.updateDocument(doc.id, {
                status: data.success ? 'approved' : 'rejected',
                invoice_number: data.ecfNumber,
                raw_response: data,
                error_message: data.message
            });

            return {
                success: data.success,
                status: doc.status,
                invoiceNumber: data.ecfNumber,
                message: data.message
            };

        } catch (error: any) {
            return { success: false, status: 'error', message: 'Erro ao comunicar com ECF: ' + error.message };
        }
    }

    private async simulateEmission(orderId: string, type: 'sat' | 'ecf' | 'simulated'): Promise<FiscalResult> {
        const order = await db.getOrder(orderId);

        // Generate simulated data
        const doc = await fiscalService.createDocument({
            order_id: orderId,
            type: type === 'simulated' ? 'simulated' : type,
            provider: 'simulated',
            status: 'simulated', // or approved? User asked for status=simulated for simulated mode.
            invoice_number: `SIM-${Math.floor(Math.random() * 10000)}`,
            raw_response: { note: 'Generated by Farmavida Simulator' }
        });

        return {
            success: true,
            status: 'simulated',
            invoiceNumber: doc.invoice_number,
            message: `Documento Fiscal (${type.toUpperCase()}) Simulado com Sucesso`,
            printData: this.generateSimulatedPrintData(order, type) // Generate some text for printing
        };
    }

    async printFiscalReprint(orderId: string): Promise<string> {
        // Logic to get print data for an existing document
        const docs = await fiscalService.getDocumentsByOrder(orderId);
        const approved = docs.find(d => d.status === 'approved' || d.status === 'simulated');

        if (!approved) throw new Error('Nenhum documento fiscal aprovado para reimpressão.');

        if (approved.type === 'nfe') {
            // Return URL or handled by UI
            return approved.pdf_url || '';
        }

        if (approved.raw_response?.printData) {
            // If we stored printData (we didn't store it in DB directly as column, but in raw_response maybe?)
            // I added raw_response JSONB.
            return approved.raw_response.printData;
        }

        // Fallback or Simulated reprint
        const order = await db.getOrder(orderId);
        return this.generateSimulatedPrintData(order, approved.type as any, true);
    }

    private async buildSatPayload(orderId: string): Promise<any> {
        const order = await db.getOrder(orderId);
        const settings = await fiscalService.getSettings();
        if (!order) throw new Error('Order not found');

        // This should match the bridge expectation
        return {
            orderId: order.id,
            cnpjEmitente: settings?.store_id ? 'CNPJ_FROM_STORE' : 'CNPJ_DEMO', // Need store details
            numeroCaixa: '001', // Config?
            itens: order.items.map((i, idx) => ({
                number: idx + 1,
                code: i.productId,
                description: i.productName,
                qtd: i.quantity,
                valorUnitario: i.priceAtPurchase,
                total: i.priceAtPurchase * i.quantity,
                ncm: '30049099', // should fetch from product
                cfop: '5102'
            })),
            total: order.totalAmount,
            pagamento: {
                tipo: order.paymentMethod
            },
            cliente: {
                cpf: order.customerId ? 'CPF_FETCHED' : null // Should fetch customer
            }
        };
    }

    private async buildEcfPayload(orderId: string): Promise<any> {
        const order = await db.getOrder(orderId);
        if (!order) throw new Error('Order not found');
        return {
            orderId: order.id,
            itens: order.items,
            total: order.totalAmount,
            formaPagamento: order.paymentMethod
        };
    }

    private generateSimulatedPrintData(order: any, type: string, isReprint = false): string {
        return `
========================================
       ${isReprint ? '*** 2a VIA ***' : '*** SIMULACAO ***'}
           ${type.toUpperCase()}
========================================
Estabelecimento: Farmavida
Data: ${new Date().toLocaleString()}
Pedido: ${order?.displayId || order?.id}
----------------------------------------
ITEM   QTD   VALOR
${order?.items.map((i: any) => `${i.productName.substring(0, 10)} ${i.quantity}x ${i.priceAtPurchase.toFixed(2)}`).join('\n')}
----------------------------------------
TOTAL R$: ${order?.totalAmount?.toFixed(2)}
----------------------------------------
    NAO VALIDO COMO DOCUMENTO FISCAL
========================================
`;
    }
}

export const fiscalPrinterService = new FiscalPrinterService();
