import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { BASE_URL } from '../../services/api';
import { Edit, Trash2, Plus, Search, Image as ImageIcon, Upload, Layers, Shield, Activity, RefreshCw, Palette, Ruler, Briefcase, X, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CategoryForm from './CategoryForm';
import ColorForm from './ColorForm';
import SizeForm from './SizeForm';
import BrandForm from './BrandForm';
import BulkImportModal from './BulkImportModal';

const CategoryManager = () => {
    const { token } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list', 'create', 'edit'
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    
    // Sync activeTab with URL search params
    const activeTab = searchParams.get('tab') || 'parents';

    const setActiveTab = (tab) => {
        setSearchParams({ tab });
    };

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await api.get('categories/');
            const data = response.data.results || response.data;
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching categories:", error);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchColors = async () => {
        setLoading(true);
        try {
            const response = await api.get('colors/');
            const data = response.data.results || response.data;
            setColors(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching colors:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSizes = async () => {
        setLoading(true);
        try {
            const response = await api.get('sizes/');
            const data = response.data.results || response.data;
            setSizes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching sizes:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const response = await api.get('brands/');
            const data = response.data.results || response.data;
            setBrands(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching brands:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchData = () => {
        if (activeTab === 'parents' || activeTab === 'subcategories') {
            fetchCategories();
        } else if (activeTab === 'colors') {
            fetchColors();
        } else if (activeTab === 'sizes') {
            fetchSizes();
        } else if (activeTab === 'brands') {
            fetchBrands();
        }
    };

    useEffect(() => {
        if (view === 'list') {
            fetchCategories();
            if (activeTab === 'colors') fetchColors();
            if (activeTab === 'sizes') fetchSizes();
            if (activeTab === 'brands') fetchBrands();
        }
        setSelectedIds([]);
    }, [view, activeTab]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredItems().map(item => item.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (e, id) => {
        e.stopPropagation();
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(pid => pid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkDelete = async () => {
        const type = activeTab === 'colors' ? 'color' : activeTab === 'sizes' ? 'size' : activeTab === 'brands' ? 'brand' : 'category';
        try {
            // Note: Assuming bulk_delete endpoint exists as per request pattern
            const endpoint = type === 'category' ? 'categories/bulk_delete/' : `${activeTab}/bulk_delete/`;
            await api.post(endpoint, { ids: selectedIds });
            setSelectedIds([]);
            fetchData();
        } catch (error) {
            // Fallback to sequential delete if bulk_delete doesn't exist
            console.error("Bulk delete failed, attempting sequential delete", error);
            try {
                await Promise.all(selectedIds.map(id => {
                    let identifier = id;
                    if (type === 'category') {
                        identifier = categories.find(c => c.id === id)?.slug;
                    } else if (type === 'brand') {
                        identifier = brands.find(b => b.id === id)?.slug;
                    }
                    
                    const endp = (type === 'category' || type === 'brand') ? `${activeTab}/${identifier}/` : `${activeTab}/${id}/`;
                    return api.delete(endp);
                }));
                setSelectedIds([]);
                fetchData();
            } catch (err) {
                console.error("Sequential delete also failed", err);
            }
        }
    };

    const handleBulkExport = () => {
        const itemsToExport = filteredItems().filter(item => selectedIds.includes(item.id));
        if (itemsToExport.length === 0) return;
        
        const headers = Object.keys(itemsToExport[0]).join(',');
        const rows = itemsToExport.map(item => 
            Object.values(item).map(val => 
                typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
            ).join(',')
        ).join('\n');
        
        const blob = new Blob([headers + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${activeTab}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDelete = async (item) => {
        const type = activeTab === 'colors' ? 'color' : activeTab === 'sizes' ? 'size' : activeTab === 'brands' ? 'brand' : 'category';
        const identifier = (type === 'category' || type === 'brand') ? item.slug : item.id;
        const endpoint = (type === 'category' || type === 'brand') ? `${activeTab}/${identifier}/` : `${activeTab}/${identifier}/`;

        try {
            await api.delete(endpoint);
            fetchData();
        } catch (error) {
            alert(`Failed to delete ${type}`);
        }
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setView('edit');
    };

    const handleCreate = () => {
        setSelectedItem(null);
        setView('create');
    };

    const getRelatedCategories = (itemId, type) => {
        return categories.filter(cat => {
            const list = type === 'color' ? cat.colors : type === 'size' ? cat.sizes : cat.brands;
            if (!list) return false;
            return list.some(attr => {
                const attrId = typeof attr === 'object' ? attr.id : attr;
                return attrId === itemId;
            });
        });
    };

    const filteredItems = () => {
        let items = [];
        if (activeTab === 'parents' || activeTab === 'subcategories') {
            items = categories.filter(cat => {
                if (activeTab === 'parents' && cat.parent) return false;
                if (activeTab === 'subcategories' && !cat.parent) return false;
                return true;
            });
        } else if (activeTab === 'colors') {
            items = colors;
        } else if (activeTab === 'sizes') {
            items = sizes;
        } else if (activeTab === 'brands') {
            items = brands;
        }

        return items.filter(item => {
            if (!item) return false;
            const name = item.name || '';
            const search = searchTerm.toLowerCase();
            return name.toLowerCase().includes(search) || (item.slug && item.slug.toLowerCase().includes(search)) || (item.code && item.code.toLowerCase().includes(search));
        });
    };

    if (view === 'create' || view === 'edit') {
        if (activeTab === 'colors') {
            return <ColorForm color={selectedItem} categories={categories} onSave={() => setView('list')} onCancel={() => setView('list')} />;
        }
        if (activeTab === 'sizes') {
            return <SizeForm size={selectedItem} categories={categories} onSave={() => setView('list')} onCancel={() => setView('list')} />;
        }
        if (activeTab === 'brands') {
            return <BrandForm brand={selectedItem} categories={categories} onSave={() => setView('list')} onCancel={() => setView('list')} />;
        }
        return <CategoryForm category={selectedItem} onSave={() => setView('list')} onCancel={() => setView('list')} />;
    }

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Categories Manager</h2>
                    <p className="text-sm text-zinc-500 mt-1 font-medium">Manage categories, brands, colors, and size dimensions.</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowBulkImport(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-zinc-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all border border-zinc-200"
                    >
                        <Upload size={14} /> Bulk Import
                    </button>
                    <button 
                        onClick={handleCreate} 
                        className="flex items-center gap-2 px-5 py-2 bg-brand text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-zinc-900/10 active:scale-95"
                    >
                        <Plus size={14} /> Add {activeTab === 'colors' ? 'Color' : activeTab === 'sizes' ? 'Size' : activeTab === 'brands' ? 'Brand' : 'Category'}
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="next-panel p-6 flex items-center gap-4 cursor-pointer hover:bg-zinc-50 transition-colors" onClick={() => setActiveTab('parents')}>
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Layers size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Categories</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{categories.length}</p>
                    </div>
                </div>
                <div className="next-panel p-6 flex items-center gap-4 cursor-pointer hover:bg-zinc-50 transition-colors" onClick={() => setActiveTab('brands')}>
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Brands</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{brands.length}</p>
                    </div>
                </div>
                <div className="next-panel p-6 flex items-center gap-4 cursor-pointer hover:bg-zinc-50 transition-colors" onClick={() => setActiveTab('colors')}>
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Palette size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Colors</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{colors.length}</p>
                    </div>
                </div>
                <div className="next-panel p-6 flex items-center gap-4 cursor-pointer hover:bg-zinc-50 transition-colors" onClick={() => setActiveTab('sizes')}>
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Ruler size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sizes</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{sizes.length}</p>
                    </div>
                </div>
                <div className="next-panel p-6 flex items-center gap-4 cursor-pointer hover:bg-zinc-50 transition-colors" onClick={() => setActiveTab('subcategories')}>
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Subs</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{categories.filter(c => c.parent).length}</p>
                    </div>
                </div>
            </div>

            {/* List View */}
            <div className="next-panel overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-50/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full sm:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/5 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                            <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200 shadow-sm">
                                {[
                                    { id: 'parents', label: 'Root' },
                                    { id: 'subcategories', label: 'Subs' },
                                    { id: 'brands', label: 'Brands' },
                                    { id: 'colors', label: 'Colors' },
                                    { id: 'sizes', label: 'Sizes' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-brand text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <button onClick={fetchData} className="p-2 border border-zinc-200 bg-white rounded-lg text-zinc-400 hover:text-zinc-900 transition-all flex-shrink-0 mr-2">
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            </button>

                            {selectedIds.length > 0 && (
                                <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                                    <div className="h-8 w-[1px] bg-zinc-200 mx-2 hidden sm:block"></div>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-2">{selectedIds.length} Selected</span>
                                    <button 
                                        onClick={handleBulkExport}
                                        className="px-3 py-1.5 bg-brand/10 text-brand rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand/20 transition-all"
                                    >
                                        Export
                                    </button>
                                    <button 
                                        onClick={handleBulkDelete}
                                        className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-rose-100 transition-all"
                                    >
                                        Multi Delete
                                    </button>
                                    <button onClick={() => setSelectedIds([])} className="p-2 text-zinc-400 hover:text-zinc-900">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50/50 border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={filteredItems().length > 0 && selectedIds.length === filteredItems().length}
                                        className="rounded border-zinc-300 text-zinc-900 focus:ring-brand/5 w-4 h-4 transition-all"
                                    />
                                </th>
                                {activeTab === 'parents' || activeTab === 'subcategories' ? (
                                    <>
                                        <th className="px-6 py-4">Visual</th>
                                        <th className="px-6 py-4">Category Name</th>
                                        <th className="px-6 py-4 hidden sm:table-cell">Parent Reference</th>
                                        <th className="px-6 py-4 hidden md:table-cell">Slug Identifier</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-6 py-4">Visual</th>
                                        <th className="px-6 py-4">Attribute Name</th>
                                        <th className="px-6 py-4">Code / Info</th>
                                        <th className="px-6 py-4 hidden md:table-cell">Related Categories</th>
                                    </>
                                )}
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center"><div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : filteredItems().length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">No records detected.</td></tr>
                            ) : (
                                filteredItems().map(item => (
                                    <tr 
                                        key={item.id} 
                                        onClick={() => handleEdit(item)}
                                        className={`group hover:bg-zinc-100/80 transition-all cursor-pointer border-l-2 ${selectedIds.includes(item.id) ? 'border-brand bg-zinc-50' : 'border-transparent hover:border-brand'}`}
                                    >
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={(e) => handleSelectOne(e, item.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="rounded border-zinc-300 text-zinc-900 focus:ring-brand/5 w-4 h-4 transition-all"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 rounded-lg bg-white border border-zinc-100 overflow-hidden p-0.5 shadow-sm group-hover:scale-105 transition-transform">
                                                {activeTab === 'parents' || activeTab === 'subcategories' ? (
                                                    item.image ? (
                                                        <img 
                                                            src={item.image.startsWith('http') ? item.image : `${BASE_URL}${item.image}`} 
                                                            alt={item.name} 
                                                            className="h-full w-full object-cover rounded" 
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-zinc-50">
                                                            <ImageIcon size={14} className="text-zinc-200" />
                                                        </div>
                                                    )
                                                ) : activeTab === 'colors' ? (
                                                    <div className="h-full w-full rounded border border-zinc-100 shadow-inner" style={{ backgroundColor: item.hex_code }} />
                                                ) : activeTab === 'brands' ? (
                                                    item.logo ? (
                                                        <img 
                                                            src={item.logo.startsWith('http') ? item.logo : `${BASE_URL}${item.logo}`} 
                                                            alt={item.name} 
                                                            className="h-full w-full object-contain rounded" 
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-zinc-50">
                                                            <Briefcase size={14} className="text-zinc-200" />
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center bg-zinc-50 text-[10px] font-black text-zinc-400">
                                                        {item.code || item.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-zinc-900 tracking-tight group-hover:text-brand transition-colors">{item.name}</p>
                                            <p className="text-[10px] font-medium text-zinc-400">ID: #{item.id}</p>
                                        </td>
                                        
                                        {activeTab === 'parents' || activeTab === 'subcategories' ? (
                                            <>
                                                <td className="px-6 py-4 hidden sm:table-cell">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${item.parent ? 'bg-zinc-50 text-zinc-400 border-zinc-100' : 'bg-brand text-white border-brand'}`}>
                                                        {item.parent_name || 'Root Master'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    <code className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 uppercase tracking-tight">{item.slug}</code>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4">
                                                    <code className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 uppercase tracking-tight">
                                                        {activeTab === 'colors' ? item.hex_code : activeTab === 'brands' ? 'BRAND' : item.code || 'N/A'}
                                                    </code>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {(() => {
                                                            const related = getRelatedCategories(item.id, activeTab === 'colors' ? 'color' : activeTab === 'sizes' ? 'size' : 'brand');
                                                            if (related.length === 0) {
                                                                return <span className="text-[8px] font-bold text-zinc-300 italic uppercase">Unassigned</span>;
                                                            }
                                                            return (
                                                                <>
                                                                    {related.slice(0, 3).map(cat => (
                                                                        <span key={cat.id} className="text-[8px] font-bold bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-zinc-200">
                                                                            {cat.name}
                                                                        </span>
                                                                    ))}
                                                                    {related.length > 3 && (
                                                                        <span className="text-[8px] font-bold text-zinc-400">+{related.length - 3} more</span>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                        
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(item); }} 
                                                    className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(item); }} 
                                                    className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all"
                                                >
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

            <BulkImportModal
                isOpen={showBulkImport}
                onClose={() => setShowBulkImport(false)}
                onSuccess={fetchData}
                apiEndpoint={activeTab === 'colors' ? 'colors/' : activeTab === 'sizes' ? 'sizes/' : activeTab === 'brands' ? 'brands/' : 'categories/'}
                type={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            />
        </div>
    );
};

export default CategoryManager;
