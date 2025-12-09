import React, { useEffect, useState } from 'react';
import {
  Camera,
  Sparkles,
  X,
  Image as ImageIcon,
  Package,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Settings,
  Info,
  Box,
  Upload,
  XCircle,
  Search
} from 'lucide-react';
import { searchCMED, CMEDItem } from '../services/cmedService';
import { searchAnvisa, AnvisaDrug } from '../services/anvisaService';
import { usePlan } from '../hooks/usePlan';
import { UpgradeModal } from '../components/UpgradeModal';
import { Product, ProductCategory } from '../types';
import { db } from '../services/dbService';
// import { generateProductDescription } from '../services/geminiService';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  initialData?: Product;
}

const emptyProduct: Product = {
  id: '',
  name: '',
  description: '',
  sku: '',
  price: 0,
  images: [],
  category: ProductCategory.MEDICINE,
  requiresPrescription: false,
  stockTotal: 0,
  minStockThreshold: 5,
  batches: [],
  status: 'active',
  unit: 'un',
  barcode: '',
  lastUpdated: ''
};

// Mock AI service to prevent crashes if the module is problematic
const mockGenerateDescription = async (name: string, category: string, currentDescription?: string) => {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const lowerName = name.toLowerCase();
  let description = "";
  let bullets = [];

  // Basic templates based on category/keywords
  if (category === 'Medicamentos' || lowerName.includes('mg') || lowerName.includes('ml') || lowerName.includes('comprimido')) {
    description = `${name} é um medicamento desenvolvido com altos padrões de qualidade para oferecer eficácia e segurança no tratamento. Sua fórmula foi criada para garantir rápida absorção e ação direcionada. Lembre-se: a automedicação pode ser prejudicial à saúde. Consulte sempre um farmacêutico.`;
    bullets = [
      "Alívio eficaz dos sintomas",
      "Fórmula de rápida ação",
      "Qualidade farmacêutica garantida",
      "Siga a orientação médica"
    ];
  } else if (category === 'Higiene' || lowerName.includes('shampoo') || lowerName.includes('sabonete') || lowerName.includes('creme') || lowerName.includes('loção')) {
    description = `Transforme sua rotina de cuidados com ${name}. Com uma fórmula exclusiva e ingredientes selecionados, este produto proporciona uma experiência única de limpeza e hidratação, deixando uma sensação de frescor e bem-estar prolongada. Ideal para quem não abre mão de qualidade.`;
    bullets = [
      "Dermatologicamente testado",
      "Fragrância suave e envolvente",
      "Hidratação e proteção",
      "Uso diário recomendado"
    ];
  } else if (category === 'Vitaminas' || lowerName.includes('vitamina') || lowerName.includes('suplemento') || lowerName.includes('whey')) {
    description = `Maximize seu potencial com ${name}. Este suplemento é o aliado perfeito para sua saúde, fornecendo nutrientes essenciais que podem estar faltando na sua dieta. Desenvolvido para fortalecer seu organismo e trazer mais energia e vitalidade para o seu dia a dia.`;
    bullets = [
      "Suporte nutricional completo",
      "Mais energia e disposição",
      "Fortalecimento do sistema imune",
      "Alta absorção pelo organismo"
    ];
  } else if (category === 'Infantil' || lowerName.includes('fralda') || lowerName.includes('bebê') || lowerName.includes('baby')) {
    description = `O cuidado e carinho que seu bebê merece com ${name}. Desenvolvido especialmente para a pele delicada dos pequenos, oferece proteção, conforto e segurança. Testado por pediatras para garantir o melhor para o seu filho.`;
    bullets = [
      "Hipoalergênico e seguro",
      "Toque suave e confortável",
      "Aprovado por especialistas",
      "Proteção prolongada"
    ];
  } else {
    // Generic fallback
    description = `Conheça o ${name}, a solução ideal que combina qualidade e praticidade. Selecionado para atender às suas necessidades com excelência, este produto da categoria ${category} se destaca pelo ótimo custo-benefício e confiabilidade.`;
    bullets = [
      "Alta qualidade garantida",
      "Excelente custo-benefício",
      "Prático e eficiente",
      "Satisfação comprovada"
    ];
  }

  // Incorporate existing description context if available
  if (currentDescription && currentDescription.trim().length > 5) {
    description = `${description}\n\nDetalhes adicionais: O produto destaca-se também por ${currentDescription.toLowerCase().replace('o produto', '').trim()}.`;
  }

  return {
    description,
    bullets
  };
};

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Product>(emptyProduct);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Search State
  const [searchLoading, setSearchLoading] = useState(false);
  const [anvisaResults, setAnvisaResults] = useState<AnvisaDrug[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSearch = async (query?: string) => {
    const searchTerm = query || formData.name;
    if (!searchTerm || searchTerm.length < 3) return;

    setSearchLoading(true);
    setShowSuggestions(false);

    try {
      // 1. Search ANVISA
      let results = await searchAnvisa(searchTerm);

      // 2. Fallback to CMED if ANVISA returns nothing
      if (results.length === 0) {
        console.log('ANVISA returned no results, trying CMED local database...');
        const cmedResults = await searchCMED(searchTerm);

        if (cmedResults.length > 0) {
          // Map CMED items to AnvisaDrug format for display
          results = cmedResults.map(item => ({
            product_name: item.product_name,
            presentation: item.presentation,
            manufacturer: item.manufacturer,
            active_ingredient: item.active_ingredient,
            registration: item.registration,
            therapeutic_class: item.class,
            status: 'Ativo' // Assumed active if in CMED list
          }));
        }
      }

      setAnvisaResults(results);
      if (results.length > 0) {
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectProduct = async (item: AnvisaDrug) => {
    // 1. Fill Basic Info from ANVISA
    setFormData(prev => ({
      ...prev,
      name: item.product_name,
      manufacturer: item.manufacturer,
      registration: item.registration,
      activeIngredient: item.active_ingredient,
      presentation: item.presentation,
      therapeuticClass: item.therapeutic_class,
      category: ProductCategory.MEDICINE
    }));

    setShowSuggestions(false);
    setSearchLoading(true);

    try {
      // 2. Search CMED for Prices
      // Use name and presentation to find best match
      const cmedResults = await searchCMED(item.product_name);

      // Try to find exact match by registration or presentation
      const match = cmedResults.find(c =>
        (item.registration && c.registration && c.registration.replace(/\D/g, '') === item.registration.replace(/\D/g, '')) ||
        (c.presentation && item.presentation && c.presentation.toLowerCase().includes(item.presentation.toLowerCase()))
      );

      const bestMatch = match || cmedResults[0];

      if (bestMatch) {
        setFormData(prev => ({
          ...prev,
          pmcPrice: bestMatch.price_pmc,
          pmvgPrice: bestMatch.price_pmvg,
          // If we have a match, we can also update other fields if they were missing
          manufacturer: bestMatch.manufacturer || prev.manufacturer,
          registration: bestMatch.registration || prev.registration
        }));
      }
    } catch (error) {
      console.error("CMED Search failed", error);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.images && initialData.images.length > 0) {
        setImageUrlInput(initialData.images[0]);
      } else {
        setImageUrlInput('');
      }
    } else {
      setFormData({ ...emptyProduct, id: '' });
      setImageUrlInput('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const { checkAccess } = usePlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleGenerateAI = async () => {
    if (!checkAccess('ai_description')) {
      setShowUpgradeModal(true);
      return;
    }

    if (!formData.name) return alert('Preencha o nome do produto primeiro.');
    setIsGenerating(true);
    try {
      // Use the mock service for now to ensure stability
      // const result = await generateProductDescription(formData.name, formData.category as string);
      const result = await mockGenerateDescription(formData.name, formData.category as string, formData.description);

      setFormData(prev => ({
        ...prev,
        description: result.description,
        instructions: result.bullets.map(b => `• ${b}`).join('\n')
      }));
    } catch (error) {
      console.error("Error generating description", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      images: imageUrlInput ? [imageUrlInput] : [],
      lastUpdated: new Date().toISOString()
    };
    onSave(finalData);
  };

  // Helper to calculate discount percentage safely
  const discountPercentage = (formData.promotionalPrice && formData.price > 0)
    ? Math.round(((formData.price - formData.promotionalPrice) / formData.price) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Package size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {initialData ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <p className="text-sm text-gray-500">Preencha as informações abaixo para cadastrar.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Main Info */}
            <div className="lg:col-span-2 space-y-8">

              {/* Basic Info Block */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Info size={20} className="text-gray-400" />
                  Informações do Produto
                </h3>

                <div className="space-y-6">
                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Produto</label>
                    <div className="relative">
                      <input
                        required
                        type="text"
                        placeholder="Ex: Dipirona Sódica 500mg"
                        className="w-full border border-gray-200 rounded-xl pl-4 pr-12 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                        value={formData.name}
                        onChange={e => {
                          handleChange('name', e.target.value);
                          // Debounce search
                          if (searchTimeout.current) clearTimeout(searchTimeout.current);
                          searchTimeout.current = setTimeout(() => {
                            if (e.target.value.length >= 3) {
                              handleSearch(e.target.value);
                            }
                          }, 800);
                        }}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {searchLoading ? (
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Search size={20} />
                        )}
                      </div>
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                        <div className="p-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center sticky top-0">
                          <span className="text-xs font-bold text-gray-500 uppercase">Sugestões ANVISA ({anvisaResults.length})</span>
                          <button onClick={() => setShowSuggestions(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                        </div>
                        {anvisaResults.map((item, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSelectProduct(item)}
                            className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors group"
                          >
                            <p className="font-bold text-gray-900 text-sm group-hover:text-blue-700">{item.product_name}</p>
                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                              <span>{item.presentation}</span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full self-center" />
                              <span>{item.manufacturer}</span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full self-center" />
                              <span className="text-blue-600 font-medium">Reg: {item.registration}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">SKU / Código</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Ex: DIP-500-GEN"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono text-sm uppercase"
                          value={formData.sku}
                          onChange={e => handleChange('sku', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Código de Barras (EAN)</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Escaneie ou digite..."
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                          value={formData.barcode || ''}
                          onChange={async e => {
                            const val = e.target.value;
                            handleChange('barcode', val);
                            if (val.length >= 8) {
                              const existing = await db.getProductByBarcode(val);
                              if (existing && existing.id !== formData.id) {
                                alert(`Produto já cadastrado com este código de barras:\n${existing.name}\nPreço: R$ ${existing.price.toFixed(2)}`);
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Categoria</label>
                      <select
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white cursor-pointer"
                        value={formData.category as string}
                        onChange={e => handleChange('category', e.target.value)}
                      >
                        {Object.values(ProductCategory).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formData.category === ProductCategory.CUSTOM && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Nome da Categoria Personalizada</label>
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={formData.customCategory || ''}
                        onChange={e => handleChange('customCategory', e.target.value)}
                      />
                    </div>
                  )}

                  {/* OTC Badge */}
                  {formData.category === ProductCategory.MEDICINE && !formData.requiresPrescription && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-3">
                      <CheckCircle size={18} className="text-green-600" />
                      <p className="text-sm text-green-800 font-medium">Este é um medicamento isento de prescrição (OTC).</p>
                    </div>
                  )}

                  {/* Regulatory Details */}
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-4">Detalhes Regulatórios (CMED/ANVISA)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Registro ANVISA</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          value={formData.registration || ''}
                          onChange={e => handleChange('registration', e.target.value)}
                          placeholder="Ex: 1.0000.0000.000-0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Fabricante</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          value={formData.manufacturer || ''}
                          onChange={e => handleChange('manufacturer', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Princípio Ativo</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          value={formData.activeIngredient || ''}
                          onChange={e => handleChange('activeIngredient', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Apresentação</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          value={formData.presentation || ''}
                          onChange={e => handleChange('presentation', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Classe Terapêutica</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          value={formData.therapeuticClass || ''}
                          onChange={e => handleChange('therapeuticClass', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Block */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <DollarSign size={20} className="text-gray-400" />
                  Formação de Preço
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Cost Price */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preço de Compra (Custo)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none font-medium"
                        value={formData.costPrice || ''}
                        onChange={e => {
                          const cost = parseFloat(e.target.value);
                          const price = formData.price || 0;
                          const realMargin = cost > 0 ? ((price - cost) / cost) * 100 : 0;
                          const suggested = cost * (1 + (formData.desiredMarginPercent || 0) / 100);

                          setFormData(prev => ({
                            ...prev,
                            costPrice: cost,
                            realMargin,
                            suggestedPrice: suggested
                          }));
                        }}
                      />
                    </div>
                  </div>

                  {/* PMC */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">PMC (Monitorado)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none font-medium"
                        value={formData.pmcPrice || ''}
                        onChange={e => handleChange('pmcPrice', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* PMVG */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">PMVG (Governo)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500/20 outline-none font-medium"
                        value={formData.pmvgPrice || ''}
                        onChange={e => handleChange('pmvgPrice', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Desired Margin */}
                  <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Margem Desejada (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-blue-600"
                        value={formData.desiredMarginPercent || ''}
                        onChange={e => {
                          const margin = parseFloat(e.target.value);
                          const cost = formData.costPrice || 0;
                          const suggested = cost * (1 + margin / 100);

                          setFormData(prev => ({
                            ...prev,
                            desiredMarginPercent: margin,
                            suggestedPrice: suggested
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preço Sugerido</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 font-bold text-gray-700">
                          R$ {(formData.suggestedPrice || 0).toFixed(2)}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (formData.suggestedPrice) {
                              const price = formData.suggestedPrice;
                              const cost = formData.costPrice || 0;
                              const realMargin = cost > 0 ? ((price - cost) / cost) * 100 : 0;
                              handleChange('price', price);
                              handleChange('realMargin', realMargin);
                            }
                          }}
                          className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-colors text-xs font-bold"
                          title="Aplicar Preço Sugerido"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Selling Price */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-900 mb-2">Preço de Venda (Final)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        className={`w-full border rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-xl
                          ${(formData.price || 0) < (formData.costPrice || 0) ? 'border-red-300 text-red-600 bg-red-50' :
                            (formData.price || 0) < (formData.suggestedPrice || 0) ? 'border-orange-300 text-orange-600 bg-orange-50' :
                              'border-green-300 text-green-700 bg-green-50'}`}
                        value={formData.price || ''}
                        onChange={e => {
                          const price = parseFloat(e.target.value);
                          const cost = formData.costPrice || 0;
                          const realMargin = cost > 0 ? ((price - cost) / cost) * 100 : 0;

                          setFormData(prev => ({
                            ...prev,
                            price,
                            realMargin
                          }));
                        }}
                      />
                    </div>

                    {/* Alerts */}
                    <div className="mt-2 space-y-1">
                      {formData.pmcPrice && (formData.price || 0) > formData.pmcPrice && (
                        <div className="flex flex-col gap-2 text-xs text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-100">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={14} />
                            ATENÇÃO: O preço de venda está acima do PMC (R$ {formData.pmcPrice.toFixed(2)}). Isso pode ser ilegal.
                          </div>
                          <button
                            type="button"
                            onClick={() => handleChange('price', formData.pmcPrice)}
                            className="self-start px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors text-xs font-bold"
                          >
                            Ajustar para PMC (R$ {formData.pmcPrice.toFixed(2)})
                          </button>
                        </div>
                      )}
                      {(formData.price || 0) < (formData.costPrice || 0) && (
                        <p className="text-xs font-bold text-red-600 flex items-center gap-1">
                          <AlertTriangle size={12} /> Preço abaixo do custo! Prejuízo de R$ {((formData.costPrice || 0) - (formData.price || 0)).toFixed(2)}
                        </p>
                      )}
                      {(formData.price || 0) < (formData.suggestedPrice || 0) && (formData.price || 0) >= (formData.costPrice || 0) && (
                        <p className="text-xs font-bold text-orange-600 flex items-center gap-1">
                          <AlertTriangle size={12} /> Abaixo da margem desejada ({formData.desiredMarginPercent}%)
                        </p>
                      )}
                      {(formData.pmcPrice && (formData.price || 0) > formData.pmcPrice) && (
                        <p className="text-xs font-bold text-blue-600 flex items-center gap-1">
                          <Info size={12} /> Acima do PMC (R$ {formData.pmcPrice})
                        </p>
                      )}
                      {(formData.price || 0) >= (formData.suggestedPrice || 0) && (
                        <p className="text-xs font-bold text-green-600 flex items-center gap-1">
                          <CheckCircle size={12} /> Margem Real: {(formData.realMargin || 0).toFixed(1)}% (Lucro: R$ {((formData.price || 0) - (formData.costPrice || 0)).toFixed(2)})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Promotional Price */}
                  <div className="md:col-span-2 pt-4 border-t border-gray-100">
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                      Preço Promocional (Opcional)
                      {discountPercentage > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                          -{discountPercentage}% OFF
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        className={`w-full border rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-lg
                          ${formData.promotionalPrice ? 'border-red-200 text-red-600 bg-red-50/30' : 'border-gray-200 text-gray-900'}`}
                        value={formData.promotionalPrice || ''}
                        onChange={e => handleChange('promotionalPrice', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description AI Block */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles size={20} className="text-purple-500" />
                    Descrição Inteligente
                  </h3>
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !formData.name}
                    className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? 'Gerando...' : 'Gerar com IA'}
                  </button>
                </div>

                <div className="space-y-4">
                  <textarea
                    rows={5}
                    placeholder="Descreva o uso, benefícios e recomendações do produto..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm leading-relaxed"
                    value={formData.description}
                    onChange={e => handleChange('description', e.target.value)}
                  />
                  {formData.instructions && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Instruções Geradas</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{formData.instructions}</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Image, Stock, Settings */}
            <div className="space-y-8">

              {/* Image Upload */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <ImageIcon size={20} className="text-gray-400" />
                  Imagem
                </h3>

                <div className="space-y-4">
                  <div className="aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden group hover:border-blue-500/50 transition-colors relative">
                    {imageUrlInput ? (
                      <>
                        <img src={imageUrlInput} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-white font-bold text-sm">Trocar Imagem</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 text-gray-400">
                          <Camera size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">Nenhuma imagem</p>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cole a URL da imagem..."
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                    />
                    <Upload size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Inventory */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Box size={20} className="text-gray-400" />
                  Estoque
                </h3>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Atual</label>
                      <input
                        type="number"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={formData.stockTotal}
                        onChange={e => handleChange('stockTotal', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mínimo</label>
                      <input
                        type="number"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={formData.minStockThreshold}
                        onChange={e => handleChange('minStockThreshold', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Stock Status Badge */}
                  <div className={`p-3 rounded-xl flex items-center gap-3 border
                    ${formData.stockTotal === 0 ? 'bg-gray-100 border-gray-200 text-gray-600' :
                      formData.stockTotal <= formData.minStockThreshold ? 'bg-red-50 border-red-100 text-red-700' :
                        'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                    {formData.stockTotal === 0 ? <XCircle size={18} /> :
                      formData.stockTotal <= formData.minStockThreshold ? <AlertTriangle size={18} /> :
                        <CheckCircle size={18} />}
                    <span className="text-sm font-bold">
                      {formData.stockTotal === 0 ? 'Esgotado' :
                        formData.stockTotal <= formData.minStockThreshold ? 'Estoque Baixo' :
                          'Estoque Saudável'}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Validade (Lote Atual)</label>
                    <div className="relative">
                      <input
                        type="date"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={formData.expiryDate || ''}
                        onChange={e => handleChange('expiryDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Settings size={20} className="text-gray-400" />
                  Configurações
                </h3>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-gray-700">Produto Ativo</span>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} onClick={() => handleChange('status', formData.status === 'active' ? 'inactive' : 'active')}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${formData.status === 'active' ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-gray-700">Requer Receita?</span>
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={formData.requiresPrescription}
                      onChange={e => handleChange('requiresPrescription', e.target.checked)}
                    />
                  </label>
                </div>
              </div>

            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white rounded-b-3xl flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition-all active:scale-95 flex items-center gap-2">
            <CheckCircle size={18} />
            Salvar Produto
          </button>
        </div>

      </div>
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="IA Generativa"
        requiredPlan="Avançado"
      />
    </div>
  );
};
