import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Save, X, Palette, Hash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ColorForm = ({ color, categories = [], onSave, onCancel }) => {
    const { token } = useAuth();
    const [name, setName] = useState('');
    const [hexCode, setHexCode] = useState('#000000');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (color) {
            setName(color.name || '');
            setHexCode(color.hex_code || '#000000');
            
            // Find categories that already have this color
            const related = categories.filter(cat => {
                const list = cat.colors || [];
                return list.some(c => (typeof c === 'object' ? c.id : c) === color.id);
            }).map(cat => cat.id);
            setSelectedCategories(related);
        }
    }, [color, categories]);

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
            let colorId = color?.id;
            const data = { name, hex_code: hexCode };

            if (color) {
                await api.patch(`colors/${color.id}/`, data);
            } else {
                const res = await api.post('colors/', data);
                colorId = res.data.id;
            }

            // Sync Categories
            const syncPromises = categories.map(async (cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                const currentColors = (cat.colors || []).map(c => typeof c === 'object' ? c.id : c);
                const hasColor = currentColors.includes(colorId);

                if (isSelected && !hasColor) {
                    const newColors = [...currentColors, colorId];
                    return api.patch(`categories/${cat.slug}/`, { colors: newColors });
                } else if (!isSelected && hasColor) {
                    const newColors = currentColors.filter(id => id !== colorId);
                    return api.patch(`categories/${cat.slug}/`, { colors: newColors });
                }
                return Promise.resolve();
            });

            await Promise.all(syncPromises);
            onSave();
        } catch (err: any) {
            console.error("Save failed:", err);
            setError(err.response?.data?.detail || err.response?.data?.message || "Failed to save color and sync categories.");
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
                        {color ? 'Update' : 'Create New'} <span className="text-[#5173FB]">Color Aesthetic</span>
                    </h3>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Visual Attribute Configuration</p>
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
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Color Name <span className="text-[#5173FB] font-black">*</span></label>
                            <div className="relative group">
                                <Palette className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#5173FB] transition-colors" size={14} />
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#5173FB]/10 focus:border-[#5173FB] transition-all outline-none placeholder:text-zinc-300 shadow-inner"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Midnight Blue, Crimson"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Hex Code <span className="text-[#5173FB] font-black">*</span></label>
                            <div className="flex gap-2">
                                <div className="relative h-10 w-10 flex-shrink-0 rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
                                    <input
                                        type="color"
                                        value={hexCode}
                                        onChange={(e) => setHexCode(e.target.value)}
                                        className="absolute inset-[-5px] w-[140%] h-[140%] cursor-pointer"
                                    />
                                </div>
                                <div className="relative flex-grow group">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#5173FB] transition-colors" size={14} />
                                    <input
                                        type="text"
                                        className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#5173FB]/10 focus:border-[#5173FB] transition-all outline-none"
                                        value={hexCode}
                                        onChange={(e) => setHexCode(e.target.value)}
                                        placeholder="#000000"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center gap-4 shadow-inner">
                            <div 
                                className="w-12 h-12 rounded-xl shadow-lg border-2 border-white ring-1 ring-zinc-200" 
                                style={{ backgroundColor: hexCode }} 
                            />
                            <div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Visual Preview</p>
                                <p className="text-xs font-bold text-zinc-900 uppercase tracking-tight">{name || 'Unnamed Color'}</p>
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
                                            className="w-4 h-4 rounded border-zinc-300 text-[#5173FB] focus:ring-[#5173FB]/20"
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
                        {loading ? 'SYNCING...' : 'SAVE COLOR'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ColorForm;
