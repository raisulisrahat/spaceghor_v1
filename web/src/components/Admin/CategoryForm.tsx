import React, { useState, useEffect } from 'react';
import api, { BASE_URL } from '../../services/api';
import { Save, X, Image as ImageIcon, Loader, Upload, AlertCircle, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CategoryForm = ({ category, onSave, onCancel }) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]); // For parent selection
    const [allBrands, setAllBrands] = useState([]); // For brand selection
    const [allColors, setAllColors] = useState([]); // For color selection
    const [allSizes, setAllSizes] = useState([]); // For size selection

    const [formData, setFormData] = useState({
        name: '',
        parent: '',
        image: null,
        brands: [], // Many-to-many brand IDs
        colors: [], // Many-to-many color IDs
        sizes: [], // Many-to-many size IDs
        tags: []
    });
    const [preview, setPreview] = useState(null);
    const [showModal, setShowModal] = useState(null); // 'brand', 'color', 'size' or null
    const [modalData, setModalData] = useState({ name: '', hex_code: '#000000', code: '', logo: null });
    const [brandSearch, setBrandSearch] = useState('');
    const [colorSearch, setColorSearch] = useState('');
    const [sizeSearch, setSizeSearch] = useState('');
    const [modalPreview, setModalPreview] = useState(null);

    useEffect(() => {
        // Fetch categories, brands, colors, sizes
        const fetchData = async () => {
            try {
                const [catsRes, brandsRes, colorsRes, sizesRes] = await Promise.all([
                    api.get('categories/'),
                    api.get('brands/'),
                    api.get('colors/'),
                    api.get('sizes/')
                ]);
                
                let availableCats = catsRes.data.results || catsRes.data;
                if (category) {
                    availableCats = availableCats.filter(c => c.id !== category.id);
                }
                setCategories(availableCats);
                setAllBrands(brandsRes.data.results || brandsRes.data);
                setAllColors(colorsRes.data.results || colorsRes.data);
                setAllSizes(sizesRes.data.results || sizesRes.data);
            } catch (error) {
                setError("Failed to load form data");
            }
        };
        fetchData();

        if (category) {
            const brandsData = category.brands || [];
            const colorsData = category.colors || [];
            const sizesData = category.sizes || [];
            
            // Normalize to IDs
            const brandIds = brandsData.map(b => typeof b === 'object' ? b.id : b);
            const colorIds = colorsData.map(c => typeof c === 'object' ? c.id : c);
            const sizeIds = sizesData.map(s => typeof s === 'object' ? s.id : s);

            setFormData({
                name: category.name,
                parent: category.parent || '',
                image: null,
                brands: brandIds,
                colors: colorIds,
                sizes: sizeIds,
                tags: category.tags || []
            });
            setPreview(category.image);
        } else {
            // Reset form for new category
            setFormData({
                name: '',
                parent: '',
                image: null,
                brands: [],
                colors: [],
                sizes: [],
                tags: []
            });
            setPreview(null);
            setError(null);
        }
    }, [category]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggle = (field, id) => {
        setFormData(prev => {
            const current = prev[field];
            if (current.includes(id)) {
                return { ...prev, [field]: current.filter(item => item !== id) };
            } else {
                return { ...prev, [field]: [...current, id] };
            }
        });
    };

    const handleQuickAdd = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let response;
            if (showModal === 'brand') {
                const data = new FormData();
                data.append('name', modalData.name);
                if (modalData.logo) data.append('logo', modalData.logo);
                response = await api.post('brands/', data);
                setAllBrands(prev => [...prev, response.data]);
                handleToggle('brands', response.data.id);
            } else if (showModal === 'color') {
                response = await api.post('colors/', { name: modalData.name, hex_code: modalData.hex_code });
                setAllColors(prev => [...prev, response.data]);
                handleToggle('colors', response.data.id);
            } else if (showModal === 'size') {
                response = await api.post('sizes/', { name: modalData.name, code: modalData.code });
                setAllSizes(prev => [...prev, response.data]);
                handleToggle('sizes', response.data.id);
            }
            setShowModal(null);
            setModalData({ name: '', hex_code: '#000000', code: '', logo: null });
            setModalPreview(null);
        } catch (err) {
            setError(`Failed to add ${showModal}`);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const data = new FormData();
        data.append('name', formData.name);
        if (formData.parent) data.append('parent', formData.parent);
        
        // Append M2M fields
        formData.brands.forEach(id => data.append('brands', id));
        formData.colors.forEach(id => data.append('colors', id));
        formData.sizes.forEach(id => data.append('sizes', id));

        if (formData.image) data.append('image', formData.image);

        try {
            if (category) {
                await api.patch(`categories/${category.slug}/`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('categories/', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            onSave();
        } catch (err: any) {
            console.error("Error saving category:", err);
            
            // Extract detailed error messages
            const errorData = err.response?.data;
            if (errorData) {
                if (typeof errorData === 'string') {
                    setError(errorData);
                } else if (errorData.message) {
                    setError(errorData.message);
                } else if (errorData.detail) {
                    setError(errorData.detail);
                } else {
                    // Collect all field errors
                    const fieldErrors = Object.entries(errorData)
                        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                        .join(' | ');
                    setError(fieldErrors || "Validation error occurred.");
                }
            } else {
                setError("Failed to save category. Please check your connection.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden transition-all duration-300 font-sans">
            {/* Header */}
            <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/30">
                <div>
                    <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                        {category ? 'Update' : 'New'} <span className="text-blue-600">Category</span>
                    </h3>
                </div>
                <button onClick={onCancel} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all active:scale-90">
                    <X size={16} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
                {error && (
                    <div className="mb-4 p-3 bg-brand/5 border border-red-200 rounded-lg flex items-center gap-2 text-brand text-[10px] font-bold">
                        <AlertCircle size={14} /> {error}
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Category Name <span className="text-blue-500 font-black">*</span></label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-zinc-300 shadow-inner"
                                placeholder="Category Name"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Parent Category (Optional)</label>
                            <select
                                name="parent"
                                value={formData.parent}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-inner"
                            >
                                <option value="">Select Parent Category (Optional)</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Associated Brands</label>
                                <button 
                                    type="button"
                                    onClick={() => setShowModal('brand')}
                                    className="p-1 bg-zinc-100 text-zinc-600 rounded-md hover:bg-brand hover:text-white transition-all active:scale-90"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 shadow-inner space-y-3">
                                <input 
                                    type="text" 
                                    placeholder="Search existing brands..." 
                                    className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-[10px] focus:ring-1 focus:ring-brand/20 focus:border-brand outline-none"
                                    onChange={(e) => setBrandSearch(e.target.value)}
                                />
                                <div className="max-h-[120px] overflow-y-auto space-y-1">
                                    {allBrands.filter(b => formData.brands.includes(b.id) || (brandSearch && b.name.toLowerCase().includes(brandSearch.toLowerCase()))).length === 0 ? (
                                        <div className="py-4 text-center">
                                            <p className="text-[10px] text-zinc-400 italic">No brands selected or found.</p>
                                            <button 
                                                type="button"
                                                onClick={() => setShowModal('brand')}
                                                className="mt-2 text-[9px] font-bold text-brand hover:underline uppercase tracking-widest"
                                            >
                                                + Create New Brand
                                            </button>
                                        </div>
                                    ) : (
                                        allBrands
                                            .filter(b => formData.brands.includes(b.id) || (brandSearch && b.name.toLowerCase().includes(brandSearch.toLowerCase())))
                                            .map(brand => (
                                                <label key={brand.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-all border border-transparent hover:border-zinc-100 group">
                                                    <input 
                                                        type="checkbox"
                                                        checked={formData.brands.includes(brand.id)}
                                                        onChange={() => handleToggle('brands', brand.id)}
                                                        className="w-4 h-4 rounded border-zinc-300 text-brand focus:ring-brand/20"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        {brand.logo && <img src={brand.logo.startsWith('http') ? brand.logo : `${BASE_URL}${brand.logo}`} className="w-5 h-5 object-contain" alt="" />}
                                                        <span className="text-xs font-semibold text-zinc-700 group-hover:text-zinc-900">{brand.name}</span>
                                                    </div>
                                                </label>
                                            ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Associated Colors</label>
                                <button 
                                    type="button"
                                    onClick={() => setShowModal('color')}
                                    className="p-1 bg-zinc-100 text-zinc-600 rounded-md hover:bg-brand hover:text-white transition-all active:scale-90"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 shadow-inner space-y-3">
                                <input 
                                    type="text" 
                                    placeholder="Search existing colors..." 
                                    className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-[10px] focus:ring-1 focus:ring-brand/20 focus:border-brand outline-none"
                                    onChange={(e) => setColorSearch(e.target.value)}
                                />
                                <div className="max-h-[120px] overflow-y-auto space-y-1">
                                    {allColors.filter(c => formData.colors.includes(c.id) || (colorSearch && c.name.toLowerCase().includes(colorSearch.toLowerCase()))).length === 0 ? (
                                        <div className="py-4 text-center">
                                            <p className="text-[10px] text-zinc-400 italic">No colors selected or found.</p>
                                            <button 
                                                type="button"
                                                onClick={() => setShowModal('color')}
                                                className="mt-2 text-[9px] font-bold text-brand hover:underline uppercase tracking-widest"
                                            >
                                                + Create New Color
                                            </button>
                                        </div>
                                    ) : (
                                        allColors
                                            .filter(c => formData.colors.includes(c.id) || (colorSearch && c.name.toLowerCase().includes(colorSearch.toLowerCase())))
                                            .map(color => (
                                                <label key={color.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-all border border-transparent hover:border-zinc-100 group">
                                                    <input 
                                                        type="checkbox"
                                                        checked={formData.colors.includes(color.id)}
                                                        onChange={() => handleToggle('colors', color.id)}
                                                        className="w-4 h-4 rounded border-zinc-300 text-brand focus:ring-brand/20"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 rounded-full border border-zinc-200 shadow-sm" style={{ backgroundColor: color.hex_code }} />
                                                        <span className="text-xs font-semibold text-zinc-700 group-hover:text-zinc-900">{color.name}</span>
                                                    </div>
                                                </label>
                                            ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Associated Sizes</label>
                                <button 
                                    type="button"
                                    onClick={() => setShowModal('size')}
                                    className="p-1 bg-zinc-100 text-zinc-600 rounded-md hover:bg-brand hover:text-white transition-all active:scale-90"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 shadow-inner space-y-3">
                                <input 
                                    type="text" 
                                    placeholder="Search existing sizes..." 
                                    className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-[10px] focus:ring-1 focus:ring-brand/20 focus:border-brand outline-none"
                                    onChange={(e) => setSizeSearch(e.target.value)}
                                />
                                <div className="max-h-[120px] overflow-y-auto space-y-1">
                                    {allSizes.filter(s => formData.sizes.includes(s.id) || (sizeSearch && (s.name.toLowerCase().includes(sizeSearch.toLowerCase()) || (s.code && s.code.toLowerCase().includes(sizeSearch.toLowerCase()))))).length === 0 ? (
                                        <div className="py-4 text-center">
                                            <p className="text-[10px] text-zinc-400 italic">No sizes selected or found.</p>
                                            <button 
                                                type="button"
                                                onClick={() => setShowModal('size')}
                                                className="mt-2 text-[9px] font-bold text-brand hover:underline uppercase tracking-widest"
                                            >
                                                + Create New Size
                                            </button>
                                        </div>
                                    ) : (
                                        allSizes
                                            .filter(s => formData.sizes.includes(s.id) || (sizeSearch && (s.name.toLowerCase().includes(sizeSearch.toLowerCase()) || (s.code && s.code.toLowerCase().includes(sizeSearch.toLowerCase())))))
                                            .map(size => (
                                                <label key={size.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-all border border-transparent hover:border-zinc-100 group">
                                                    <input 
                                                        type="checkbox"
                                                        checked={formData.sizes.includes(size.id)}
                                                        onChange={() => handleToggle('sizes', size.id)}
                                                        className="w-4 h-4 rounded border-zinc-300 text-brand focus:ring-brand/20"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded text-[9px]">{size.code || size.name.substring(0, 2).toUpperCase()}</span>
                                                        <span className="text-xs font-semibold text-zinc-700 group-hover:text-zinc-900">{size.name}</span>
                                                    </div>
                                                </label>
                                            ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1 mb-3">Category Image</label>
                            <div className="group relative border-2 border-dashed border-zinc-200 rounded-2xl p-4 text-center hover:bg-zinc-50 hover:border-blue-400 transition-all bg-zinc-50/50 flex flex-col items-center justify-center min-h-[220px]">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                {preview ? (
                                    <div className="relative h-44 w-full p-2 bg-white rounded-xl shadow-inner flex items-center justify-center">
                                        <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg" />
                                        <div className="absolute inset-0 bg-zinc-900/60 opacity-100 transition-all rounded-xl flex items-center justify-center backdrop-blur-[2px]">
                                            <div className="text-[9px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                                                <Upload size={12} />Drag or Click to Upload
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 group-hover:scale-110 transition-transform">
                                        <div className="p-3 bg-white rounded-2xl shadow-sm text-zinc-300 group-hover:text-blue-500 group-hover:rotate-12 transition-all">
                                            <ImageIcon size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Drag or Click to Upload</p>
                                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter mt-1 italic">PNG, JPG, WebP | Max 2MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-2 pt-6 border-t border-zinc-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-2 text-[10px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 transition-all active:scale-95 disabled:opacity-50"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-brand text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-zinc-950/10"
                    >
                        {loading ? <Loader size={12} className="animate-spin" /> : <Save size={14} />}
                        {loading ? 'Saving...' : 'Save Category'}
                    </button>
                </div>
            </form>

            {/* Quick Add Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                            <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-widest flex items-center gap-2">
                                <Plus size={16} className="text-brand" /> Add New <span className="text-brand capitalize">{showModal}</span>
                            </h4>
                            <button onClick={() => setShowModal(null)} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleQuickAdd} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">{showModal} Name</label>
                                <input
                                    type="text"
                                    required
                                    value={modalData.name}
                                    onChange={(e) => setModalData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-semibold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all outline-none"
                                    placeholder={`Enter ${showModal} name`}
                                    autoFocus
                                />
                            </div>

                            {showModal === 'color' && (
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Hex Code</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="color"
                                            value={modalData.hex_code}
                                            onChange={(e) => setModalData(prev => ({ ...prev, hex_code: e.target.value }))}
                                            className="h-11 w-11 rounded-xl overflow-hidden border-0 p-0 cursor-pointer shadow-sm"
                                        />
                                        <input
                                            type="text"
                                            required
                                            value={modalData.hex_code}
                                            onChange={(e) => setModalData(prev => ({ ...prev, hex_code: e.target.value }))}
                                            className="flex-grow px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-mono font-bold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all outline-none"
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                            )}

                            {showModal === 'size' && (
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Size Code (Optional)</label>
                                    <input
                                        type="text"
                                        value={modalData.code}
                                        onChange={(e) => setModalData(prev => ({ ...prev, code: e.target.value }))}
                                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-900 focus:bg-white focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all outline-none"
                                        placeholder="e.g. XL, 42"
                                    />
                                </div>
                            )}

                            {showModal === 'brand' && (
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Brand Logo (Optional)</label>
                                    <div className="relative border-2 border-dashed border-zinc-200 rounded-2xl p-4 text-center hover:bg-zinc-50 transition-all cursor-pointer overflow-hidden min-h-[120px] flex flex-col items-center justify-center">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setModalData(prev => ({ ...prev, logo: file }));
                                                    setModalPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        {modalPreview ? (
                                            <img src={modalPreview} className="max-h-20 object-contain rounded-lg" alt="Logo preview" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <Upload size={20} className="text-zinc-300" />
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Upload Logo</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(null)}
                                    className="flex-1 px-6 py-3 bg-zinc-100 text-zinc-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 bg-brand text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-brand/10 active:scale-95"
                                >
                                    {loading ? 'Creating...' : `Add ${showModal}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryForm;
