import React, { useState, useEffect } from 'react';
import api, { getMediaUrl } from '../../utils/api';
import { Edit, Trash2, Plus, Search, Image as ImageIcon, Zap, Activity, Clock, Shield, Target, ArrowRight, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BannerForm from './BannerForm';

const BannerManager = () => {
    const { token } = useAuth();
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list', 'create', 'edit'
    const [selectedBanner, setSelectedBanner] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const response = await api.get('banners/');
            const data = response.data.results || response.data;
            setBanners(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching banners:", error);
            setBanners([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'list') {
            fetchBanners();
        }
    }, [view]);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this banner?")) {
            try {
                await api.delete(`banners/${id}/`);
                fetchBanners();
            } catch (error) {
                alert("Failed to delete banner");
            }
        }
    };

    const handleEdit = (banner) => {
        setSelectedBanner(banner);
        setView('edit');
    };

    const handleCreate = () => {
        setSelectedBanner(null);
        setView('create');
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'hero': return 'bg-brand text-white border-brand';
            case 'side_top': return 'bg-brand/10 text-brand border-zinc-200';
            case 'footer': return 'bg-zinc-50 text-zinc-500 border-zinc-100';
            default: return 'bg-zinc-50 text-zinc-500 border-zinc-100';
        }
    };

    const filteredBanners = banners.filter(banner => 
        (banner.title && banner.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (banner.type && banner.type.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (view === 'create' || view === 'edit') {
        return <BannerForm banner={selectedBanner} onSave={() => setView('list')} onCancel={() => setView('list')} />;
    }

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Banners</h2>
                    <p className="text-sm text-zinc-500 mt-1 font-medium">Manage promotional assets and storefront layout.</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-5 py-2 bg-brand text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-zinc-900/10 active:scale-95"
                    >
                        <Plus size={14} /> Add Banner
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
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Hero Banners</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{banners.filter(b => b.type === 'hero').length}</p>
                    </div>
                </div>
                <div className="next-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Assets</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{banners.filter(b => b.is_active).length}</p>
                    </div>
                </div>
                <div className="next-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Zap size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Inventory</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{banners.length}</p>
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
                            placeholder="Search media assets..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/5 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchBanners} className="p-2 border border-zinc-200 bg-white rounded-lg text-zinc-400 hover:text-zinc-900 transition-all">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50/50 border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Visual Asset</th>
                                <th className="px-6 py-4">Metadata</th>
                                <th className="px-6 py-4 hidden sm:table-cell">Direct Link</th>
                                <th className="px-6 py-4 hidden md:table-cell">Rank</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center"><div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : filteredBanners.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">No media assets detected.</td></tr>
                            ) : (
                                filteredBanners.map(banner => (
                                    <tr key={banner.id} className="group hover:bg-zinc-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="w-24 h-12 rounded-lg bg-white overflow-hidden border border-zinc-100 shadow-sm p-0.5 group-hover:scale-[1.02] transition-all">
                                                {banner.image ? (
                                                    <img src={getMediaUrl(banner.image)} alt="" className="h-full w-full object-cover rounded" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center bg-zinc-50 text-zinc-200"><ImageIcon size={14} /></div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-[200px]">
                                                <p className="text-sm font-bold text-zinc-900 tracking-tight truncate">{banner.title || 'Untitled Asset'}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getTypeColor(banner.type)}`}>
                                                        {banner.type}
                                                    </span>
                                                    {!banner.is_active && (
                                                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest px-2 py-0.5 bg-rose-50 rounded-full border border-rose-100">Inactive</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 max-w-[150px] truncate group-hover:text-zinc-900 transition-colors">
                                                <ExternalLink size={12} />
                                                {banner.link || '---'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="text-xs font-bold text-zinc-900 font-mono">#{banner.order}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-100 transition-all">
                                                <button onClick={() => handleEdit(banner)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
                                                    <Edit size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(banner.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
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
    );
};

export default BannerManager;
