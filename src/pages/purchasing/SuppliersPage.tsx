import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { supplierService } from '../../services/purchasing/supplierService';
import { Supplier } from '../../services/purchasing/types';
import { useRole } from '../../hooks/useRole';
import { Role } from '../../types';

export const SuppliersPage: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    const { role } = useRole();
    const canManage = [Role.CEO, Role.ADMIN, Role.GERENTE].includes(role as Role);

    // Form State
    const [formData, setFormData] = useState<Partial<Supplier>>({});

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        setLoading(true);
        try {
            const data = await supplierService.getAll();
            setSuppliers(data);
        } catch (error) {
            console.error(error);
            alert('Erro ao carregar fornecedores');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.nome_fantasia && s.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.cnpj && s.cnpj.includes(searchTerm))
    );

    const handleOpenModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData(supplier);
        } else {
            setEditingSupplier(null);
            setFormData({ ativo: true });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await supplierService.update(editingSupplier.id, formData);
                alert('Fornecedor atualizado com sucesso!');
            } else {
                if (!formData.razao_social) return alert('Razão Social é obrigatória');
                await supplierService.create(formData as any);
                alert('Fornecedor cadastrado com sucesso!');
            }
            setIsModalOpen(false);
            loadSuppliers();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar fornecedor.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;
        try {
            await supplierService.delete(id);
            loadSuppliers();
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir fornecedor (pode haver registros vinculados).');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Truck className="text-primary" />
                        Fornecedores
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Gerencie seus parceiros de negócio.</p>
                </div>
                {canManage && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Novo Fornecedor
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Buscar por Razão Social, Fantasia ou CNPJ..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="col-span-full text-center text-gray-500 py-12">Carregando...</p>
                ) : filteredSuppliers.length === 0 ? (
                    <p className="col-span-full text-center text-gray-500 py-12">Nenhum fornecedor encontrado.</p>
                ) : (
                    filteredSuppliers.map(supplier => (
                        <div key={supplier.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-900">{supplier.nome_fantasia || supplier.razao_social}</h3>
                                    {supplier.nome_fantasia && (
                                        <p className="text-xs text-gray-500">{supplier.razao_social}</p>
                                    )}
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${supplier.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {supplier.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                {supplier.cnpj && <p className="font-mono text-xs bg-gray-50 p-1 rounded w-fit">{supplier.cnpj}</p>}
                                {supplier.telefone && <div className="flex items-center gap-2"><Phone size={14} /> {supplier.telefone}</div>}
                                {supplier.email && <div className="flex items-center gap-2"><Mail size={14} /> {supplier.email}</div>}
                                {supplier.whatsapp && <div className="flex items-center gap-2"><span className="font-bold text-green-600">Zap:</span> {supplier.whatsapp}</div>}
                            </div>

                            {canManage && (
                                <div className="flex justify-end gap-2 pt-3 border-t border-gray-50 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(supplier)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(supplier.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-6">{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500">Razão Social *</label>
                                    <input
                                        required
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                        value={formData.razao_social || ''}
                                        onChange={e => setFormData({ ...formData, razao_social: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500">Nome Fantasia</label>
                                    <input
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                        value={formData.nome_fantasia || ''}
                                        onChange={e => setFormData({ ...formData, nome_fantasia: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500">CNPJ</label>
                                    <input
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                        value={formData.cnpj || ''}
                                        onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500">Telefone</label>
                                    <input
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                        value={formData.telefone || ''}
                                        onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500">WhatsApp</label>
                                    <input
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                        value={formData.whatsapp || ''}
                                        onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500">Email</label>
                                    <input
                                        type="email"
                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                        value={formData.email || ''}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500">Observações</label>
                                <textarea
                                    className="w-full p-2 border border-gray-200 rounded-lg h-24"
                                    value={formData.observacao || ''}
                                    onChange={e => setFormData({ ...formData, observacao: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-medium"
                                >
                                    Salvar Fornecedor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
