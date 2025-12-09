import React from 'react';
import {
    Building2, MapPin, Phone, Mail, Globe, Shield, Trash2, Plus, Palette, Image as ImageIcon, Smartphone, Instagram, Facebook
} from 'lucide-react';
import { AppSettings } from '../../types';
import { SectionHeader, InputGroup } from './SettingsComponents';

interface GeneralSettingsProps {
    settings: AppSettings;
    handleChange: (section: keyof AppSettings, field: string, value: any) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ settings, handleChange }) => {
    return (
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
        </div>
    );
};
