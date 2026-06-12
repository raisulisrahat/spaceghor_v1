import React, { useState, useEffect, useRef } from 'react';
import api, { getMediaUrl, BASE_URL } from '../../utils/api';
import { X, Upload, Save, Image as ImageIcon, CheckCircle, Info, RefreshCw, ShoppingBag, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MediaManager from './MediaManager';

const BannerForm = ({ banner, onSave, onCancel }) => {
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        link: '',
        type: 'hero',
        button_text: 'Shop Now',
        is_active: true,
        order: 0
    });

    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const [mediaModalOpen, setMediaModalOpen] = useState(false);
    const [activeModalTab, setActiveModalTab] = useState<'upload' | 'library'>('upload');
    const [uploadingImage, setUploadingImage] = useState(false);

    // Auto-suggestion state
    const [products, setProducts] = useState<any[]>([]);
    const [blogs, setBlogs] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const handleGallerySelect = (url: string) => {
        setImage(url);
        setPreview(url);
        setMediaModalOpen(false);
    };

    const handleLocalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingImage(true);
        const file = files[0];

        const formDataObj = new FormData();
        formDataObj.append('file', file);

        try {
            const res = await api.post('media-manager/', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const fullUrl = res.data.url.startsWith('http') ? res.data.url : `${BASE_URL}${res.data.url}`;
            handleGallerySelect(fullUrl);
        } catch (error) {
            console.error("Local upload error:", error);
            alert("Failed to upload local image.");
        } finally {
            setUploadingImage(false);
        }
    };

    useEffect(() => {
        if (banner) {
            setFormData({
                title: banner.title || '',
                description: banner.description || '',
                link: banner.link || '',
                type: banner.type || 'hero',
                button_text: banner.button_text || 'Shop Now',
                is_active: banner.is_active,
                order: banner.order || 0
            });
            setPreview(getMediaUrl(banner.image));
        }
    }, [banner]);

    // Fetch products and blogs on mount for redirection url suggestions
    useEffect(() => {
        const fetchSuggestionsData = async () => {
            setLoadingSuggestions(true);
            try {
                const productsRes = await api.get('products/', { params: { limit: 100 } });
                const blogsRes = await api.get('blog-posts/');
                
                const pData = productsRes.data.results || productsRes.data || [];
                const bData = blogsRes.data.results || blogsRes.data || [];
                
                setProducts(Array.isArray(pData) ? pData : []);
                setBlogs(Array.isArray(bData) ? bData : []);
            } catch (error) {
                console.error("Error fetching suggestion data:", error);
            } finally {
                setLoadingSuggestions(false);
            }
        };
        fetchSuggestionsData();
    }, []);

    // Handle clicks outside of suggestion dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Get suggestions filtered by query
    const getFilteredSuggestions = () => {
        const query = formData.link.toLowerCase().trim();
        
        let targetType: 'all' | 'product' | 'blog' = 'all';
        let cleanQuery = query;
        
        const parsedQuery = query.startsWith('/') ? query.slice(1) : query;
        
        if (parsedQuery.startsWith('product/')) {
            targetType = 'product';
            cleanQuery = parsedQuery.replace('product/', '');
        } else if (parsedQuery.startsWith('blog/')) {
            targetType = 'blog';
            cleanQuery = parsedQuery.replace('blog/', '');
        } else if (parsedQuery.startsWith('products/')) {
            targetType = 'product';
            cleanQuery = parsedQuery.replace('products/', '');
        }
        
        const matches: any[] = [];
        
        if (targetType === 'all' || targetType === 'product') {
            const filteredProducts = products.filter(p => 
                p.name.toLowerCase().includes(cleanQuery) || 
                p.slug.toLowerCase().includes(cleanQuery)
            ).map(p => ({
                id: `product-${p.id}`,
                type: 'product',
                title: p.name,
                slug: p.slug,
                path: `product/${p.slug}`,
                image: p.image || (p.images && p.images[0]?.image)
            }));
            matches.push(...filteredProducts);
        }
        
        if (targetType === 'all' || targetType === 'blog') {
            const filteredBlogs = blogs.filter(b => 
                b.title.toLowerCase().includes(cleanQuery) || 
                b.slug.toLowerCase().includes(cleanQuery)
            ).map(b => ({
                id: `blog-${b.id}`,
                type: 'blog',
                title: b.title,
                slug: b.slug,
                path: `blog/${b.slug}`,
                image: b.image
            }));
            matches.push(...filteredBlogs);
        }
        
        return matches.slice(0, 10);
    };

    const handleSelectSuggestion = (suggestion: any) => {
        setFormData(prev => ({
            ...prev,
            link: suggestion.path
        }));
        setShowSuggestions(false);
        setSelectedIndex(-1);
    };

    const filteredSuggestions = getFilteredSuggestions();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || filteredSuggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredSuggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
        } else if (e.key === 'Enter') {
            if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
                e.preventDefault();
                handleSelectSuggestion(filteredSuggestions[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSelectedIndex(-1);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });
        if (image) {
            if (image instanceof File) {
                data.append('image', image);
            } else if (typeof image === 'string' && image) {
                data.append('image', image);
            }
        }

        try {
            const config = {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };

            if (banner) {
                await api.patch(`banners/${banner.id}/`, data, config);
            } else {
                await api.post('banners/', data, config);
            }
            onSave();
        } catch (error) {
            console.error("Save failed:", error);
            alert("Failed to save banner.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl overflow-hidden transition-all duration-300 font-sans max-w-4xl mx-auto">
            {/* Header - Geist Style */}
            <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-white">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                        {banner ? 'Edit' : 'Create'} Banner
                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Visual Node</span>
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium tracking-tight">Configure storefront promotional placement and linking logic.</p>
                </div>
                <button onClick={onCancel} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-full transition-all active:scale-90 border border-transparent hover:border-zinc-100">
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100">
                    {/* Left Column: Configuration */}
                    <div className="lg:col-span-5 p-8 space-y-8 bg-zinc-50/30">
                        <div className="space-y-6">
                            {/* Redirect URL */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-0.5">Redirect URL (Destination)</label>
                                <div className="relative group" ref={suggestionsRef}>
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono">/</div>
                                    <input
                                        type="text"
                                        name="link"
                                        className="w-full pl-7 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all outline-none placeholder:text-zinc-300 shadow-sm"
                                        value={formData.link}
                                        onChange={handleChange}
                                        onFocus={() => setShowSuggestions(true)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="products/slug-name"
                                        autoComplete="off"
                                    />
                                    
                                    {showSuggestions && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-zinc-200/80 rounded-2xl shadow-2xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200">
                                            {loadingSuggestions ? (
                                                <div className="px-4 py-6 text-center text-xs text-zinc-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                                    <RefreshCw size={14} className="animate-spin text-[#5173FB]" />
                                                    <span>Indexing redirect nodes...</span>
                                                </div>
                                            ) : filteredSuggestions.length === 0 ? (
                                                <div className="px-4 py-6 text-center text-xs text-zinc-400 font-bold uppercase tracking-widest">
                                                    No matching redirect destinations
                                                </div>
                                            ) : (
                                                <div className="max-h-64 overflow-y-auto divide-y divide-zinc-50">
                                                    <div className="px-3 py-1.5 bg-zinc-50/50 text-[9px] font-bold text-zinc-400 uppercase tracking-widest sticky top-0 backdrop-blur-md">
                                                        Auto-URL Suggestions ({filteredSuggestions.length})
                                                    </div>
                                                    {filteredSuggestions.map((item, index) => (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => handleSelectSuggestion(item)}
                                                            onMouseEnter={() => setSelectedIndex(index)}
                                                            className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-150 ${
                                                                selectedIndex === index 
                                                                    ? 'bg-brand/5 text-[#5173FB]' 
                                                                    : 'hover:bg-zinc-50 text-zinc-700'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                {item.image ? (
                                                                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 flex-shrink-0">
                                                                        <img 
                                                                            src={getMediaUrl(item.image)} 
                                                                            alt="" 
                                                                            className="w-full h-full object-cover"
                                                                            onError={(e) => {
                                                                                (e.target as HTMLElement).style.display = 'none';
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center flex-shrink-0 text-zinc-400">
                                                                        {item.type === 'product' ? <ShoppingBag size={14} /> : <BookOpen size={14} />}
                                                                    </div>
                                                                )}
                                                                
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold truncate leading-snug">{item.title}</p>
                                                                    <p className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">/{item.path}</p>
                                                                </div>
                                                            </div>
                                                            
                                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex-shrink-0 border ${
                                                                item.type === 'product' 
                                                                    ? 'bg-blue-50 text-blue-600 border-blue-100' 
                                                                    : 'bg-purple-50 text-purple-600 border-purple-100'
                                                            }`}>
                                                                {item.type}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <p className="text-[9px] text-zinc-400 font-medium px-1 mt-1.5 italic flex items-center gap-1">
                                    <CheckCircle size={10} className="text-zinc-300" /> Target path for user interaction event.
                                </p>
                            </div>

                            {/* Banner Type Selection */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-0.5">Banner Type</label>
                                <select
                                    name="type"
                                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all outline-none shadow-sm cursor-pointer"
                                    value={formData.type}
                                    onChange={handleChange}
                                >
                                    <option value="hero">Hero Banner</option>
                                    <option value="promo">Promo Banner</option>
                                    <option value="secondary">Secondary Banner</option>
                                    <option value="footer">Footer Banner</option>
                                </select>
                                <p className="text-[9px] text-zinc-400 font-medium px-1 mt-1.5 italic flex items-center gap-1">
                                    <CheckCircle size={10} className="text-zinc-300" /> Select where the banner will be displayed on the storefront.
                                </p>
                            </div>

                            {/* Banner Title */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-0.5">Banner Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all outline-none shadow-sm"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Enter banner title"
                                />
                                <p className="text-[9px] text-zinc-400 font-medium px-1 mt-1.5 italic flex items-center gap-1">
                                    <CheckCircle size={10} className="text-zinc-300" /> Descriptive title for internal reference or overlay text.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Visual Asset */}
                    <div className="lg:col-span-7 p-8 bg-white flex flex-col items-center justify-center">
                        <div className="w-full max-w-md space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-0.5">Banner Image</label>
                                <button
                                    type="button"
                                    onClick={() => setMediaModalOpen(true)}
                                    className="text-[9px] font-bold uppercase tracking-wider text-[#5173FB] hover:text-[#3a5bd9] transition-colors cursor-pointer flex items-center gap-1"
                                >
                                    <ImageIcon size={11} /> Gallery
                                </button>
                            </div>
                            
                            <div className="group relative aspect-[21/9] w-full border-2 border-dashed border-zinc-200 rounded-3xl p-2 text-center hover:bg-zinc-50 hover:border-zinc-900 transition-all bg-zinc-50/50 flex flex-col items-center justify-center overflow-hidden cursor-pointer group">
                                <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" accept="image/*" />
                                
                                {preview ? (
                                    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl transition-transform group-hover:scale-[0.98]">
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-zinc-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] z-10">
                                            <div className="px-4 py-2 bg-white rounded-xl text-[10px] font-black text-zinc-900 uppercase tracking-widest shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                <Upload size={14} /> Update Media
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 py-8 group-hover:scale-110 transition-transform">
                                        <div className="w-16 h-16 bg-white rounded-[24px] shadow-xl flex items-center justify-center text-zinc-300 group-hover:text-zinc-900 transition-all border border-zinc-50">
                                            <ImageIcon size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-bold text-zinc-900 uppercase tracking-widest">Upload Asset</p>
                                            <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-tighter italic">High quality JPG, PNG, or WEBP</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-center gap-6 pt-4">
                                <div className="text-center">
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Aspect Ratio</p>
                                    <p className="text-xs font-bold text-zinc-900">Dynamic</p>
                                </div>
                                <div className="w-px h-6 bg-zinc-100"></div>
                                <div className="text-center">
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Optimization</p>
                                    <p className="text-xs font-bold text-zinc-900">Enabled</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Sticky Style */}
                <div className="px-8 py-6 bg-zinc-50 border-t border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        <Info size={14} /> System Node Integrity Checked
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 sm:flex-none px-6 py-3 text-[10px] font-bold text-zinc-500 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                            disabled={loading}
                        >
                            DISCARD
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-zinc-900/20"
                        >
                            {loading ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save size={14} />}
                            {loading ? 'SYNCING...' : (banner ? 'UPDATE BANNER' : 'DEPLOY BANNER')}
                        </button>
                    </div>
                </div>
            </form>

            {/* Media Selector Modal */}
            {mediaModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col font-sans text-left">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                            <div>
                                <h3 className="text-base font-black text-zinc-950 tracking-tight">Choose <span className="text-[#5173FB]">Banner Image</span></h3>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Select or upload your promotion visual</p>
                            </div>
                            <button 
                                onClick={() => setMediaModalOpen(false)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex border-b border-zinc-100 bg-zinc-50/30 px-6 py-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveModalTab('upload')}
                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${activeModalTab === 'upload' 
                                    ? 'bg-brand text-white shadow-sm' 
                                    : 'text-zinc-500 hover:text-zinc-900 bg-transparent'}`}
                            >
                                <Upload size={12} />
                                <span>Upload From Computer</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveModalTab('library')}
                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${activeModalTab === 'library' 
                                    ? 'bg-brand text-white shadow-sm' 
                                    : 'text-zinc-500 hover:text-zinc-900 bg-transparent'}`}
                            >
                                <ImageIcon size={12} />
                                <span>Choose From Media Library</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-grow overflow-y-auto p-6 min-h-[400px]">
                            {activeModalTab === 'upload' ? (
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 hover:border-[#5173FB] rounded-2xl p-12 transition-all min-h-[300px] text-center bg-zinc-50/20 group">
                                    <div className="p-4 bg-zinc-100 rounded-full group-hover:bg-brand/10 transition-colors duration-300 mb-4 text-zinc-400 group-hover:text-[#5173FB]">
                                        {uploadingImage ? <RefreshCw size={36} className="animate-spin" /> : <Upload size={36} />}
                                    </div>
                                    <h4 className="text-sm font-bold text-zinc-900">
                                        {uploadingImage ? 'Uploading Asset...' : 'Upload Image File'}
                                    </h4>
                                    <p className="text-xs text-zinc-400 max-w-xs mt-1.5 leading-relaxed">
                                        Click the button below to browse your computer files and upload your image directly.
                                    </p>
                                    
                                    <input 
                                        type="file" 
                                        id="banner-local-image-input" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleLocalImageUpload}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('banner-local-image-input')?.click()}
                                        disabled={uploadingImage}
                                        className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md cursor-pointer"
                                    >
                                        Browse Files
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full">
                                    <MediaManager 
                                        selectMode={true}
                                        onSelect={(url) => handleGallerySelect(url)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BannerForm;
