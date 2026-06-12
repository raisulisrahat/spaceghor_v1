import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Edit, Trash2, Plus, Search, Image as ImageIcon, Upload, Zap, Shield, Activity, Target, ArrowRight, ExternalLink, RefreshCw, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BrandForm from './BrandForm';
import BulkImportModal from './BulkImportModal';

const BrandManager = () => {
    const { token } = useAuth();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list', 'create', 'edit'
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showBulkImport, setShowBulkImport] = useState(false);

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const response = await api.get('brands/');
            const data = response.data.results || response.data;
            setBrands(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching brands:", error);
            setBrands([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'list') {
            fetchBrands();
        }
    }, [view]);

    const handleDelete = async (brand) => {
        if (window.confirm(`Are you sure you want to delete brand "${brand.name}"?`)) {
            try {
                await api.delete(`brands/${brand.slug}/`);
                fetchBrands();
            } catch (error) {
                alert("Failed to delete brand");
            }
        }
    };

    const handleEdit = (brand) => {
        setSelectedBrand(brand);
        setView('edit');
    };

    const handleCreate = () => {
        setSelectedBrand(null);
        setView('create');
    };

    const filteredBrands = Array.isArray(brands) ? brands.filter(brand =>
        brand && brand.name && brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    if (view === 'create' || view === 'edit') {
        return <BrandForm brand={selectedBrand} onSave={() => setView('list')} onCancel={() => setView('list')} />;
    }

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Brands</h2>
                    <p className="text-sm text-zinc-500 mt-1 font-medium font-medium">Manage manufacturing partners and brand identities.</p>
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
                        <Plus size={14} /> Add Brand
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="next-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Shield size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Brands</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{brands.length}</p>
                    </div>
                </div>
                <div className="next-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">System Integrity</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">100%</p>
                    </div>
                </div>
                <div className="next-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Reach</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">Global</p>
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
                            placeholder="Search brand directory..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5173FB]/5 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchBrands} className="p-2 border border-zinc-200 bg-white rounded-lg text-zinc-400 hover:text-zinc-900 transition-all">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50/50 border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Brand Entity</th>
                                <th className="px-6 py-4 hidden sm:table-cell">Slug Identifier</th>
                                <th className="px-6 py-4 hidden md:table-cell">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-10 text-center"><div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : filteredBrands.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-10 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">No brand records found.</td></tr>
                            ) : (
                                filteredBrands.map(brand => (
                                    <tr key={brand.id} className="group hover:bg-zinc-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-white overflow-hidden border border-zinc-100 flex items-center justify-center p-1.5 shadow-sm">
                                                    {brand.logo ? (
                                                        <img src={brand.logo} alt={brand.name} className="h-full w-full object-contain" />
                                                    ) : (
                                                        <ImageIcon size={14} className="text-zinc-200" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-zinc-900 tracking-tight">{brand.name}</p>
                                                    <p className="text-[10px] font-medium text-zinc-400">Registered Partner</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <code className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 uppercase tracking-tight">{brand.slug}</code>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                                Active
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-100 transition-all">
                                                <button onClick={() => handleEdit(brand)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
                                                    <Edit size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(brand)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
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
                onSuccess={fetchBrands}
                apiEndpoint="brands/"
                type="Brands"
            />
        </div>
    );
};

export default BrandManager;
