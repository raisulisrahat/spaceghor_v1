import React, { useState, useEffect } from 'react';
import api, { BASE_URL } from '../../services/api';
import { Edit, Trash2, Plus, Search, FileText, CheckCircle, XCircle, Zap, Activity, Target, Shield, ArrowRight, Layers, Eye, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BlogPostForm from './BlogPostForm';

const BlogPostManager = () => {
    const { token } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list', 'create', 'edit'
    const [selectedPost, setSelectedPost] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSlugs, setSelectedSlugs] = useState([]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const response = await api.get('blog-posts/');
            const data = response.data.results || response.data;
            setPosts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching blog posts:", error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'list') {
            fetchPosts();
        }
    }, [view]);

    useEffect(() => {
        setSelectedSlugs([]);
    }, [view, searchTerm, posts]);

    const handleDelete = async (slug) => {
        if (window.confirm("Are you sure you want to delete this blog post?")) {
            try {
                await api.delete(`blog-posts/${slug}/`);
                fetchPosts();
            } catch (error) {
                alert("Failed to delete post.");
            }
        }
    };

    const handleEdit = (post) => {
        setSelectedPost(post);
        setView('edit');
    };

    const handleCreate = () => {
        setSelectedPost(null);
        setView('create');
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allSlugs = filteredPosts.map(post => post.slug).filter(Boolean);
            setSelectedSlugs(allSlugs);
        } else {
            setSelectedSlugs([]);
        }
    };

    const handleSelectRow = (e, slug) => {
        e.stopPropagation();
        if (e.target.checked) {
            setSelectedSlugs(prev => [...prev, slug]);
        } else {
            setSelectedSlugs(prev => prev.filter(s => s !== slug));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedSlugs.length === 0) return;
        if (window.confirm(`Are you sure you want to delete the ${selectedSlugs.length} selected blog post(s)?`)) {
            setLoading(true);
            try {
                await Promise.all(
                    selectedSlugs.map(slug => api.delete(`blog-posts/${slug}/`))
                );
                setSelectedSlugs([]);
                fetchPosts();
            } catch (error) {
                console.error("Error bulk deleting posts:", error);
                alert("Failed to delete some posts.");
                fetchPosts();
            } finally {
                setLoading(false);
            }
        }
    };

    const filteredPosts = Array.isArray(posts) ? posts.filter(post =>
        post && post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    if (view === 'create' || view === 'edit') {
        return <BlogPostForm post={selectedPost} onSave={() => setView('list')} onCancel={() => setView('list')} />;
    }

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-row justify-between items-center gap-4 mb-8">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">Blog Posts</h2>
                    <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium hidden xs:block sm:block">Manage articles, news, and educational content.</p>
                </div>
                
                <div className="flex items-center gap-2">
                    {selectedSlugs.length > 0 && (
                        <button 
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-3 sm:px-5 py-2 bg-rose-600 text-white rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/10 active:scale-95 shrink-0 whitespace-nowrap animate-in fade-in slide-in-from-right-4 duration-200"
                        >
                            <Trash2 size={14} /> Delete Selected ({selectedSlugs.length})
                        </button>
                    )}
                    <button 
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-3 sm:px-5 py-2 bg-brand text-white rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-zinc-900/10 active:scale-95 shrink-0 whitespace-nowrap"
                    >
                        <Plus size={14} /> Create Post
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="next-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Posts</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{posts.length}</p>
                    </div>
                </div>
                <div className="next-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Zap size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Published</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{posts.filter(p => p.is_published).length}</p>
                    </div>
                </div>
                <div className="next-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Eye size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Views</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{posts.reduce((acc, p) => acc + (p.views || 0), 0)}</p>
                    </div>
                </div>
                <div className="next-panel p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Drafts</p>
                        <p className="text-xl font-bold text-zinc-900 font-mono">{posts.filter(p => !p.is_published).length}</p>
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
                            placeholder="Search articles..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5173FB]/5 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchPosts} className="p-2 border border-zinc-200 bg-white rounded-lg text-zinc-400 hover:text-zinc-900 transition-all">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-50/50 border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">
                                    <input 
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-zinc-300 text-[#5173FB] focus:ring-[#5173FB]/20 cursor-pointer accent-[#5173FB]"
                                        checked={filteredPosts.length > 0 && selectedSlugs.length === filteredPosts.length}
                                        onChange={handleSelectAll}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </th>
                                <th className="px-6 py-4">Blog Title</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4 text-center hidden sm:table-cell">Status</th>
                                <th className="px-6 py-4 text-center hidden md:table-cell">Views</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-10 text-center"><div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : filteredPosts.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-10 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">No article records found.</td></tr>
                            ) : (
                                filteredPosts.map(post => (
                                    <tr 
                                        key={post.id} 
                                        onClick={() => handleEdit(post)}
                                        className={`group hover:bg-zinc-50/50 transition-colors cursor-pointer border-l-2 ${selectedSlugs.includes(post.slug) ? 'bg-orange-50/20 border-[#5173FB]' : 'border-transparent hover:border-[#5173FB]'}`}
                                    >
                                        <td className="px-6 py-4 text-center w-12" onClick={(e) => e.stopPropagation()}>
                                            <input 
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-zinc-300 text-[#5173FB] focus:ring-[#5173FB]/20 cursor-pointer accent-[#5173FB]"
                                                checked={selectedSlugs.includes(post.slug)}
                                                onChange={(e) => handleSelectRow(e, post.slug)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-16 rounded-lg bg-white overflow-hidden border border-zinc-100 shadow-sm p-0.5">
                                                    {post.image ? (
                                                        <img
                                                            src={post.image.startsWith('http') ? post.image : `${BASE_URL}${post.image}`}
                                                            alt=""
                                                            className="h-full w-full object-cover rounded"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-zinc-50 text-zinc-200"><FileText size={16} /></div>
                                                    )}
                                                </div>
                                                <div className="max-w-[200px]">
                                                    <p className="text-sm font-bold text-zinc-900 tracking-tight truncate group-hover:text-[#5173FB] transition-colors">{post.title}</p>
                                                    <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-tighter">SLUG: {post.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded text-[10px] font-bold uppercase tracking-widest border border-zinc-200/50">
                                                {post.category_name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center hidden sm:table-cell">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${post.is_published ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-zinc-100 text-zinc-400'}`}>
                                                <div className={`w-1 h-1 rounded-full ${post.is_published ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                                                {post.is_published ? 'Live' : 'Draft'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center hidden md:table-cell">
                                            <div className="flex items-center justify-center gap-1 text-zinc-900 font-bold text-[11px] font-mono">
                                                <Eye size={12} className="text-zinc-400" />
                                                {post.views || 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-100 transition-all">
                                                <button onClick={(e) => { e.stopPropagation(); handleEdit(post); }} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
                                                    <Edit size={14} />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(post.slug); }} className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-zinc-200 rounded-lg transition-all">
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

export default BlogPostManager;
