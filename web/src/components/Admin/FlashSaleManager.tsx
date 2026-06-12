import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Search, Edit2, Trash2, X, Check, Calendar, Zap, Clock, Shield, Target, Activity, ArrowRight, XCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const FlashSaleManager = () => {
    const { token } = useAuth();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingSale, setEditingSale] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        start_time: '',
        end_time: '',
        discount_percentage: '',
        is_active: true
    });

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const response = await api.get('flash-sales/');
            setSales(response.data.results || response.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch flash sales", error);
            setLoading(false);
        }
    };

    const handleEdit = (sale) => {
        setEditingSale(sale);
        setFormData({
            title: sale.title,
            start_time: sale.start_time ? sale.start_time.slice(0, 16) : '', // Format for datetime-local
            end_time: sale.end_time ? sale.end_time.slice(0, 16) : '',
            discount_percentage: sale.discount_percentage || '',
            is_active: sale.is_active
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this flash sale?")) return;
        try {
            await api.delete(`flash-sales/${id}/`);
            setSales(sales.filter(s => s.id !== id));
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSale) {
                const response = await api.patch(`flash-sales/${editingSale.id}/`, formData);
                setSales(sales.map(s => s.id === editingSale.id ? response.data : s));
            } else {
                const response = await api.post('flash-sales/', formData);
                setSales([response.data, ...sales]);
            }
            setShowModal(false);
            setEditingSale(null);
            setFormData({ title: '', start_time: '', end_time: '', discount_percentage: '', is_active: true });
        } catch (error) {
            console.error("Failed to save", error);
            alert("Failed to save flash sale");
        }
    };

    const filteredSales = sales.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Flash Sales</h2>
                    <p className="text-sm text-zinc-500 mt-1 font-medium">Manage limited time promotional campaigns.</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => {
                            setEditingSale(null);
                            setFormData({ title: '', start_time: '', end_time: '', discount_percentage: '', is_active: true });
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2 bg-brand text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-zinc-900/10 active:scale-95"
                    >
                        <Plus size={14} /> Add Campaign
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="next-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Zap size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Now</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">
                            {sales.filter(s => {
                                const now = new Date();
                                return s.is_active && now >= new Date(s.start_time) && now <= new Date(s.end_time);
                            }).length}
                        </p>
                    </div>
                </div>
                <div className="next-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Upcoming</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">
                            {sales.filter(s => {
                                const now = new Date();
                                return s.is_active && now < new Date(s.start_time);
                            }).length}
                        </p>
                    </div>
                </div>
                <div className="next-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Campaigns</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{sales.length}</p>
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
                            placeholder="Search campaigns..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5173FB]/5 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchSales} className="p-2 border border-zinc-200 bg-white rounded-lg text-zinc-400 hover:text-zinc-900 transition-all">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50/50 border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Campaign Details</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center hidden sm:table-cell">Duration</th>
                                <th className="px-6 py-4 hidden md:table-cell">Timeline</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center"><div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : filteredSales.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">No flash sale records detected.</td></tr>
                            ) : (
                                filteredSales.map(sale => {
                                    const now = new Date();
                                    const start = new Date(sale.start_time);
                                    const end = new Date(sale.end_time);
                                    const isActive = sale.is_active && now >= start && now <= end;
                                    const isUpcoming = sale.is_active && now < start;
                                    const isExpired = now > end;

                                    return (
                                        <tr key={sale.id} className="group hover:bg-zinc-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-brand text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                                                        {isActive ? <Zap size={16} /> : <Clock size={16} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-zinc-900 tracking-tight">{sale.title}</p>
                                                        <p className="text-[10px] font-medium text-zinc-400">FS-ID: #{sale.id.toString().padStart(4, '0')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isActive && (
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                                                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                                        Active Now
                                                    </div>
                                                )}
                                                {isUpcoming && (
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200 text-[10px] font-bold uppercase tracking-wider">
                                                        <div className="w-1 h-1 rounded-full bg-zinc-400" />
                                                        Scheduled
                                                    </div>
                                                )}
                                                {isExpired && (
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-50 text-zinc-400 border border-zinc-100 text-[10px] font-bold uppercase tracking-wider">
                                                        Expired
                                                    </div>
                                                )}
                                                {!sale.is_active && !isExpired && (
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold uppercase tracking-wider">
                                                        Paused
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center hidden sm:table-cell">
                                                <span className="text-xs font-bold text-zinc-900 font-mono">{Math.ceil(((end as any) - (start as any)) / (1000 * 60 * 60))}h</span>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-zinc-900">{start.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                                    <span className="text-[9px] font-bold text-zinc-400 uppercase">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-100 transition-all">
                                                    <button onClick={() => handleEdit(sale)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(sale.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal - Standard Add/Edit Flash Sale */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="bg-white rounded-2xl w-full max-w-md relative z-10 shadow-2xl p-8 border border-zinc-200 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900 tracking-tight">{editingSale ? 'Update Campaign' : 'Launch Campaign'}</h3>
                                <p className="text-xs text-zinc-500 font-medium mt-1">Configure your limited time event.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-zinc-400 hover:text-zinc-900 rounded-lg transition-all"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Campaign Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Midnight Madness"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all"
                                        value={formData.start_time}
                                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">End Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all"
                                        value={formData.end_time}
                                        onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Discount % (System Wide)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all"
                                    value={formData.discount_percentage}
                                    onChange={e => setFormData({ ...formData, discount_percentage: e.target.value })}
                                    placeholder="25.00"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                                <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">Active Status</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                                </label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-zinc-900/10 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <Check size={16} /> {editingSale ? 'Update' : 'Launch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlashSaleManager;
