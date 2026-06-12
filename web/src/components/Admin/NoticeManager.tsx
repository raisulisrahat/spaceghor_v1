import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Edit, Trash2, Plus, Search, Bell, CheckCircle, XCircle, Zap, Target, Activity, ArrowRight, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NoticeForm from './NoticeForm';

const NoticeManager = () => {
    const { token } = useAuth();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list', 'create', 'edit'
    const [selectedNotice, setSelectedNotice] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchNotices = async () => {
        setLoading(true);
        try {
            const response = await api.get('notice/');
            const data = response.data.results || response.data;
            setNotices(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching notices:", error);
            setNotices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'list') {
            fetchNotices();
        }
    }, [view]);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this notice?")) {
            try {
                await api.delete(`notice/${id}/`);
                fetchNotices();
            } catch (error) {
                alert("Failed to delete notice");
            }
        }
    };

    const handleEdit = (notice) => {
        setSelectedNotice(notice);
        setView('edit');
    };

    const handleCreate = () => {
        setSelectedNotice(null);
        setView('create');
    };

    const toggleStatus = async (notice) => {
        try {
            await api.patch(`notice/${notice.id}/`, {
                is_active: !notice.is_active
            });
            fetchNotices();
        } catch (error) {
            alert("Failed to update notice status");
        }
    };

    const filteredNotices = Array.isArray(notices) ? notices.filter(notice =>
        notice && notice.text && notice.text.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    if (view === 'create' || view === 'edit') {
        return <NoticeForm notice={selectedNotice} onSave={() => setView('list')} onCancel={() => setView('list')} />;
    }

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Notices</h2>
                    <p className="text-sm text-zinc-500 mt-1 font-medium">Manage sitewide announcements and ticker alerts.</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-5 py-2 bg-brand text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-zinc-900/10 active:scale-95"
                    >
                        <Plus size={14} /> Create Notice
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="next-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Bell size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Notices</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{notices.filter(n => n.is_active).length}</p>
                    </div>
                </div>
                <div className="next-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Archive</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{notices.length}</p>
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
                            placeholder="Search notices..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5173FB]/5 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchNotices} className="p-2 border border-zinc-200 bg-white rounded-lg text-zinc-400 hover:text-zinc-900 transition-all">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50/50 border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Notice Context</th>
                                <th className="px-6 py-4">Mode</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Timeline</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center"><div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : filteredNotices.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">No broadcast records detected.</td></tr>
                            ) : (
                                filteredNotices.map(notice => (
                                    <tr key={notice.id} className="group hover:bg-zinc-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="max-w-xl">
                                                <p className="text-sm font-bold text-zinc-900 tracking-tight leading-relaxed">
                                                    {notice.title || notice.text}
                                                </p>
                                                {notice.title && (
                                                    <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{notice.text}</p>
                                                )}
                                                <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-tighter mt-1">SIG: #{notice.id.toString().padStart(4, '0')}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-zinc-100 rounded text-zinc-600">
                                                {notice.display_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleStatus(notice)}
                                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${notice.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-zinc-50 text-zinc-400 border-zinc-100'}`}
                                            >
                                                <div className={`w-1 h-1 rounded-full ${notice.is_active ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                                                {notice.is_active ? 'Active' : 'Standby'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[11px] font-bold text-zinc-900 font-mono">{new Date(notice.created_at).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-100 transition-all">
                                                <button onClick={() => handleEdit(notice)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
                                                    <Edit size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(notice.id)} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
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

export default NoticeManager;
