import React, { useState, useEffect } from 'react';
import { Printer, Save, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { getSelectedPrinter, saveSelectedPrinter, PrinterConfig, setAutoPrint, getAutoPrint } from '../services/printerService';
import { useRole } from '../hooks/useRole';
import { Role } from '../types';

export const PrinterSettings: React.FC = () => {
    const { role } = useRole();
    const [config, setConfig] = useState<PrinterConfig>({
        name: '',
        type: 'thermal',
        width: '80mm'
    });
    const [autoPrint, setAutoPrintState] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const savedConfig = getSelectedPrinter();
        setConfig(savedConfig);
        setAutoPrintState(getAutoPrint());
    }, []);

    const handleSave = () => {
        saveSelectedPrinter(config);
        setAutoPrint(autoPrint);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleTestPrint = () => {
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <body style="font-family: monospace; text-align: center; padding: 20px;">
                    <h1>Teste de Impressão</h1>
                    <p>Farma Vida</p>
                    <hr/>
                    <p>Impressora: ${config.name}</p>
                    <p>Tipo: ${config.type}</p>
                    <p>Largura: ${config.width}</p>
                    <hr/>
                    <p>Se você consegue ler isso,</p>
                    <p>sua configuração está correta!</p>
                    <script>window.print();</script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    if (role !== Role.CEO && role !== Role.ADMIN && role !== Role.GERENTE) {
        return (
            <div className="p-8 text-center text-gray-500">
                <AlertTriangle size={48} className="mx-auto mb-4 text-yellow-500" />
                <h2 className="text-xl font-bold">Acesso Restrito</h2>
                <p>Apenas Gerentes e Administradores podem configurar impressoras.</p>
            </div>
        );
    }

    return (
        <div className="w-full">


            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2">
                        <Printer size={20} />
                        Impressora Padrão
                    </h2>
                </div>

                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Impressora (Identificação)</label>
                            <input
                                type="text"
                                value={config.name}
                                onChange={e => setConfig({ ...config, name: e.target.value })}
                                placeholder="Ex: Térmica Balcão 1"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                * Este nome é apenas para identificação interna. A seleção real da impressora ocorre na janela de impressão do navegador.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Impressão</label>
                            <select
                                value={config.type}
                                onChange={e => setConfig({ ...config, type: e.target.value as any })}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                            >
                                <option value="thermal">Térmica (Cupom)</option>
                                <option value="laser">Laser / Jato de Tinta</option>
                                <option value="inkjet">Matricial</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Largura do Papel</label>
                            <select
                                value={config.width}
                                onChange={e => setConfig({ ...config, width: e.target.value as any })}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                            >
                                <option value="80mm">80mm (Cupom Padrão)</option>
                                <option value="A4">A4 (Folha Inteira)</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-blue-900">Impressão Automática</h3>
                            <p className="text-sm text-blue-700 mb-3">
                                Ao ativar, o sistema tentará abrir a janela de impressão automaticamente sempre que um novo pedido for recebido ou finalizado.
                            </p>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoPrint}
                                    onChange={e => setAutoPrintState(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="font-bold text-gray-700">Ativar Impressão Automática</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
                        <button
                            onClick={handleTestPrint}
                            className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-2"
                        >
                            <Printer size={20} />
                            Testar Impressão
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                        >
                            {saved ? <CheckCircle size={20} /> : <Save size={20} />}
                            {saved ? 'Salvo!' : 'Salvar Configurações'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
