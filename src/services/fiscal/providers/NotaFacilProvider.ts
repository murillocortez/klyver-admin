import { FiscalProvider, FiscalResult, InvoicePayload } from '../types';

export class NotaFacilProvider implements FiscalProvider {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async emit(payload: InvoicePayload): Promise<FiscalResult> {
        // TODO: Implement Nota Fácil API integration
        // POST https://api.notafacil.io/v1/nfe
        console.log('NotaFacil emit not implemented yet', payload);
        throw new Error('NotaFacil integration not implemented');
    }

    async getStatus(providerId: string): Promise<FiscalResult> {
        // TODO: Implement Nota Fácil API integration
        throw new Error('NotaFacil integration not implemented');
    }

    async cancel(providerId: string, reason?: string): Promise<FiscalResult> {
        // TODO: Implement Nota Fácil API integration
        throw new Error('NotaFacil integration not implemented');
    }
}
