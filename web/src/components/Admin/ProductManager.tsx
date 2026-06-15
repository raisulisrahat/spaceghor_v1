import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api, { getMediaUrl } from '../../utils/api';
import { Edit, Trash2, Plus, Search, Eye, MoreHorizontal, Image as ImageIcon, Download, Upload, X, Zap, Target, Activity, Shield, Package, AlertTriangle, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ProductForm from './ProductForm';

const ProductManager = ({ resetKey }) => {
    const location = useLocation();
    const { token } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [view, setView] = useState('list'); // 'list', 'create', 'edit'
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);

    // Reset view to list when navigating back to the base products URL or via sidebar click
    useEffect(() => {
        // Match /staff/admin/products or /staff/moderator/products (with or without trailing slash)
        const isProductsBase = /^\/staff\/(admin|moderator)\/products\/?$/.test(location.pathname);
        if (isProductsBase) {
            setView('list');
            setSelectedProduct(null);
        }
    }, [resetKey, location.pathname]);

    // Fetch Products
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await api.get(`products/?search=${search}&page=${page}&ordering=-updated_at`);
            const data = response.data.results || response.data;
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching products:", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'list') {
            const debounce = setTimeout(() => fetchProducts(), 500);
            return () => clearTimeout(debounce);
        }
    }, [search, page, view]);

    const handleDelete = async (slug) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await api.delete(`products/${slug}/`);
                fetchProducts();
            } catch (error) {
                alert("Failed to delete product");
            }
        }
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setView('edit');
    };

    const handleCreate = () => {
        setSelectedProduct(null);
        setView('create');
    };

    const handleSave = () => {
        setView('list');
        fetchProducts();
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(products.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(pid => pid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) return;
        try {
            await api.post('products/bulk_delete/', { ids: selectedIds });
            setSelectedIds([]);
            fetchProducts();
        } catch (error) {
            alert("Failed to delete products");
        }
    };

    const handleBulkExport = async () => {
        try {
            const idsQuery = selectedIds.join(',');
            const response = await api.get(`products/export_csv/?ids=${idsQuery}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'products.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Failed to export products");
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('products/export_csv/', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'products.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Failed to export products.");
        }
    };

    const handleImport = () => {
        document.getElementById('import-file').click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            await api.post('products/import_csv/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            fetchProducts();
        } catch (error) {
            alert('Failed to import products');
        }
        e.target.value = '';
    };

    if (view === 'create' || view === 'edit') {
        return <ProductForm product={selectedProduct} onSave={handleSave} onCancel={() => setView('list')} />;
    }

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Products</h2>
                    <p className="text-sm text-zinc-500 mt-1 font-medium">Manage your inventory, pricing, and stock status.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-lg p-1 shadow-sm">
                        <button onClick={handleExport} className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors" title="Export CSV">
                            <Download size={16} />
                        </button>
                        <div className="w-[1px] h-4 bg-zinc-200 mx-1"></div>
                        <button onClick={handleImport} className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors" title="Import CSV">
                            <Upload size={16} />
                        </button>
                    </div>
                    <button 
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-900/10"
                    >
                        <Plus size={16} /> Add Product
                    </button>
                    <input type="file" id="import-file" className="hidden" accept=".csv" onChange={handleFileChange} />
                </div>
            </div>

            {/* Inventory Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Stock', value: products.length, icon: Package },
                    { label: 'Out of Stock', value: products.filter(p => p.stock === 0).length, icon: AlertTriangle },
                    { label: 'Live Products', value: products.filter(p => p.is_active).length, icon: Zap },
                    { label: 'Top Categories', value: '12', icon: Layers }
                ].map((stat, i) => (
                    <div key={i} className="next-panel p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                            <stat.icon size={18} />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-zinc-900 leading-none font-mono">{stat.value}</div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="next-panel overflow-hidden relative">
                <div className="px-6 py-4 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50/50">
                    <div className="relative w-full sm:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Search catalog..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/5 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-2">{selectedIds.length} Selected</span>
                            <button onClick={handleBulkExport} className="px-3 py-1.5 bg-brand/10 text-brand rounded-lg text-xs font-semibold hover:bg-zinc-200 transition-all">Export</button>
                            <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-all">Delete</button>
                            <button onClick={() => setSelectedIds([])} className="p-2 text-zinc-400 hover:text-zinc-900"><X size={14} /></button>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50/50 border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={products.length > 0 && selectedIds.length === products.length}
                                        className="rounded border-zinc-300 text-zinc-900 focus:ring-brand/5 w-4 h-4 transition-all"
                                    />
                                </th>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">Pricing</th>
                                <th className="px-6 py-4 text-center hidden sm:table-cell">Stock</th>
                                <th className="px-6 py-4 hidden md:table-cell">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto"></div>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-40">
                                            <Package size={24} />
                                            <p className="text-xs font-bold uppercase tracking-widest">No products found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map(product => (
                                    <tr key={product.id} className={`group hover:bg-zinc-50 transition-colors ${selectedIds.includes(product.id) ? 'bg-zinc-50/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(product.id)}
                                                onChange={() => handleSelectOne(product.id)}
                                                className="rounded border-zinc-300 text-zinc-900 focus:ring-brand/5 w-4 h-4 transition-all"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white border border-zinc-100 p-1 flex-shrink-0 group-hover:shadow-sm transition-all">
                                                    {product.thumbnail || product.image ? (
                                                        <img src={getMediaUrl(product.thumbnail || product.image)} alt="" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <div className="w-full h-full bg-zinc-50 flex items-center justify-center text-zinc-200 rounded-lg"><ImageIcon size={16} /></div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 max-w-[300px]">
                                                    <button onClick={() => handleEdit(product)} className="text-sm font-bold text-zinc-900 hover:text-brand truncate leading-tight text-left transition-colors cursor-pointer w-full">{product.name}</button>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{product.brand_details?.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-zinc-900">৳{(product.sale_price || product.regular_price)?.toLocaleString()}</span>
                                                {product.sale_price && <span className="text-[10px] text-zinc-400 line-through">৳{product.regular_price}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center hidden sm:table-cell">
                                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${product.stock > 10 ? 'bg-zinc-50 text-zinc-600 border-zinc-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${product.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-zinc-50 text-zinc-400 border-zinc-200'}`}>
                                                <div className={`w-1 h-1 rounded-full ${product.is_active ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                                                {product.is_active ? 'Active' : 'Draft'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-100 transition-all">
                                                <button onClick={() => handleEdit(product)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
                                                    <Edit size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(product.slug)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
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

                {/* Footer / Pagination */}
                <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Total Catalog: {products.length} Products
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            disabled={page === 1}
                            className="p-2 border border-zinc-200 bg-white rounded-lg hover:bg-zinc-50 disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="flex items-center px-3 bg-white border border-zinc-200 rounded-lg text-xs font-bold font-mono">
                            {page}
                        </div>
                        <button 
                            onClick={() => setPage(prev => prev + 1)}
                            className="p-2 border border-zinc-200 bg-white rounded-lg hover:bg-zinc-50 transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductManager;
