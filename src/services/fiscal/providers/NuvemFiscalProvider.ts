import { FiscalProvider, FiscalResult, InvoicePayload } from '../types';

export class NuvemFiscalProvider implements FiscalProvider {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async emit(payload: InvoicePayload): Promise<FiscalResult> {
        // TODO: Implement Nuvem Fiscal API integration
        // POST https://api.nuvemfiscal.com.br/nf-e
        console.log('NuvemFiscal emit not implemented yet', payload);
        throw new Error('NuvemFiscal integration not implemented');
    }

    async getStatus(providerId: string): Promise<FiscalResult> {
        // TODO: Implement Nuvem Fiscal API integration
        // GET https://api.nuvemfiscal.com.br/nf-e/{id}
        throw new Error('NuvemFiscal integration not implemented');
    }

    async cancel(providerId: string, reason?: string): Promise<FiscalResult> {
        // TODO: Implement Nuvem Fiscal API integration
        // POST https://api.nuvemfiscal.com.br/nf-e/{id}/cancelamento
        throw new Error('NuvemFiscal integration not implemented');
    }
}
