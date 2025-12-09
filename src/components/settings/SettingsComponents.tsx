import React from 'react';
import { Info } from 'lucide-react';

export const SectionHeader = ({ title, description, icon: Icon }: any) => (
    <div className="mb-6 pb-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {Icon && <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><Icon size={18} /></div>}
            {title}
        </h3>
        {description && <p className="text-sm text-gray-500 mt-1 ml-9">{description}</p>}
    </div>
);

export const InputGroup = ({ label, children, helpText, required }: any) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {helpText && <p className="text-xs text-gray-400 flex items-center gap-1"><Info size={10} /> {helpText}</p>}
    </div>
);

export const ToggleCard = ({ title, description, checked, onChange, icon: Icon }: any) => (
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
