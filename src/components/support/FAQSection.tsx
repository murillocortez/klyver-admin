import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, PlayCircle, FileText, ChevronRight } from 'lucide-react';
import { supportService, FAQ_ARTICLES } from '../../services/supportService';

export const FAQSection: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<typeof FAQ_ARTICLES[0] | null>(null);

    const filteredArticles = FAQ_ARTICLES.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory ? article.category === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    const categories = Array.from(new Set(FAQ_ARTICLES.map(a => a.category)));

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Digite sua dúvida e encontre artigos..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedCategory ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    Todos
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.map(article => (
                    <div
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition-all cursor-pointer bg-white group"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{article.title}</h4>
                                    <p className="text-sm text-gray-500 line-clamp-2">{article.description}</p>
                                </div>
                            </div>
                            <ChevronRight className="text-gray-300 group-hover:text-blue-400" size={20} />
                        </div>
                    </div>
                ))}
            </div>

            {filteredArticles.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <p>Nenhum artigo encontrado para sua busca.</p>
                </div>
            )}

            {/* Article Modal */}
            {selectedArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
                            <div>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md mb-2 inline-block">
                                    {selectedArticle.category}
                                </span>
                                <h2 className="text-xl font-bold text-gray-900">{selectedArticle.title}</h2>
                            </div>
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <p className="text-gray-600 text-lg leading-relaxed">
                                {selectedArticle.description}
                            </p>

                            {selectedArticle.videoUrl && (
                                <div className="aspect-video w-full bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                                    <iframe
                                        src={selectedArticle.videoUrl}
                                        className="w-full h-full"
                                        title="Video Tutorial"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}

                            {selectedArticle.steps && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Passo a Passo</h3>
                                    <ol className="space-y-3">
                                        {selectedArticle.steps.map((step, idx) => (
                                            <li key={idx} className="flex gap-4 items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                                                    {idx + 1}
                                                </span>
                                                <span className="text-gray-700">{step}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                            >
                                Entendi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
