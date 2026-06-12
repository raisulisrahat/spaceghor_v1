import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Save, Image as ImageIcon, X, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BrandForm = ({ brand, categories = [], onSave, onCancel }) => {
    const { token } = useAuth();
    const [name, setName] = useState('');
    const [logo, setLogo] = useState(null);
    const [preview, setPreview] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (brand) {
            setName(brand.name || '');
            setPreview(brand.logo);
            
            // Find categories that already have this brand
            const related = categories.filter(cat => {
                const list = cat.brands || [];
                return list.some(b => (typeof b === 'object' ? b.id : b) === brand.id);
            }).map(cat => cat.id);
            setSelectedCategories(related);
        }
    }, [brand, categories]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogo(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleToggleCategory = (catId) => {
        setSelectedCategories(prev => 
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const data = new FormData();
        data.append('name', name);
        if (logo) {
            data.append('logo', logo);
        }

        try {
            let brandId = brand?.id;
            if (brand) {
                await api.patch(`brands/${brand.slug}/`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                const res = await api.post('brands/', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                brandId = res.data.id;
            }

            // Sync Categories
            const syncPromises = categories.map(async (cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                const currentBrands = (cat.brands || []).map(b => typeof b === 'object' ? b.id : b);
                const hasBrand = currentBrands.includes(brandId);

                if (isSelected && !hasBrand) {
                    const newBrands = [...currentBrands, brandId];
                    return api.patch(`categories/${cat.slug}/`, { brands: newBrands });
                } else if (!isSelected && hasBrand) {
                    const newBrands = currentBrands.filter(id => id !== brandId);
                    return api.patch(`categories/${cat.slug}/`, { brands: newBrands });
                }
                return Promise.resolve();
            });

            await Promise.all(syncPromises);
            onSave();
        } catch (err: any) {
            console.error("Save failed:", err);
            setError(err.response?.data?.detail || err.response?.data?.message || "Failed to save brand and sync categories.");
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
                        {brand ? 'Update' : 'Initialize'} <span className="text-[#5173FB]">Brand Identity</span>
                    </h3>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Brand Asset Configuration</p>
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
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Brand Name <span className="text-[#5173FB] font-black">*</span></label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#5173FB]/10 focus:border-[#5173FB] transition-all outline-none placeholder:text-zinc-300 shadow-inner"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Nike, Samsung"
                                required
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1 mb-1">Brand Mark / Logo</label>
                            <div className="group relative border-2 border-dashed border-zinc-200 rounded-2xl p-4 text-center hover:bg-zinc-50 hover:border-[#5173FB] transition-all bg-zinc-50/50 flex flex-col items-center justify-center min-h-[180px]">
                                <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                                {preview ? (
                                    <div className="relative h-32 w-full p-2 bg-white rounded-xl shadow-inner flex items-center justify-center">
                                        <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg" />
                                        <div className="absolute inset-0 bg-zinc-900/60 opacity-0 group-hover:opacity-100 transition-all rounded-xl flex items-center justify-center backdrop-blur-[2px]">
                                            <div className="text-[9px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                                                <Upload size={12} /> Replace Mark
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 group-hover:scale-110 transition-transform">
                                        <div className="p-3 bg-white rounded-2xl shadow-sm text-zinc-300 group-hover:text-[#5173FB] group-hover:rotate-12 transition-all">
                                            <ImageIcon size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Inject mark</p>
                                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter mt-1 italic">Transparent PNG Preferred</p>
                                        </div>
                                    </div>
                                )}
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
                        {loading ? 'SYNCING...' : 'SAVE BRAND'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BrandForm;
