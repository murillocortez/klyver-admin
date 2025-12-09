import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Save, Building2, Truck, CreditCard, Bell, Shield, Store, RefreshCw, Check, AlertCircle, Search, Filter, Plus, Trash2, Edit2, Copy, Zap, Banknote, Users, Lock, Smartphone, Info,
    Eye, EyeOff, HelpCircle, Image as ImageIcon, Key, Layout, MapPin, Palette, Phone, Mail, Globe, ChevronRight, Facebook, Instagram, Linkedin, Twitter, X, Printer, FileText
} from 'lucide-react';
import { db } from '../services/dbService';
import { AppSettings, Role, User } from '../types';
import { PrinterSettings } from './PrinterSettings';
import { FiscalSettings } from './FiscalSettings';
import { NotificationSettings } from './NotificationSettings';
import { CashbackSettingsTab } from './CashbackSettingsTab';

// --- Components ---

const TabButton = ({ active, onClick, icon: Icon, label, badge }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-medium text-sm whitespace-nowrap relative
      ${active
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
    >
        <Icon size={18} className={active ? 'text-blue-600' : 'text-gray-400'} />
        <span>{label}</span>
        {badge && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
    </button>
);

const SectionHeader = ({ title, description, icon: Icon }: any) => (
    <div className="mb-6 pb-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {Icon && <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><Icon size={18} /></div>}
            {title}
        </h3>
        {description && <p className="text-sm text-gray-500 mt-1 ml-9">{description}</p>}
    </div>
);

const InputGroup = ({ label, children, helpText, required }: any) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {helpText && <p className="text-xs text-gray-400 flex items-center gap-1"><Info size={10} /> {helpText}</p>}
    </div>
);

const ToggleCard = ({ title, description, checked, onChange, icon: Icon }: any) => (
    <div
        onClick={() => onChange(!checked)}
        className={`cursor-pointer p-4 rounded-xl border transition-all flex items-center justify-between group
        ${checked
                ? 'bg-blue-50 border-blue-200 shadow-sm'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
    >
        <div className="flex items-center gap-3">
            {Icon && (
                <div className={`p-2 rounded-lg ${checked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    <Icon size={20} />
                </div>
            )}
            <div>
                <p className={`font-bold text-sm ${checked ? 'text-blue-900' : 'text-gray-700'}`}>{title}</p>
                {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
            </div>
        </div>
        <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
        </div>
    </div>
);

export const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general');
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: Role.OPERADOR });
    const [showApiToken, setShowApiToken] = useState(false);
    const [showPasswordPolicy, setShowPasswordPolicy] = useState(false);
    const [showAuditLogs, setShowAuditLogs] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const s = await db.getSettings();
                const u = await db.getUsers();
                const role = await db.getCurrentUserRole();
                setSettings(s);
                setUsers(u);
                setCurrentUserRole(role);
            } catch (error) {
                console.error('Error loading settings:', error);
                alert('Erro ao carregar configurações.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await db.updateSettings(settings);
            // Simulate network delay for better UX
            await new Promise(resolve => setTimeout(resolve, 800));
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 3000);
        } catch (error: any) {
            console.error('Error saving settings:', error);
            alert(`Erro ao salvar configurações: ${error.message || JSON.stringify(error)}`);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (section: keyof AppSettings, field: string, value: any) => {
        if (!settings) return;
        setSettings({
            ...settings,
            [section]: {
                ...(settings[section as keyof AppSettings] as any),
                [field]: value
            }
        });
    };

    const handleDeepChange = (section: keyof AppSettings, subSection: string, field: string, value: any) => {
        if (!settings) return;
        const currentSection = settings[section] as any;
        setSettings({
            ...settings,
            [section]: {
                ...currentSection,
                [subSection]: {
                    ...currentSection[subSection],
                    [field]: value
                }
            }
        });
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Generate Random Password
            const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            // WORKAROUND: Client-side simulation of user creation with manual credential distribution
            alert(`USUÁRIO CRIADO (Simulação):\n\nNome: ${newUser.name}\nEmail: ${newUser.email}\nSenha Temporária: ${tempPassword}\n\nATENÇÃO: Copie esta senha agora! O usuário deve usar "Esqueci minha senha" se perder este acesso.`);

            const mockUser: User = {
                id: Math.random().toString(),
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                avatar: undefined
            };
            setUsers([...users, mockUser]);
            setNewUser({ name: '', email: '', role: Role.OPERADOR });

        } catch (error) {
            console.error('Error adding user:', error);
            alert('Erro ao adicionar usuário.');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: Role) => {
        try {
            await db.updateUserRole(userId, newRole);
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Erro ao atualizar cargo. Verifique suas permissões.');
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (confirm('Tem certeza que deseja remover este usuário da lista? \n\nATENÇÃO: Isso remove apenas o acesso ao painel. O cadastro (login/senha) continuará existindo no sistema. Para excluir totalmente a conta, é necessário contatar o suporte técnico.')) {
            try {
                await db.deleteUser(id);
                setUsers(users.filter(u => u.id !== id));
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Erro ao remover usuário.');
            }
        }
    };

    const handleGenerateToken = () => {
        const token = 'sk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        setSettings(prev => prev ? ({
            ...prev,
            apiToken: token
        }) : null);
    };

    const handleCopyToken = () => {
        if (settings?.apiToken) {
            navigator.clipboard.writeText(settings.apiToken);
            alert('Token copiado!');
        }
    };

    if (loading || !settings) return <div className="flex h-screen items-center justify-center text-gray-500 font-medium">Carregando configurações...</div>;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Configurações</h1>
                    <p className="text-sm text-gray-500 font-medium">Gerencie os parâmetros e integrações da sua farmácia.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4">
                        {/* Botão de salvar movido para as abas individuais */}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto mt-8 px-6">

                {/* Tabs Navigation */}
                <div className="bg-white rounded-t-2xl border-b border-gray-200 flex overflow-x-auto shadow-sm">
                    <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={Building2} label="Geral" />
                    <TabButton active={activeTab === 'operations'} onClick={() => setActiveTab('operations')} icon={Truck} label="Operação" badge={!settings.delivery.fixedFee} />
                    <TabButton active={activeTab === 'team'} onClick={() => setActiveTab('team')} icon={Users} label="Equipe" />
                    <TabButton active={activeTab === 'system'} onClick={() => setActiveTab('system')} icon={Shield} label="Sistema" />
                    <TabButton active={activeTab === 'store'} onClick={() => setActiveTab('store')} icon={Store} label="Loja Virtual" />
                    <TabButton active={activeTab === 'printers'} onClick={() => setActiveTab('printers')} icon={Printer} label="Impressoras" />
                    <TabButton active={activeTab === 'fiscal'} onClick={() => setActiveTab('fiscal')} icon={FileText} label="Fiscal" />
                    <TabButton active={activeTab === 'cashback'} onClick={() => setActiveTab('cashback')} icon={Banknote} label="Cashback" />
                    <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={Bell} label="Notificações" />
                </div>

                <div className="bg-white rounded-b-2xl shadow-sm border border-gray-200 border-t-0 p-8 min-h-[600px]">
                    {/* --- TAB: NOTIFICATIONS --- */}
                    {activeTab === 'notifications' && (
                        <div className="animate-in fade-in duration-300">
                            <NotificationSettings />
                        </div>
                    )}

                    {/* --- TAB: CASHBACK --- */}
                    {activeTab === 'cashback' && <CashbackSettingsTab />}


                    {/* --- TAB: GENERAL --- */}
                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in duration-300">
                            {/* Left Column: Pharmacy Info */}
                            <div className="lg:col-span-2 space-y-8">
                                <section>
                                    <SectionHeader title="Informações da Farmácia" description="Dados legais e de contato visíveis para o cliente." icon={Building2} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputGroup label="Nome da Farmácia" required>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                value={settings.pharmacy.name}
                                                onChange={e => handleChange('pharmacy', 'name', e.target.value)}
                                            />
                                        </InputGroup>
                                        <InputGroup label="CNPJ" required>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                value={settings.pharmacy.cnpj}
                                                onChange={e => handleChange('pharmacy', 'cnpj', e.target.value)}
                                            />
                                        </InputGroup>
                                        <div className="md:col-span-2">
                                            <InputGroup label="Endereço Completo" required>
                                                <div className="relative">
                                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                    <input
                                                        type="text"
                                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                        value={settings.pharmacy.address}
                                                        onChange={e => handleChange('pharmacy', 'address', e.target.value)}
                                                    />
                                                </div>
                                            </InputGroup>
                                        </div>
                                        <InputGroup label="Telefone">
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                    value={settings.pharmacy.phone}
                                                    onChange={e => handleChange('pharmacy', 'phone', e.target.value)}
                                                />
                                            </div>
                                        </InputGroup>
                                        <InputGroup label="Email de Contato">
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="email"
                                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                    value={settings.pharmacy.email}
                                                    onChange={e => handleChange('pharmacy', 'email', e.target.value)}
                                                />
                                            </div>
                                        </InputGroup>
                                        <InputGroup label="Site URL">
                                            <div className="relative">
                                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                    value={settings.pharmacy.siteUrl || ''}
                                                    onChange={e => handleChange('pharmacy', 'siteUrl', e.target.value)}
                                                    placeholder="https://suafarmacia.com.br"
                                                />
                                            </div>
                                        </InputGroup>
                                        <div className="md:col-span-2">
                                            <InputGroup label="Horário de Funcionamento" helpText="Exibido no rodapé do site.">
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                    value={settings.pharmacy.openingHours}
                                                    onChange={e => handleChange('pharmacy', 'openingHours', e.target.value)}
                                                    placeholder="Ex: Seg-Sex 08:00 - 22:00"
                                                />
                                            </InputGroup>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <SectionHeader title="Responsável Técnico" description="Informações obrigatórias pela ANVISA." icon={Shield} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                        <InputGroup label="Nome do Farmacêutico" required>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                value={settings.pharmacy.pharmacistName || ''}
                                                onChange={e => handleChange('pharmacy', 'pharmacistName', e.target.value)}
                                                placeholder="Dr. João Silva"
                                            />
                                        </InputGroup>
                                        <InputGroup label="Registro (CRF)" required>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                value={settings.pharmacy.pharmacistRegister || ''}
                                                onChange={e => handleChange('pharmacy', 'pharmacistRegister', e.target.value)}
                                                placeholder="CRF/SP 12345"
                                            />
                                        </InputGroup>
                                    </div>

                                    {/* Additional Pharmacists */}
                                    <div className="mt-4 space-y-4">
                                        {settings.pharmacy.additionalPharmacists?.map((pharm, index) => (
                                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-200 relative group">
                                                <button
                                                    onClick={() => {
                                                        const current = [...(settings.pharmacy.additionalPharmacists || [])];
                                                        current.splice(index, 1);
                                                        handleChange('pharmacy', 'additionalPharmacists', current);
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                                                    title="Remover farmacêutico"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <InputGroup label="Nome do Farmacêutico" required>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                        value={pharm.name}
                                                        onChange={e => {
                                                            const current = [...(settings.pharmacy.additionalPharmacists || [])];
                                                            current[index] = { ...current[index], name: e.target.value };
                                                            handleChange('pharmacy', 'additionalPharmacists', current);
                                                        }}
                                                        placeholder="Dr. Nome Sobrenome"
                                                    />
                                                </InputGroup>
                                                <InputGroup label="Registro (CRF)" required>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                        value={pharm.register}
                                                        onChange={e => {
                                                            const current = [...(settings.pharmacy.additionalPharmacists || [])];
                                                            current[index] = { ...current[index], register: e.target.value };
                                                            handleChange('pharmacy', 'additionalPharmacists', current);
                                                        }}
                                                        placeholder="CRF/UF 00000"
                                                    />
                                                </InputGroup>
                                            </div>
                                        ))}

                                        <button
                                            onClick={() => {
                                                const current = settings.pharmacy.additionalPharmacists || [];
                                                handleChange('pharmacy', 'additionalPharmacists', [...current, { name: '', register: '' }]);
                                            }}
                                            className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                                        >
                                            <Plus size={18} />
                                            Adicionar Farmacêutico
                                        </button>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column: Identity & Social */}
                            <div className="space-y-8">
                                <section>
                                    <SectionHeader title="Identidade Visual" icon={Palette} />
                                    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
                                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                                            {settings.pharmacy.logoUrl ? (
                                                <img src={settings.pharmacy.logoUrl} alt="Logo" className="h-20 object-contain mb-2" />
                                            ) : (
                                                <ImageIcon className="text-gray-400 mb-2" size={40} />
                                            )}
                                            <p className="text-xs font-bold text-gray-500 group-hover:text-blue-600">Clique para alterar logo</p>
                                        </div>
                                        <InputGroup label="URL do Logo">
                                            <input
                                                type="text"
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                value={settings.pharmacy.logoUrl}
                                                onChange={e => handleChange('pharmacy', 'logoUrl', e.target.value)}
                                            />
                                        </InputGroup>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Cor Primária</label>
                                                <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl">
                                                    <input
                                                        type="color"
                                                        className="h-8 w-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                                                        value={settings.pharmacy.primaryColor}
                                                        onChange={e => handleChange('pharmacy', 'primaryColor', e.target.value)}
                                                    />
                                                    <span className="text-xs font-mono text-gray-600">{settings.pharmacy.primaryColor}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Cor Secundária</label>
                                                <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl">
                                                    <input
                                                        type="color"
                                                        className="h-8 w-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                                                        value={settings.pharmacy.secondaryColor}
                                                        onChange={e => handleChange('pharmacy', 'secondaryColor', e.target.value)}
                                                    />
                                                    <span className="text-xs font-mono text-gray-600">{settings.pharmacy.secondaryColor}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <SectionHeader title="Redes Sociais" icon={Globe} />
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500"><Smartphone size={18} /></div>
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                                value={settings.socialMedia?.whatsapp || ''}
                                                onChange={e => handleChange('socialMedia', 'whatsapp', e.target.value)}
                                                placeholder="WhatsApp (Link/Número)"
                                            />
                                        </div>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500"><Instagram size={18} /></div>
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none"
                                                value={settings.socialMedia?.instagram || ''}
                                                onChange={e => handleChange('socialMedia', 'instagram', e.target.value)}
                                                placeholder="Instagram"
                                            />
                                        </div>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600"><Facebook size={18} /></div>
                                            <input
                                                type="text"
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none"
                                                value={settings.socialMedia?.facebook || ''}
                                                onChange={e => handleChange('socialMedia', 'facebook', e.target.value)}
                                                placeholder="Facebook"
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Save Button for General Tab */}
                            <div className="col-span-full flex justify-end pt-6 border-t border-gray-100">
                                <div className="flex items-center gap-4">
                                    {showSaveSuccess && (
                                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 text-sm font-bold animate-in fade-in slide-in-from-right-4">
                                            <Check size={16} /> Salvo com sucesso!
                                        </div>
                                    )}
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-all font-bold shadow-lg shadow-gray-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                                        <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: OPERATIONS --- */}
                    {activeTab === 'operations' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in duration-300">
                            {/* Delivery Settings */}
                            <section>
                                <SectionHeader title="Configurações de Entrega" description="Defina como seus produtos chegam ao cliente." icon={Truck} />

                                <div className="space-y-4 mb-8">
                                    <ToggleCard
                                        title="Delivery (Motoboy)"
                                        description="Habilitar entrega própria ou terceirizada."
                                        checked={settings.delivery.methods.delivery}
                                        onChange={(val: boolean) => handleDeepChange('delivery', 'methods', 'delivery', val)}
                                        icon={Truck}
                                    />
                                    <ToggleCard
                                        title="Retirada na Loja"
                                        description="O cliente compra online e busca no balcão."
                                        checked={settings.delivery.methods.pickup}
                                        onChange={(val: boolean) => handleDeepChange('delivery', 'methods', 'pickup', val)}
                                        icon={Store}
                                    />
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 grid grid-cols-2 gap-6">
                                    <InputGroup label="Taxa Fixa (R$)">
                                        <input
                                            type="number"
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-gray-900"
                                            value={settings.delivery.fixedFee}
                                            onChange={e => handleChange('delivery', 'fixedFee', parseFloat(e.target.value))}
                                        />
                                    </InputGroup>
                                    <InputGroup label="Frete Grátis Acima de">
                                        <input
                                            type="text"
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-green-600"
                                            value={settings.delivery.freeShippingThreshold === 0 ? '' : settings.delivery.freeShippingThreshold}
                                            onChange={e => {
                                                const val = e.target.value;
                                                handleChange('delivery', 'freeShippingThreshold', val === '' ? 0 : parseFloat(val));
                                            }}
                                            placeholder="Sem mínimo"
                                        />
                                    </InputGroup>
                                    <div className="col-span-2">
                                        <InputGroup label="Tempo Estimado (min)">
                                            <input
                                                type="number"
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                value={settings.pharmacy.estimatedDeliveryTime}
                                                onChange={e => handleChange('pharmacy', 'estimatedDeliveryTime', parseFloat(e.target.value))}
                                                placeholder="Ex: 45"
                                            />
                                        </InputGroup>
                                    </div>
                                </div>
                            </section>

                            {/* Payment Settings */}
                            <section>
                                <SectionHeader title="Meios de Pagamento" description="Gerencie as formas de recebimento aceitas." icon={CreditCard} />

                                <div className="space-y-4">
                                    {/* PIX Block */}
                                    <div className={`border rounded-2xl overflow-hidden transition-all ${settings.payment.pixEnabled ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'}`}>
                                        <div className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Zap size={20} /></div>
                                                <span className="font-bold text-gray-900">PIX</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={settings.payment.pixEnabled}
                                                    onChange={e => handleChange('payment', 'pixEnabled', e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 transition-colors"></div>
                                            </label>
                                        </div>
                                        {settings.payment.pixEnabled && (
                                            <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                                                <InputGroup label="Chave PIX">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            className="flex-1 border border-green-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-green-500/20 outline-none"
                                                            placeholder="CPF, CNPJ, Email ou Aleatória"
                                                            value={settings.payment.pixKey}
                                                            onChange={e => handleChange('payment', 'pixKey', e.target.value)}
                                                        />
                                                        <button className="p-2 bg-white border border-green-200 rounded-xl text-green-600 hover:bg-green-50">
                                                            <Copy size={18} />
                                                        </button>
                                                    </div>
                                                </InputGroup>
                                            </div>
                                        )}
                                    </div>

                                    <ToggleCard
                                        title="Cartão de Crédito"
                                        description="Visa, Mastercard, Elo, etc."
                                        checked={settings.payment.creditCardEnabled}
                                        onChange={(val: boolean) => handleChange('payment', 'creditCardEnabled', val)}
                                        icon={CreditCard}
                                    />
                                    {settings.payment.creditCardEnabled && (
                                        <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                                            <InputGroup label="Máximo de Parcelas (Sem Juros)">
                                                <select
                                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                                                    value={settings.payment.maxInstallments || 3}
                                                    onChange={e => handleChange('payment', 'maxInstallments', parseInt(e.target.value))}
                                                >
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map(num => (
                                                        <option key={num} value={num}>{num}x {num === 1 ? '(À vista)' : 'Sem juros'}</option>
                                                    ))}
                                                </select>
                                            </InputGroup>
                                        </div>
                                    )}

                                    <ToggleCard
                                        title="Cartão de Débito"
                                        checked={settings.payment.debitCardEnabled}
                                        onChange={(val: boolean) => handleChange('payment', 'debitCardEnabled', val)}
                                        icon={CreditCard}
                                    />

                                    <ToggleCard
                                        title="Dinheiro"
                                        description="Pagamento na entrega."
                                        checked={settings.payment.cashEnabled}
                                        onChange={(val: boolean) => handleChange('payment', 'cashEnabled', val)}
                                        icon={Banknote}
                                    />

                                    <div className="pt-4">
                                        <InputGroup label="Instruções ao Entregador" helpText="Ex: Levar maquininha.">
                                            <textarea
                                                rows={3}
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                                                value={settings.payment.customInstructions}
                                                onChange={e => handleChange('payment', 'customInstructions', e.target.value)}
                                            />
                                        </InputGroup>
                                    </div>
                                </div>
                            </section>

                            {/* Save Button for Operations Tab */}
                            <div className="col-span-full flex justify-end pt-6 border-t border-gray-100">
                                <div className="flex items-center gap-4">
                                    {showSaveSuccess && (
                                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 text-sm font-bold animate-in fade-in slide-in-from-right-4">
                                            <Check size={16} /> Salvo com sucesso!
                                        </div>
                                    )}
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-all font-bold shadow-lg shadow-gray-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                                        <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: TEAM --- */}
                    {activeTab === 'team' && (
                        <div className="space-y-10 animate-in fade-in duration-300">

                            {/* Role Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                                <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-3">
                                        <Lock size={20} />
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-sm">CEO</h4>
                                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">Acesso total. Administra cargos, segurança e configurações críticas.</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-2xl border border-purple-100 shadow-sm">
                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-3">
                                        <Shield size={20} />
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-sm">ADMIN</h4>
                                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">Acesso quase total. Exceto configurações críticas e nível master.</p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-3">
                                        <Users size={20} />
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-sm">GERENTE</h4>
                                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">Pode: Add/Edit produtos, Promoções, Pedidos. NÃO pode: Excluir produtos, Configs.</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-white p-5 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-3">
                                        <Truck size={20} />
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-sm">OPERADOR</h4>
                                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">Pode: Ver/Atualizar Pedidos. NÃO pode: Editar produtos, Relatórios.</p>
                                </div>
                                <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-2xl border border-gray-200 shadow-sm opacity-75">
                                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 mb-3">
                                        <AlertCircle size={20} />
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-sm">NENHUM</h4>
                                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">Novo usuário. Sem acesso a nada até receber cargo.</p>
                                </div>
                            </div>

                            {/* Add User Form */}
                            {(currentUserRole === Role.CEO || currentUserRole === Role.ADMIN) && (
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Plus className="w-5 h-5 text-blue-600" /> Adicionar Novo Membro
                                    </h4>
                                    <form onSubmit={handleAddUser} className="flex flex-col md:flex-row gap-4 items-end">
                                        <div className="flex-1 w-full">
                                            <InputGroup label="Nome Completo" required>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                    placeholder="Ex: Maria Silva"
                                                    value={newUser.name}
                                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                                />
                                            </InputGroup>
                                        </div>
                                        <div className="flex-1 w-full">
                                            <InputGroup label="Email Corporativo" required>
                                                <input
                                                    type="email"
                                                    required
                                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                    placeholder="maria@farmacia.com"
                                                    value={newUser.email}
                                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                                />
                                            </InputGroup>
                                        </div>
                                        <div className="w-full md:w-48">
                                            <InputGroup label="Cargo Inicial" required>
                                                <select
                                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                                                    value={newUser.role}
                                                    onChange={e => setNewUser({ ...newUser, role: e.target.value as Role })}
                                                >
                                                    <option value={Role.OPERADOR}>Operador</option>
                                                    <option value={Role.GERENTE}>Gerente</option>
                                                    <option value={Role.ADMIN}>Admin</option>
                                                </select>
                                            </InputGroup>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="h-[46px] px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-200"
                                        >
                                            Adicionar
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Users List */}
                            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-900">Membros da Equipe</h3>
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{users.length} usuários</span>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Usuário</th>
                                            <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Função</th>
                                            <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {users
                                            .sort((a, b) => {
                                                const order = { [Role.CEO]: 0, [Role.ADMIN]: 1, [Role.GERENTE]: 2, [Role.OPERADOR]: 3, [Role.NENHUM]: 4, [Role.NO_ACCESS]: 5 };
                                                return (order[a.role] || 99) - (order[b.role] || 99);
                                            })
                                            .map(user => (
                                                <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                                                alt=""
                                                                className="w-10 h-10 rounded-full bg-gray-100 object-cover ring-2 ring-white shadow-sm"
                                                            />
                                                            <span className="font-bold text-gray-900">{user.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{user.email || '—'}</td>
                                                    <td className="px-6 py-4">
                                                        {/* Permission Logic: 
                                                            CEO can edit everyone.
                                                            ADMIN can edit everyone EXCEPT CEO.
                                                            Others cannot edit.
                                                        */}
                                                        {(currentUserRole === Role.CEO || (currentUserRole === Role.ADMIN && user.role !== Role.CEO)) ? (
                                                            <select
                                                                value={user.role}
                                                                onChange={(e) => handleUpdateRole(user.id, e.target.value as Role)}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer outline-none ring-1 ring-inset w-32
                                                                    ${user.role === Role.CEO ? 'bg-indigo-50 text-indigo-700 ring-indigo-200' :
                                                                        user.role === Role.ADMIN ? 'bg-purple-50 text-purple-700 ring-purple-200' :
                                                                            user.role === Role.GERENTE ? 'bg-blue-50 text-blue-700 ring-blue-200' :
                                                                                user.role === Role.OPERADOR ? 'bg-green-50 text-green-700 ring-green-200' :
                                                                                    'bg-gray-100 text-gray-600 ring-gray-300'}`}
                                                            >
                                                                <option value={Role.CEO} disabled={currentUserRole !== Role.CEO}>CEO</option>
                                                                <option value={Role.ADMIN}>ADMIN</option>
                                                                <option value={Role.GERENTE}>GERENTE</option>
                                                                <option value={Role.OPERADOR}>OPERADOR</option>
                                                                <option value={Role.NENHUM}>NENHUM</option>
                                                            </select>
                                                        ) : (
                                                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ring-1 ring-inset inline-block w-32 text-center
                                                                ${user.role === Role.CEO ? 'bg-indigo-50 text-indigo-700 ring-indigo-200' :
                                                                    user.role === Role.ADMIN ? 'bg-purple-50 text-purple-700 ring-purple-200' :
                                                                        user.role === Role.GERENTE ? 'bg-blue-50 text-blue-700 ring-blue-200' :
                                                                            user.role === Role.OPERADOR ? 'bg-green-50 text-green-700 ring-green-200' :
                                                                                'bg-gray-100 text-gray-600 ring-gray-300'}`}>
                                                                {user.role === Role.NO_ACCESS ? 'SEM ACESSO' : user.role}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {(currentUserRole === Role.CEO || (currentUserRole === Role.ADMIN && user.role !== Role.CEO)) && (
                                                            <button
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Remover acesso"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: SYSTEM --- */}
                    {activeTab === 'system' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-300">

                            {/* Notifications */}
                            <section>
                                <SectionHeader title="Notificações" description="Controle o que você recebe." icon={Bell} />
                                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-sm">
                                    <div className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="font-bold text-gray-900">Alerta de Estoque Baixo</p>
                                            <p className="text-sm text-gray-500">Receba aviso quando produtos atingirem o mínimo.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.notifications.lowStockAlert}
                                                onChange={e => handleChange('notifications', 'lowStockAlert', e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 transition-colors"></div>
                                        </label>
                                    </div>
                                    <div className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="font-bold text-gray-900">Novos Pedidos</p>
                                            <p className="text-sm text-gray-500">Notificação imediata ao receber vendas.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.notifications.newOrderAlert}
                                                onChange={e => handleChange('notifications', 'newOrderAlert', e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 transition-colors"></div>
                                        </label>
                                    </div>
                                    <div className="p-5 bg-gray-50/50">
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Canais de Envio</p>
                                        <div className="flex gap-6">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-blue-600 focus:ring-blue-500"
                                                    checked={settings.notifications.emailChannel}
                                                    onChange={e => handleChange('notifications', 'emailChannel', e.target.checked)}
                                                />
                                                <span className="text-sm font-medium text-gray-700">Email</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-blue-600 focus:ring-blue-500"
                                                    checked={settings.notifications.pushChannel}
                                                    onChange={e => handleChange('notifications', 'pushChannel', e.target.checked)}
                                                />
                                                <span className="text-sm font-medium text-gray-700">Push Notification</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* API & Security */}
                            <div className="space-y-8">
                                <section>
                                    <SectionHeader title="Integrações & API" description="Chaves para desenvolvedores." icon={Globe} />
                                    <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Chave da API (Token)</label>
                                        <div className="flex gap-2 mb-4 relative z-10">
                                            <div className="flex-1 bg-gray-800 rounded-xl px-4 py-3 font-mono text-sm text-gray-300 border border-gray-700 flex items-center justify-between">
                                                <span>{showApiToken ? settings.apiToken : 'sk_live_••••••••••••••••••••••'}</span>
                                                <button onClick={() => setShowApiToken(!showApiToken)} className="text-gray-500 hover:text-white">
                                                    {showApiToken ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            <button onClick={handleCopyToken} className="p-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                                                <Copy size={20} />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center relative z-10">
                                            <p className="text-xs text-gray-500">Último uso: Nunca</p>
                                            <button onClick={handleGenerateToken} className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                                <RefreshCw size={12} /> Gerar Nova Chave
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <SectionHeader title="Segurança" icon={Lock} />
                                    <div className="bg-white border border-gray-200 rounded-2xl p-2">
                                        <button
                                            onClick={() => setShowPasswordPolicy(true)}
                                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 flex items-center justify-between group transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Key size={18} className="text-gray-400 group-hover:text-blue-600" />
                                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Política de Senhas</span>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
                                        </button>
                                        <button
                                            onClick={() => setShowAuditLogs(true)}
                                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 flex items-center justify-between group transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Layout size={18} className="text-gray-400 group-hover:text-blue-600" />
                                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Logs de Auditoria</span>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
                                        </button>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: STOREFRONT --- */}
                    {activeTab === 'store' && (
                        <div className="max-w-3xl mx-auto animate-in fade-in duration-300 space-y-8">
                            <section>
                                <SectionHeader title="Aparência da Loja" description="Personalize como sua loja aparece para os clientes." icon={Store} />

                                <div className="space-y-6">
                                    <InputGroup label="Mensagem de Boas-vindas (Topo)" helpText="Aparece na barra superior do site.">
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-16 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                    value={settings.store.welcomeMessage}
                                                    onChange={e => handleChange('store', 'welcomeMessage', e.target.value)}
                                                    placeholder="Ex: Entrega grátis hoje!"
                                                    maxLength={60}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                                                    {settings.store.welcomeMessage.length}/60
                                                </span>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Cor de Fundo</label>
                                                    <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl bg-white">
                                                        <input
                                                            type="color"
                                                            className="h-8 w-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                                                            value={settings.store.welcomeMessageBgColor || '#2563eb'}
                                                            onChange={e => handleChange('store', 'welcomeMessageBgColor', e.target.value)}
                                                        />
                                                        <span className="text-xs font-mono text-gray-600">{settings.store.welcomeMessageBgColor || '#2563eb'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Cor do Texto</label>
                                                    <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl bg-white">
                                                        <input
                                                            type="color"
                                                            className="h-8 w-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                                                            value={settings.store.welcomeMessageTextColor || '#ffffff'}
                                                            onChange={e => handleChange('store', 'welcomeMessageTextColor', e.target.value)}
                                                        />
                                                        <span className="text-xs font-mono text-gray-600">{settings.store.welcomeMessageTextColor || '#ffffff'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </InputGroup>

                                    <InputGroup label="Banner Principal (URL)">
                                        <div className="flex gap-2 mb-4">
                                            <input
                                                type="text"
                                                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                                value={settings.store.bannerUrl}
                                                onChange={e => handleChange('store', 'bannerUrl', e.target.value)}
                                                placeholder="https://..."
                                            />
                                            <button className="p-3 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200">
                                                <ImageIcon size={20} />
                                            </button>
                                        </div>

                                        {/* Banner Preview */}
                                        <div className="w-full h-48 rounded-2xl bg-gray-100 overflow-hidden border border-gray-200 relative group">
                                            {settings.store.bannerUrl ? (
                                                <img src={settings.store.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                                    <ImageIcon size={48} className="mb-2 opacity-20" />
                                                    <span className="text-xs font-medium opacity-50">Preview do Banner</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white font-bold text-sm">1200 x 400px Recomendado</span>
                                            </div>
                                        </div>
                                    </InputGroup>
                                </div>
                            </section>

                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100 rounded-2xl p-6 flex items-start gap-4">
                                <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg">
                                    <Layout size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-yellow-900 text-lg mb-1">Personalização Avançada</h4>
                                    <p className="text-sm text-yellow-800 leading-relaxed mb-4">
                                        Para alterar a ordem das categorias, produtos em destaque e outros elementos visuais da vitrine, utilize o módulo de Produtos & Estoque.
                                    </p>
                                    <button
                                        onClick={() => navigate('/products')}
                                        className="text-sm font-bold text-yellow-900 underline hover:text-yellow-700"
                                    >
                                        Ir para Produtos
                                    </button>
                                </div>
                            </div>

                            {/* Save Button for Store Tab */}
                            <div className="flex justify-end pt-6 border-t border-gray-100">
                                <div className="flex items-center gap-4">
                                    {showSaveSuccess && (
                                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 text-sm font-bold animate-in fade-in slide-in-from-right-4">
                                            <Check size={16} /> Salvo com sucesso!
                                        </div>
                                    )}
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-all font-bold shadow-lg shadow-gray-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                                        <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: PRINTERS --- */}
                    {activeTab === 'printers' && (
                        <div className="animate-in fade-in duration-300">
                            <PrinterSettings />
                        </div>
                    )}

                    {/* --- TAB: FISCAL --- */}
                    {activeTab === 'fiscal' && (
                        <div className="animate-in fade-in duration-300">
                            <FiscalSettings />
                        </div>
                    )}

                </div>
            </div>

            {/* Password Policy Modal */}
            {showPasswordPolicy && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Key size={20} className="text-blue-600" /> Política de Senhas
                            </h3>
                            <button onClick={() => setShowPasswordPolicy(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm font-medium text-gray-700">Mínimo de caracteres</span>
                                <select className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none">
                                    <option>8</option>
                                    <option>10</option>
                                    <option>12</option>
                                </select>
                            </div>
                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
                                <span className="text-sm font-medium text-gray-700">Exigir caracteres especiais</span>
                                <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-blue-600" />
                            </label>
                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
                                <span className="text-sm font-medium text-gray-700">Exigir números</span>
                                <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-blue-600" />
                            </label>
                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
                                <span className="text-sm font-medium text-gray-700">Exigir letras maiúsculas</span>
                                <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-blue-600" />
                            </label>
                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
                                <span className="text-sm font-medium text-gray-700">Rotação de senha (dias)</span>
                                <select className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none">
                                    <option>Nunca</option>
                                    <option>30 dias</option>
                                    <option>90 dias</option>
                                </select>
                            </label>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
                            <button
                                onClick={() => {
                                    setShowPasswordPolicy(false);
                                    alert('Política de senhas atualizada com sucesso!');
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                            >
                                Salvar Configurações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Logs Modal */}
            {showAuditLogs && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Layout size={20} className="text-blue-600" /> Logs de Auditoria
                            </h3>
                            <button onClick={() => setShowAuditLogs(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-0">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 font-bold text-gray-500">Data/Hora</th>
                                        <th className="px-6 py-3 font-bold text-gray-500">Usuário</th>
                                        <th className="px-6 py-3 font-bold text-gray-500">Ação</th>
                                        <th className="px-6 py-3 font-bold text-gray-500">Detalhes</th>
                                        <th className="px-6 py-3 font-bold text-gray-500">IP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {[
                                        { date: '2023-12-01 14:30', user: 'Murillo Cortez (CEO)', action: 'Login', details: 'Acesso ao sistema', ip: '192.168.1.10' },
                                        { date: '2023-12-01 14:35', user: 'Murillo Cortez (CEO)', action: 'Update Settings', details: 'Alterou configurações de pagamento', ip: '192.168.1.10' },
                                        { date: '2023-12-01 10:15', user: 'Admin User', action: 'Create Product', details: 'Novo produto: Dipirona', ip: '192.168.1.15' },
                                        { date: '2023-11-30 18:00', user: 'Gerente Loja', action: 'Update Stock', details: 'Ajuste manual: +50 un', ip: '192.168.1.20' },
                                        { date: '2023-11-30 15:45', user: 'Operador Caixa', action: 'Process Order', details: 'Pedido #1234 confirmado', ip: '192.168.1.25' },
                                    ].map((log, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 text-gray-600">{log.date}</td>
                                            <td className="px-6 py-3 font-medium text-gray-900">{log.user}</td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.action.includes('Login') ? 'bg-green-50 text-green-700' :
                                                    log.action.includes('Update') ? 'bg-blue-50 text-blue-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-gray-600">{log.details}</td>
                                            <td className="px-6 py-3 text-gray-400 font-mono text-xs">{log.ip}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl text-center text-xs text-gray-400">
                            Mostrando últimos 5 registros de auditoria.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


