import React, { useState, useEffect } from 'react';
import api, { getMediaUrl } from '../../utils/api';
import { Plus, Edit, Trash2, Search, Link as LinkIcon, ExternalLink, CheckCircle, XCircle, Target, Zap, Shield, Image as ImageIcon, Activity, RefreshCw, X, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const FunnelManager = () => {
    const { token } = useAuth();
    const [funnels, setFunnels] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentFunnel, setCurrentFunnel] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        product: '',
        product_two: '',
        layout_type: 'classic',
        is_active: true,
        use_custom_layout: false,
        custom_template: null,
        use_custom_reviews: false,
        top_header_line_1: '',
        top_header_line_2: '',
        top_header_line_3: '',
        top_header_line_4: '',
        features_list: ''
    });

    const [existingReviewImages, setExistingReviewImages] = useState([]);
    const [newReviewImages, setNewReviewImages] = useState([]);

    const fetchFunnels = async () => {
        setLoading(true);
        try {
            const response = await api.get('funnels/');
            setFunnels(response.data);
        } catch (error) {
            console.error("Error fetching funnels:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get('products/');
            setProducts(response.data.results || response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    useEffect(() => {
        fetchFunnels();
        fetchProducts();
    }, [token]);

    const handleInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => {
                const newData = {
                    ...prev,
                    [name]: type === 'checkbox' ? checked : value
                };
                
                // Auto-generate slug from title if not editing
                if (name === 'title' && !isEditing) {
                    newData.slug = value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');
                }
                
                return newData;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                // Do not append empty product_two to prevent foreign key validation failures
                if (key === 'product_two' && formData[key] === '') {
                    return;
                }
                // Formatting for boolean
                if (typeof formData[key] === 'boolean') {
                    data.append(key, formData[key] ? 'true' : 'false');
                } else {
                    data.append(key, formData[key]);
                }
            }
        });

        // Append new custom review images if combo layout & use_custom_reviews enabled
        if (formData.layout_type === 'combo' && formData.use_custom_reviews) {
            newReviewImages.forEach(img => {
                data.append('uploaded_review_images', img.file);
            });
            const keepIds = existingReviewImages.map(img => img.id);
            data.append('keep_review_images', JSON.stringify(keepIds));
        }

        try {
            if (isEditing) {
                await api.patch(`funnels/${currentFunnel.slug}/`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('funnels/', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            fetchFunnels();
            setShowModal(false);
            resetForm();
        } catch (error: any) {
            console.error("Operation failed:", error);
            let errMsg = error.message;
            if (error.response?.data) {
                const responseData = error.response.data;
                if (responseData.detail) {
                    errMsg = responseData.detail;
                } else if (typeof responseData === 'object') {
                    errMsg = Object.keys(responseData)
                        .map(key => `${key}: ${Array.isArray(responseData[key]) ? responseData[key].join(', ') : responseData[key]}`)
                        .join('\n');
                }
            }
            alert(`Failed to save funnel:\n${errMsg}`);
        }
    };

    const handleDelete = async (slug) => {
        if (window.confirm("Are you sure you want to delete this funnel?")) {
            try {
                await api.delete(`funnels/${slug}/`);
                setFunnels(prev => prev.filter(f => f.slug !== slug));
            } catch (error: any) {
                alert(error.response?.data?.message || "Error deleting funnel");
            }
        }
    };

    const openEditModal = (funnel) => {
        setIsEditing(true);
        setCurrentFunnel(funnel);
        setFormData({
            title: funnel.title || '',
            slug: funnel.slug,
            product: funnel.product,
            product_two: funnel.product_two || '',
            layout_type: funnel.layout_type || 'classic',
            is_active: funnel.is_active,
            use_custom_layout: funnel.use_custom_layout || false,
            custom_template: null,
            use_custom_reviews: funnel.use_custom_reviews || false,
            top_header_line_1: funnel.top_header_line_1 || '',
            top_header_line_2: funnel.top_header_line_2 || '',
            top_header_line_3: funnel.top_header_line_3 || '',
            top_header_line_4: funnel.top_header_line_4 || '',
            features_list: funnel.features_list || ''
        });
        setExistingReviewImages(funnel.review_images || []);
        setNewReviewImages([]);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            slug: '',
            product: '',
            product_two: '',
            layout_type: 'classic',
            is_active: true,
            use_custom_layout: false,
            custom_template: null,
            use_custom_reviews: false,
            top_header_line_1: '',
            top_header_line_2: '',
            top_header_line_3: '',
            top_header_line_4: '',
            features_list: ''
        });
        setExistingReviewImages([]);
        setNewReviewImages([]);
        setIsEditing(false);
        setCurrentFunnel(null);
    };

    const filteredFunnels = funnels.filter(f =>
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.slug.includes(search)
    );

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Sales Funnels</h2>
                    <p className="text-sm text-zinc-500 mt-1 font-medium">Create product landing pages.</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 px-5 py-2 bg-brand text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-zinc-900/10 active:scale-95"
                    >
                        <Plus size={14} /> Add Funnel
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="next-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Paths</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{funnels.filter(f => f.is_active).length}</p>
                    </div>
                </div>
                <div className="next-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Zap size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Funnels</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{funnels.length}</p>
                    </div>
                </div>
                <div className="next-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Shield size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total sales</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">৳{funnels.reduce((acc, funnel) => acc + (Number(funnel.successful_delivery) || 0), 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* List View */}
            <div className="next-panel overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                    <div className="relative w-64 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search conversion paths..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/5 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchFunnels} className="p-2 border border-zinc-200 bg-white rounded-lg text-zinc-400 hover:text-zinc-900 transition-all">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50/50 border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Funnel Title</th>
                                <th className="px-6 py-4">Product Name</th>
                                <th className="px-6 py-4">Url</th>
                                <th className="px-6 py-4">Timeline</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Total Sales</th>
                                <th className="px-6 py-4 text-center">Successful Delivery</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr><td colSpan={8} className="px-6 py-10 text-center"><div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : filteredFunnels.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-10 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">No funnel configurations detected.</td></tr>
                            ) : (
                                filteredFunnels.map(funnel => (
                                    <tr key={funnel.id} className="group hover:bg-zinc-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <button 
                                                    onClick={() => openEditModal(funnel)}
                                                    className="text-sm font-bold text-zinc-900 tracking-tight hover:text-brand transition-colors text-left block"
                                                >
                                                    {funnel.title}
                                                </button>
                                                <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-tighter">ID: FN-{funnel.id.toString().padStart(4, '0')}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white border border-zinc-100 overflow-hidden p-0.5 shadow-sm">
                                                    {(funnel.product_details?.thumbnail || funnel.product_details?.image) ? (
                                                        <img src={getMediaUrl(funnel.product_details.thumbnail || funnel.product_details.image)} alt="" className="h-full w-full object-contain" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-zinc-50 text-zinc-200"><ImageIcon size={12} /></div>
                                                    )}
                                                </div>
                                                <div className="max-w-[120px]">
                                                    <p className="text-[11px] font-bold text-zinc-600 truncate">{funnel.product_details?.name || 'Linked Product'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <a
                                                href={`/offer/${funnel.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-2 py-1 bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-md text-[10px] font-mono transition-all"
                                            >
                                                /{funnel.slug}
                                                <ExternalLink size={10} />
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[11px] font-bold text-zinc-900 font-mono">
                                                {funnel.created_at ? new Date(funnel.created_at).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${funnel.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}>
                                                <div className={`w-1 h-1 rounded-full ${funnel.is_active ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                                                {funnel.is_active ? 'Active' : 'Standby'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <p className="text-sm font-bold text-zinc-900 tracking-tight">৳{funnel.total_sales || 0}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <p className="text-sm font-bold text-emerald-600 tracking-tight">৳{funnel.successful_delivery_amount || 0}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-100 transition-all">
                                                <button onClick={() => openEditModal(funnel)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
                                                    <Edit size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(funnel.slug)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="bg-white rounded-2xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden border border-zinc-200 animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900 tracking-tight">{isEditing ? 'Funnel Architecture' : 'Forge Conversion Path'}</h3>
                                <p className="text-xs text-zinc-500 font-medium mt-1">Configure your product landing page settings.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-zinc-400 hover:text-zinc-900 rounded-lg transition-all"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Campaign Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand/5 outline-none transition-all"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Summer Special"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">URL Identifier (Slug)</label>
                                    <input
                                        type="text"
                                        name="slug"
                                        required
                                        disabled={isEditing}
                                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand/5 outline-none transition-all disabled:opacity-50"
                                        value={formData.slug}
                                        onChange={handleInputChange}
                                        placeholder="summer-special"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Linked Product</label>
                                    <select
                                        name="product"
                                        required
                                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand/5 outline-none transition-all"
                                        value={formData.product}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select a product...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Base Layout</label>
                                    <select
                                        name="layout_type"
                                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand/5 outline-none transition-all"
                                        value={formData.layout_type}
                                        onChange={handleInputChange}
                                    >
                                        <option value="classic">Classic Minimal</option>
                                        <option value="combo">Combo Layout</option>
                                        <option value="ezymart">EyeCare Layout</option>
                                        <option value="garden">kazir Hat Layout</option>
                                        <option value="ezymart_v2">EzyMart Layout</option>
                                    </select>
                                </div>

                                {formData.layout_type === 'combo' && (
                                    <>
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Secondary Linked Product (For Combo Bundle)</label>
                                            <select
                                                name="product_two"
                                                required
                                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand/5 outline-none transition-all"
                                                value={formData.product_two}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select second product...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Top Header Line 1 (Promo Banner)</label>
                                            <input
                                                type="text"
                                                name="top_header_line_1"
                                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand/5 outline-none transition-all"
                                                value={formData.top_header_line_1 || ''}
                                                onChange={handleInputChange}
                                                placeholder="e.g. ⏳ সীমিত সময়ের অফার ⏳"
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Top Header Line 2 (Highlight Bar)</label>
                                            <input
                                                type="text"
                                                name="top_header_line_2"
                                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand/5 outline-none transition-all"
                                                value={formData.top_header_line_2 || ''}
                                                onChange={handleInputChange}
                                                placeholder="e.g. আমাদের থেকে কেন কিনবেন ?"
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Top Header Line 3 (Why Buy Title)</label>
                                            <input
                                                type="text"
                                                name="top_header_line_3"
                                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand/5 outline-none transition-all"
                                                value={formData.top_header_line_3 || ''}
                                                onChange={handleInputChange}
                                                placeholder="e.g. কেন আমাদের পণ্যটি নিবেন?"
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Top Header Line 4 (Brand Tagline)</label>
                                            <input
                                                type="text"
                                                name="top_header_line_4"
                                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand/5 outline-none transition-all"
                                                value={formData.top_header_line_4 || ''}
                                                onChange={handleInputChange}
                                                placeholder="e.g. SIGN OF MODESTY — ELEGANT COLLECTION"
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Why Buy Reasons / features (One per line)</label>
                                            <textarea
                                                name="features_list"
                                                rows={4}
                                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand/5 outline-none transition-all custom-scrollbar"
                                                value={formData.features_list || ''}
                                                onChange={handleInputChange}
                                                placeholder="১০০% সিকিউরড পেমেন্ট ও ক্যাশ অন ডেলিভারি সুবিধা&#10;দ্রুত ও নির্ভরযোগ্য হোম ডেলিভারি"
                                            />
                                        </div>

                                        <div className="pt-4 border-t border-zinc-100 col-span-2">
                                            <label className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200 cursor-pointer group hover:border-zinc-300 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative inline-flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            name="use_custom_reviews"
                                                            checked={formData.use_custom_reviews || false}
                                                            onChange={handleInputChange}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                                                    </div>
                                                    <div>
                                                        <span className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider block">CUSTOM Customer Review screenshot</span>
                                                        <span className="text-[9px] font-medium text-zinc-400 block mt-0.5">ENABLE TO USE UPLOAD CUSTOM REVIEW SCREENSHOTS FOR THIS LAYOUT</span>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>

                                        {formData.use_custom_reviews && (
                                            <div className="col-span-2 space-y-4 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Review Screenshots Gallery</label>
                                                    <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer text-zinc-700 transition-all shadow-sm">
                                                        <Upload size={12} className="text-zinc-500" />
                                                        Upload Images
                                                        <input
                                                            type="file"
                                                            multiple
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const files = Array.from(e.target.files || []);
                                                                if (files.length > 0) {
                                                                    const newImgs = files.map(file => ({
                                                                        file,
                                                                        preview: URL.createObjectURL(file)
                                                                    }));
                                                                    setNewReviewImages(prev => [...prev, ...newImgs]);
                                                                }
                                                                e.target.value = '';
                                                            }}
                                                        />
                                                    </label>
                                                </div>

                                                {/* Previews Grid */}
                                                {(existingReviewImages.length > 0 || newReviewImages.length > 0) ? (
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {/* Existing Images */}
                                                        {existingReviewImages.map((img, idx) => (
                                                            <div key={`existing-${img.id || idx}`} className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 bg-white group">
                                                                <img
                                                                    src={getMediaUrl(img.image)}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setExistingReviewImages(prev => prev.filter((_, i) => i !== idx));
                                                                    }}
                                                                    className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors shadow"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {/* New Images */}
                                                        {newReviewImages.map((img, idx) => (
                                                            <div key={`new-${idx}`} className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 bg-white group">
                                                                <img
                                                                    src={img.preview}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setNewReviewImages(prev => prev.filter((_, i) => i !== idx));
                                                                    }}
                                                                    className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors shadow"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-6 text-[10px] font-bold text-zinc-400 uppercase tracking-wider bg-white/50 border border-dashed border-zinc-200 rounded-xl">
                                                        No screenshots uploaded yet
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="pt-4 border-t border-zinc-100">
                                <label className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200 cursor-pointer group hover:border-zinc-300 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="relative inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                name="use_custom_layout"
                                                checked={formData.use_custom_layout || false}
                                                onChange={handleInputChange}
                                                className="sr-only peer"
                                            />
                                            <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider block">Custom HTML Template</span>
                                            <span className="text-[9px] font-medium text-zinc-400 block mt-0.5">ENABLE TO USE UPLOADED HTML ASSET INSTEAD OF BASE LAYOUT</span>
                                        </div>
                                    </div>
                                </label>

                                {formData.use_custom_layout && (
                                    <div className="mt-4 p-6 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 text-center relative group hover:border-zinc-400 transition-all">
                                        <input
                                            type="file"
                                            name="custom_template"
                                            accept=".html,.htm"
                                            onChange={handleInputChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="space-y-2">
                                            <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-all">
                                                <ImageIcon size={20} className="text-zinc-400" />
                                            </div>
                                            <p className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">
                                                {formData.custom_template ? formData.custom_template.name : 'Click or Drag HTML Template'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>



                            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                                <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Funnel Status</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active || false}
                                        onChange={handleInputChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                                </label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-zinc-900/10 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <CheckCircle size={16} /> {isEditing ? 'Save Changes' : 'Forge Funnel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FunnelManager;
