import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Edit, Trash2, Plus, Search, Grid, Zap, Activity, Target, Shield, ArrowRight, Layers, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BlogCategoryForm from './BlogCategoryForm';

const BlogCategoryManager = () => {
    const { token } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list', 'create', 'edit'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await api.get('blog-categories/');
            const data = response.data.results || response.data;
            setCategories(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error('Error saving post:', error.response?.data || error);
            alert('Failed to save post.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'list') {
            fetchCategories();
        }
    }, [view]);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this blog category?")) {
            try {
                await api.delete(`blog-categories/${id}/`);
                fetchCategories();
            } catch (error) {
                alert("Failed to delete category");
            }
        }
    };

    const handleEdit = (category) => {
        setSelectedCategory(category);
        setView('edit');
    };

    const handleCreate = () => {
        setSelectedCategory(null);
        setView('create');
    };

    const filteredCategories = Array.isArray(categories) ? categories.filter(cat =>
        cat && cat.name && cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];


    return (
        <div className="animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-row justify-between items-center gap-4 mb-8">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">Blog Categories</h2>
                    <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium hidden xs:block sm:block">Manage and organize your blog article categories.</p>
                </div>
                
                <button 
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-3 sm:px-5 py-2 bg-brand text-white rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-zinc-900/10 active:scale-95 shrink-0 whitespace-nowrap"
                >
                    <Plus size={14} /> Add Category
                </button>
            </div>
            {/* List View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - List View */}
                <div className={view === 'list' ? "lg:col-span-3" : "lg:col-span-2 transition-all duration-300"}>
                    <div className="next-panel overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                    <div className="relative w-64 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5173FB]/5 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchCategories} className="p-2 border border-zinc-200 bg-white rounded-lg text-zinc-400 hover:text-zinc-900 transition-all">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50/50 border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Category Name</th>
                                <th className="px-6 py-4 text-center hidden sm:table-cell">Slug</th>
                                <th className="px-6 py-4 text-center hidden md:table-cell">Category ID</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-10 text-center"><div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : filteredCategories.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">No blog categories detected.</td></tr>
                            ) : (
                                filteredCategories.map(cat => (
                                    <tr 
                                        key={cat.id} 
                                        onClick={() => handleEdit(cat)}
                                        className={`group hover:bg-zinc-50/50 transition-colors cursor-pointer border-l-2 ${selectedCategory?.id === cat.id && view === 'edit' ? 'border-[#5173FB] bg-zinc-50' : 'border-transparent'}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-[#3a5bd9] group-hover:text-white transition-all">
                                                    <Layers size={14} />
                                                </div>
                                                <p className="text-sm font-bold text-zinc-900 tracking-tight">{cat.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center hidden sm:table-cell">
                                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded text-[10px] font-bold uppercase tracking-widest border border-zinc-200/50">
                                                {cat.slug}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-[11px] font-bold text-zinc-400 font-mono hidden md:table-cell">
                                            #CAT-{cat.id.toString().padStart(3, '0')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-100 transition-all">
                                                <button onClick={(e) => { e.stopPropagation(); handleEdit(cat); }} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
                                                    <Edit size={14} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(cat.id); }} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>

            {/* Right Column - Inline Form */}
            {view !== 'list' && (
                <div className="lg:col-span-1 animate-in slide-in-from-right duration-300">
                    <BlogCategoryForm 
                        category={selectedCategory} 
                        onSave={() => { setView('list'); fetchCategories(); }} 
                        onCancel={() => setView('list')} 
                    />
                </div>
            )}
        </div>
    </div>
);
};

export default BlogCategoryManager;
