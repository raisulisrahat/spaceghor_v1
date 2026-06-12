import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { 
    CheckCircle, XCircle, Trash2, Search, Star, MessageSquare, 
    User, Package, Calendar, ChevronLeft, ChevronRight, Eye, 
    X, MoreHorizontal, Filter, ThumbsUp, ThumbsDown, ShieldCheck,
    Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { resolveImageUrl } from '../../utils/image';

const ReviewManager = () => {
    const { token } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved'
    const [selectedReview, setSelectedReview] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            // Backend should handle filtering by is_approved if we pass it, 
            // or we filter frontend if the list isn't too large.
            // For now, let's fetch all (staff view) and filter locally for UX speed, 
            // or add query params if backend supports it.
            const response = await api.get(`reviews/?search=${search}&page=${page}`);
            const data = response.data.results || response.data;
            setReviews(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => fetchReviews(), 500);
        return () => clearTimeout(debounce);
    }, [search, page]);

    const handleApprove = async (id) => {
        try {
            await api.patch(`reviews/${id}/`, { is_approved: true });
            fetchReviews();
        } catch (error) {
            alert("Failed to approve review");
        }
    };

    const handleUnapprove = async (id) => {
        try {
            await api.patch(`reviews/${id}/`, { is_approved: false });
            fetchReviews();
        } catch (error) {
            alert("Failed to unapprove review");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this review?")) {
            try {
                await api.delete(`reviews/${id}/`);
                fetchReviews();
            } catch (error) {
                alert("Failed to delete review");
            }
        }
    };

    const handleBulkApprove = async () => {
        if (!window.confirm(`Approve ${selectedIds.length} reviews?`)) return;
        try {
            await api.post('reviews/bulk_approve/', { ids: selectedIds });
            setSelectedIds([]);
            fetchReviews();
        } catch (error) {
            alert("Failed to bulk approve");
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedIds.length} reviews?`)) return;
        try {
            await api.post('reviews/bulk_delete/', { ids: selectedIds });
            setSelectedIds([]);
            fetchReviews();
        } catch (error) {
            alert("Failed to bulk delete");
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredReviews.map(r => r.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(rid => rid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const filteredReviews = reviews.filter(review => {
        if (statusFilter === 'pending') return !review.is_approved;
        if (statusFilter === 'approved') return review.is_approved;
        return true;
    });

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Review Management</h2>
                    <p className="text-sm text-zinc-500 mt-1 font-medium">Moderate and manage customer feedback for your products.</p>
                </div>

                <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-lg border border-zinc-200 shadow-sm overflow-x-auto no-scrollbar">
                    {[
                        { id: 'all', label: 'All Reviews', icon: MessageSquare },
                        { id: 'pending', label: 'Pending', icon: ShieldCheck },
                        { id: 'approved', label: 'Approved', icon: CheckCircle }
                    ].map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setStatusFilter(filter.id)}
                            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${statusFilter === filter.id 
                                ? 'bg-brand text-white shadow-sm' 
                                : 'text-zinc-500 hover:text-zinc-900'}`}
                        >
                            <filter.icon size={14} />
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Reviews', value: reviews.length, icon: MessageSquare, color: 'text-blue-500' },
                    { label: 'Pending Approval', value: reviews.filter(r => !r.is_approved).length, icon: ShieldCheck, color: 'text-amber-500' },
                    { label: 'Avg. Rating', value: reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0', icon: Star, color: 'text-[#5173FB]' },
                    { label: 'Verified Buyers', value: reviews.filter(r => r.is_verified).length, icon: CheckCircle, color: 'text-emerald-500' }
                ].map((stat, i) => (
                    <div key={i} className="next-panel p-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center ${stat.color}`}>
                            <stat.icon size={18} />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-zinc-900 leading-none font-mono">{stat.value}</div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Table Area */}
            <div className="next-panel overflow-hidden relative">
                <div className="px-6 py-4 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50/50">
                    <div className="relative w-full sm:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Search reviews or products..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5173FB]/5 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-2">{selectedIds.length} Selected</span>
                            <button onClick={handleBulkApprove} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-all">Approve</button>
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
                                        checked={filteredReviews.length > 0 && selectedIds.length === filteredReviews.length}
                                        className="rounded border-zinc-300 text-zinc-900 focus:ring-[#5173FB]/5 w-4 h-4 transition-all"
                                    />
                                </th>
                                <th className="px-6 py-4">Reviewer</th>
                                <th className="px-6 py-4">Review Details</th>
                                <th className="px-6 py-4 text-center">Rating</th>
                                <th className="px-6 py-4">Status</th>
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
                            ) : filteredReviews.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-40">
                                            <MessageSquare size={24} />
                                            <p className="text-xs font-bold uppercase tracking-widest">No reviews found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredReviews.map(review => (
                                    <tr key={review.id} className={`group hover:bg-zinc-50 transition-colors ${selectedIds.includes(review.id) ? 'bg-zinc-50/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(review.id)}
                                                onChange={() => handleSelectOne(review.id)}
                                                className="rounded border-zinc-300 text-zinc-900 focus:ring-[#5173FB]/5 w-4 h-4 transition-all"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                                                    {review.user_initial}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-[13px] font-bold text-zinc-900 truncate">{review.user_name}</div>
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                                                        <Calendar size={10} />
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-md">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[11px] font-bold text-[#5173FB] uppercase tracking-wider">{review.product_name}</span>
                                                    {review.is_verified && (
                                                        <span className="flex items-center gap-1 text-[9px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest">
                                                            <CheckCircle size={8} className="fill-current" /> Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[13px] font-bold text-zinc-900 truncate">{review.headline || 'No Headline'}</div>
                                                <p className="text-[12px] text-zinc-500 line-clamp-1 mt-0.5">{review.comment}</p>
                                                
                                                {review.images && review.images.length > 0 && (
                                                    <div className="flex gap-1.5 mt-2">
                                                        {review.images.map((img, idx) => (
                                                            <div key={idx} className="w-8 h-8 rounded-md border border-zinc-200 overflow-hidden bg-white">
                                                                <img src={resolveImageUrl(img.image)} alt="" className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star 
                                                        key={i} 
                                                        size={12} 
                                                        className={i < review.rating ? 'fill-[#5173FB] text-[#5173FB]' : 'text-zinc-200'} 
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${review.is_approved ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${review.is_approved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                {review.is_approved ? 'Approved' : 'Pending'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button 
                                                    onClick={() => { setSelectedReview(review); setShowDetail(true); }}
                                                    className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all"
                                                    title="View Details"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                {review.is_approved ? (
                                                    <button 
                                                        onClick={() => handleUnapprove(review.id)}
                                                        className="p-2 text-zinc-400 hover:text-amber-600 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all"
                                                        title="Unapprove"
                                                    >
                                                        <ThumbsDown size={14} />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleApprove(review.id)}
                                                        className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all"
                                                        title="Approve"
                                                    >
                                                        <ThumbsUp size={14} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleDelete(review.id)}
                                                    className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all"
                                                    title="Delete"
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

                {/* Footer / Pagination */}
                <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Total Content: {filteredReviews.length} Reviews
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

            {/* Review Detail Modal */}
            {showDetail && selectedReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900">Review Details</h3>
                                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mt-0.5">#{selectedReview.id} • {selectedReview.user_name}</p>
                            </div>
                            <button onClick={() => setShowDetail(false)} className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors bg-white border border-zinc-200 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto luxury-scrollbar">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1 space-y-6">
                                    <div>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Product</span>
                                        <div className="text-[13px] font-bold text-zinc-900 bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-100 inline-block">
                                            {selectedReview.product_name}
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Headline</span>
                                        <p className="text-lg font-bold text-zinc-900 leading-tight">{selectedReview.headline || 'No Headline Provided'}</p>
                                    </div>

                                    <div>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Comment</span>
                                        <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap bg-zinc-50/50 p-4 rounded-xl border border-zinc-100 italic">
                                            "{selectedReview.comment}"
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full md:w-56 space-y-6">
                                    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-3">Overall Rating</span>
                                        <div className="text-4xl font-black text-zinc-900 mb-2 font-mono">{selectedReview.rating}.0</div>
                                        <div className="flex justify-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star 
                                                    key={i} 
                                                    size={16} 
                                                    className={i < selectedReview.rating ? 'fill-[#5173FB] text-[#5173FB]' : 'text-zinc-200'} 
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {selectedReview.is_verified && (
                                        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-[11px] font-bold uppercase tracking-widest">
                                            <ShieldCheck size={14} className="fill-current" /> Verified Purchase
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedReview.images && selectedReview.images.length > 0 && (
                                <div>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-4">Customer Photos</span>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                        {selectedReview.images.map((img, idx) => (
                                            <a 
                                                key={idx} 
                                                href={resolveImageUrl(img.image)} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="aspect-square rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 hover:border-[#5173FB] transition-all group"
                                            >
                                                <img src={resolveImageUrl(img.image)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-8 py-6 bg-zinc-50/80 border-t border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${selectedReview.is_approved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Status: {selectedReview.is_approved ? 'Approved' : 'Pending Review'}</span>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button 
                                    onClick={() => handleDelete(selectedReview.id)}
                                    className="flex-1 sm:flex-none px-6 py-2.5 text-rose-600 font-bold text-xs hover:bg-rose-50 rounded-xl transition-all"
                                >
                                    Delete Review
                                </button>
                                {selectedReview.is_approved ? (
                                    <button 
                                        onClick={() => { handleUnapprove(selectedReview.id); setShowDetail(false); }}
                                        className="flex-1 sm:flex-none px-8 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                                    >
                                        Unapprove
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => { handleApprove(selectedReview.id); setShowDetail(false); }}
                                        className="flex-1 sm:flex-none px-8 py-2.5 bg-brand text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-red-700/20"
                                    >
                                        Approve Review
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewManager;
