import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Save, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BlogCategoryForm = ({ category, onSave, onCancel }) => {
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        slug: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                slug: category.slug || ''
            });
        }
    }, [category]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Auto-generate slug from name if creating a new category
        if (name === 'name' && !category) {
            setFormData(prev => ({
                ...prev,
                slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (category) {
                await api.put(`blog-categories/${category.id}/`, formData);
            } else {
                await api.post('blog-categories/', formData);
            }
            onSave();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.name?.[0] || err.response?.data?.slug?.[0] || 'Failed to save category');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden w-full transition-all duration-300 font-sans">
            {/* Header */}
            <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/30">
                <div>
                    <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                        {category ? 'Update' : 'Create'} <span className="text-brand">Category</span>
                    </h3>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Category Configuration</p>
                </div>
                <button onClick={onCancel} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all active:scale-90">
                    <X size={16} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
                {error && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-[11px] font-medium flex items-center gap-2">
                        <div className="w-1 h-1 bg-rose-500 rounded-full animate-pulse"></div>
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                            Category Name <span className="text-brand font-black">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all outline-none placeholder:text-zinc-300 shadow-inner"
                            placeholder="e.g. Health & Fitness"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                            Category Slug <span className="text-zinc-300 font-black">*</span>
                        </label>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 bg-zinc-100/50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-400 focus:outline-none cursor-not-allowed shadow-inner"
                            placeholder="e.g. health-fitness"
                            readOnly
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-2 text-[10px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 transition-all active:scale-95"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-brand text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-zinc-950/10"
                    >
                        <Save size={14} />
                        {loading ? 'Processing...' : 'Save Category'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BlogCategoryForm;
