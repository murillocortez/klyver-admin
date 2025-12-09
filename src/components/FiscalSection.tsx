import React, { useEffect, useState } from 'react';
import { FileText, RefreshCw, AlertCircle, CheckCircle, XCircle, Download, Printer, Copy } from 'lucide-react';
import { Order } from '../types';
import { fiscalPrinterService } from '../services/fiscal/fiscalPrinterService';
import { fiscalService } from '../services/fiscalService';
import { FiscalDocument, FiscalSettingsData } from '../services/fiscal/types';
import { useRole } from '../hooks/useRole';

interface FiscalSectionProps {
    order: Order;
}

export const FiscalSection: React.FC<FiscalSectionProps> = ({ order }) => {
    const [documents, setDocuments] = useState<FiscalDocument[]>([]);
    const [settings, setSettings] = useState<FiscalSettingsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { role } = useRole();

    // Permissions
    const canEmit = role === 'CEO' || role === 'ADMIN';
    // const canReprint = true; // All roles can reprint copies/view status

    const fetchData = async () => {
        setLoading(true);
        try {
            const [docs, setts] = await Promise.all([
                fiscalService.getDocumentsByOrder(order.id),
                fiscalService.getSettings()
            ]);
            setDocuments(docs);
            setSettings(setts);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [order.id]);

    const activeDoc = documents.find(d =>
        ['approved', 'processing', 'simulated', 'pending'].includes(d.status)
    ) || documents[0];

    const handleEmit = async () => {
        if (!canEmit) return;
        setActionLoading(true);
        setError(null);
        try {
            const result = await fiscalPrinterService.emitFiscalDocumentForOrder(order.id);
            if (!result.success) {
                setError(result.message || 'Erro desconhecido na emissão');
            }
            // Refresh data
            await fetchData();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao emitir documento fiscal');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReprint = async () => {
        setActionLoading(true);
        try {
            const printContent = await fiscalPrinterService.printFiscalReprint(order.id);
            // If it's a URL (PDF), open it. If it's raw text/base64, handle it.
            if (printContent.startsWith('http') || printContent.startsWith('blob:')) {
                window.open(printContent, '_blank');
            } else {
                // Simulate printing raw content (e.g. to console or alert for now since we don't have a real thermal printer connected to browser)
                console.log("Printing RAW Content:", printContent);
                const printWindow = window.open('', '', 'width=400,height=600');
                if (printWindow) {
                    printWindow.document.write(`<pre style="font-family: monospace; white-space: pre-wrap;">${printContent}</pre>`);
                    printWindow.document.close();
                    printWindow.print();
                }
            }
        } catch (err: any) {
            alert('Erro ao reimprimir: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-center py-8">
                <RefreshCw className="animate-spin text-gray-400" size={24} />
            </div>
        );
    }

    const mode = settings?.mode || 'none';
    const isSimulated = mode === 'simulated' || activeDoc?.type === 'simulated';

    if (mode === 'none') {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 opacity-75">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText size={18} className="text-gray-400" />
                    Documento Fiscal
                </h4>
                <p className="text-sm text-gray-500">Emissão fiscal desativada para esta loja.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Documento Fiscal ({mode === 'nfe' ? 'NF-e' : mode === 'sat' ? 'SAT' : mode === 'ecf' ? 'ECF' : 'Simulado'})
                {isSimulated && (
                    <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">
                        Simulado
                    </span>
                )}
            </h4>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    {error}
                </div>
            )}

            {!activeDoc ? (
                <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-4">Nenhum documento fiscal emitido.</p>
                    {canEmit ? (
                        <button
                            onClick={handleEmit}
                            disabled={actionLoading}
                            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {actionLoading ? <RefreshCw className="animate-spin" size={18} /> : <FileText size={18} />}
                            {mode === 'nfe' ? 'Emitir NF-e' : 'Emitir Cupom Fiscal'}
                        </button>
                    ) : (
                        <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg">Você não tem permissão para emitir documentos fiscais.</p>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Status Card */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm
                                ${activeDoc.status === 'approved' || activeDoc.status === 'simulated' ? 'bg-green-500' :
                                    activeDoc.status === 'canceled' ? 'bg-red-500' :
                                        activeDoc.status === 'rejected' || activeDoc.status === 'error' ? 'bg-red-500' :
                                            'bg-yellow-500'}`}
                            >
                                {activeDoc.status === 'approved' || activeDoc.status === 'simulated' ? <CheckCircle size={20} /> :
                                    activeDoc.status === 'canceled' ? <XCircle size={20} /> :
                                        activeDoc.status === 'rejected' || activeDoc.status === 'error' ? <AlertCircle size={20} /> :
                                            <RefreshCw size={20} className="animate-spin" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 capitalize">
                                    {activeDoc.status === 'simulated' ? 'Simulado OK' : activeDoc.status}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {activeDoc.invoice_number ? `Nº ${activeDoc.invoice_number}` : 'Processando...'}
                                </p>
                            </div>
                        </div>

                        {(activeDoc.status === 'approved' || activeDoc.status === 'simulated') && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleReprint}
                                    className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                                    title="Imprimir / Visualizar"
                                >
                                    <Printer size={18} />
                                </button>
                                {activeDoc.pdf_url && (
                                    <a href={activeDoc.pdf_url} target="_blank" rel="noreferrer" className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-red-600 transition-colors" title="PDF">
                                        <FileText size={18} />
                                    </a>
                                )}
                                {activeDoc.xml_url && (
                                    <a href={activeDoc.xml_url} target="_blank" rel="noreferrer" className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-blue-600 transition-colors" title="XML">
                                        <Download size={18} />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Error Display */}
                    {activeDoc.error_message && activeDoc.status === 'error' && (
                        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">
                            <strong>Erro:</strong> {activeDoc.error_message}
                        </div>
                    )}

                    {/* Reprint Button for Operators/Managers */}
                    <button
                        onClick={handleReprint}
                        disabled={actionLoading}
                        className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <Copy size={14} /> Reimprimir (2ª Via)
                    </button>

                </div>
            )}
        </div>
    );
};
