import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Save, X, Ruler, Type } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SizeForm = ({ size, categories = [], onSave, onCancel }) => {
    const { token } = useAuth();
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (size) {
            setName(size.name || '');
            setCode(size.code || '');
            
            // Find categories that already have this size
            const related = categories.filter(cat => {
                const list = cat.sizes || [];
                return list.some(s => (typeof s === 'object' ? s.id : s) === size.id);
            }).map(cat => cat.id);
            setSelectedCategories(related);
        }
    }, [size, categories]);

    const handleToggleCategory = (catId) => {
        setSelectedCategories(prev => 
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let sizeId = size?.id;
            const data = { name, code };

            if (size) {
                await api.patch(`sizes/${size.id}/`, data);
            } else {
                const res = await api.post('sizes/', data);
                sizeId = res.data.id;
            }

            // Sync Categories
            const syncPromises = categories.map(async (cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                const currentSizes = (cat.sizes || []).map(s => typeof s === 'object' ? s.id : s);
                const hasSize = currentSizes.includes(sizeId);

                if (isSelected && !hasSize) {
                    const newSizes = [...currentSizes, sizeId];
                    return api.patch(`categories/${cat.slug}/`, { sizes: newSizes });
                } else if (!isSelected && hasSize) {
                    const newSizes = currentSizes.filter(id => id !== sizeId);
                    return api.patch(`categories/${cat.slug}/`, { sizes: newSizes });
                }
                return Promise.resolve();
            });

            await Promise.all(syncPromises);
            onSave();
        } catch (err: any) {
            console.error("Save failed:", err);
            setError(err.response?.data?.detail || err.response?.data?.message || "Failed to save size and sync categories.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden transition-all duration-300 font-sans max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/30">
                <div>
                    <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                        {size ? 'Update' : 'Create New'} <span className="text-brand">Dimension</span>
                    </h3>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Physical Attribute Configuration</p>
                </div>
                <button onClick={onCancel} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all active:scale-90">
                    <X size={16} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-[10px] font-bold text-red-500 uppercase tracking-tight">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Size Name <span className="text-brand font-black">*</span></label>
                            <div className="relative group">
                                <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-brand transition-colors" size={14} />
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all outline-none placeholder:text-zinc-300 shadow-inner"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Extra Large, US 10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Size Code <span className="text-zinc-400 font-medium">(Short identifier)</span></label>
                            <div className="relative group">
                                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-brand transition-colors" size={14} />
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all outline-none placeholder:text-zinc-300 shadow-inner"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="e.g., XL, 42"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center gap-4 shadow-inner">
                            <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 font-bold text-xs shadow-sm">
                                {code || name.substring(0, 2).toUpperCase() || '??'}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Identifier Preview</p>
                                <p className="text-xs font-bold text-zinc-900 uppercase tracking-tight">{name || 'Unnamed Dimension'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Related Categories</label>
                        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 max-h-[300px] overflow-y-auto shadow-inner space-y-1.5 custom-scrollbar">
                            {categories.length === 0 ? (
                                <p className="text-[10px] text-zinc-400 italic p-4 text-center">No categories found in system.</p>
                            ) : (
                                categories.map(cat => (
                                    <label key={cat.id} className="flex items-center gap-3 p-2.5 hover:bg-white rounded-xl cursor-pointer transition-all border border-transparent hover:border-zinc-100 group">
                                        <input 
                                            type="checkbox"
                                            checked={selectedCategories.includes(cat.id)}
                                            onChange={() => handleToggleCategory(cat.id)}
                                            className="w-4 h-4 rounded border-zinc-300 text-brand focus:ring-brand/20"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-zinc-700 group-hover:text-zinc-900">{cat.name}</span>
                                            {cat.parent_name && <span className="text-[8px] font-bold text-zinc-400 uppercase">Sub of {cat.parent_name}</span>}
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-6 border-t border-zinc-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-2 text-[10px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 transition-all active:scale-95 disabled:opacity-50"
                        disabled={loading}
                    >
                        CANCEL
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-brand text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-zinc-950/10"
                    >
                        <Save size={14} />
                        {loading ? 'SYNCING...' : 'SAVE SIZE'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SizeForm;
