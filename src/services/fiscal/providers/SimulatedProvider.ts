import { FiscalProvider, FiscalResult, InvoicePayload } from '../types';

export class SimulatedProvider implements FiscalProvider {
    async emit(payload: InvoicePayload): Promise<FiscalResult> {
        console.log('SIMULATED EMISSION:', payload);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
            success: true,
            status: 'pending',
            message: 'Simulação de emissão realizada com sucesso.',
            invoiceNumber: 'SIM-' + Math.floor(Math.random() * 10000),
            protocol: 'SIMULATED-PROTOCOL-' + Date.now(),
            xmlUrl: 'https://www.nfe.fazenda.gov.br/portal/exemplo.xml', // Mock URL
            pdfUrl: 'https://www.nfe.fazenda.gov.br/portal/exemplo.pdf', // Mock URL
            rawResponse: { simulated: true }
        };
    }

    async getStatus(providerId: string): Promise<FiscalResult> {
        await new Promise(resolve => setTimeout(resolve, 800));
        return {
            success: true,
            status: 'approved', // Simulate eventual approval
            message: 'Simulated approval',
            providerId
        };
    }

    async cancel(providerId: string, reason?: string): Promise<FiscalResult> {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            success: true,
            status: 'canceled',
            message: 'Simulated cancellation',
            providerId
        };
    }
}
