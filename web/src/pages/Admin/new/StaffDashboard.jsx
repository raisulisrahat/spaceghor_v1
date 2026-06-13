import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingBag, Users, DollarSign, Package, Shield, UserCheck,
    Image, FileText, Tag, Map, Zap, Bell, CreditCard, Truck, Settings, PenTool,
    Layers, Grid, Ticket, Heart, Calendar, ChevronDown, RefreshCw, XCircle, Menu, X, 
    ShieldAlert, BarChart2, ShieldCheck, Search, LogOut, ExternalLink, LayoutGrid
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, Cell } from 'recharts';
import ProductManager from '../components/admin/ProductManager';
import BannerManager from '../components/admin/BannerManager';
import OrderManager from '../components/admin/OrderManager';
import FunnelManager from '../components/admin/FunnelManager';
import BrandManager from '../components/admin/BrandManager';
import CategoryManager from '../components/admin/CategoryManager';
import FlashSaleManager from '../components/admin/FlashSaleManager';
import UserManager from '../components/admin/UserManager';
import BlogPostManager from '../components/admin/BlogPostManager';
import BlogCategoryManager from '../components/admin/BlogCategoryManager';
import NoticeManager from '../components/admin/NoticeManager';
import ConfigManager from '../components/admin/ConfigManager';

import OrderMap from '../components/admin/OrderMap';

import { useSettings } from '../context/SettingsContext';

const StaffDashboard = ({ role }) => {
    const { user, token, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { settings: siteSettings } = useSettings();

    // Get active tab from URL path
    // Path format: /staff/:role/:tab
    const getActiveTab = () => {
        const pathParts = location.pathname.split('/');
        // pathParts[0] = ""
        // pathParts[1] = "staff"
        // pathParts[2] = role (admin/moderator)
        // pathParts[3] = tab
        return pathParts[3] || 'dashboard';
    };

    const activeTab = getActiveTab();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
             if (!token) return;
             try {
                 const res = await api.get('notifications/');
                 setNotifications(res.data);
                 setUnreadCount(res.data.filter(n => !n.is_read).length);
             } catch (err) { console.error("Error fetching notifications:", err); }
        };

        if (user?.is_staff) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000); // Polling every minute
            return () => clearInterval(interval);
        }
    }, [user, token]);

    const handleMarkAsRead = async (id) => {
        try {
            await api.post(`notifications/${id}/mark_as_read/`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) { console.error(err); }
    };

    const handleSearch = async (val) => {
        setSearchQuery(val);
        if (val.length < 2) {
             setSearchResults([]);
             setShowSearchResults(false);
             return;
        }
        setIsLoadingSearch(true);
        setShowSearchResults(true);
        try {
            const res = await api.get(`admin/global-search/?q=${val}`);
            setSearchResults(res.data);
        } catch (err) { console.error(err); }
        finally { setIsLoadingSearch(false); }
    };

    const [dateRange, setDateRange] = useState('7days');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const fetchStats = async () => {
        setLoading(true);
        try {
            let start = '', end = '';
            const today = new Date().toISOString().split('T')[0];
            
            if (dateRange === '1d') {
                start = today;
                end = today;
            } else if (dateRange === '7days') {
                const date = new Date();
                date.setDate(date.getDate() - 7);
                start = date.toISOString().split('T')[0];
            } else if (dateRange === '30days') {
                const date = new Date();
                date.setDate(date.getDate() - 30);
                start = date.toISOString().split('T')[0];
            } else if (dateRange === 'custom') {
                start = customStart;
                end = customEnd;
            }

            const response = await api.get(`admin/stats/?start_date=${start}&end_date=${end}`);
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchStats();
    }, [token, dateRange, customStart, customEnd]);

    useEffect(() => {
        if (!authLoading) {
            if (!user?.is_staff) {
                navigate('/');
                return;
            }
            if (role === 'admin' && !user.is_superuser) navigate('/staff/moderator', { replace: true });
        }
    }, [user, authLoading, navigate, role]);

    const handleNavigate = (tab) => {
        const basePath = `/staff/${role}`;
        if (tab === 'dashboard') navigate(basePath);
        else navigate(`${basePath}/${tab}`);
        setIsSidebarOpen(false); // Close sidebar on mobile after navigation
    };

    if (loading || authLoading) return (
        <div className="flex justify-center items-center h-screen bg-white">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
                <div className="text-sm text-gray-400">Loading Dashboard...</div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-[#FAFAF9] font-sans overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-500"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 z-50 md:hidden transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-white border-r border-zinc-200`}>
                <div className="flex flex-col h-full">
                    <div className="px-6 py-8 flex justify-between items-center">
                        <PremiumLogo siteTitle={siteSettings?.site_title} />
                        <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-400 hover:text-zinc-900"><X size={20} /></button>
                    </div>

                    <nav className="flex-grow px-3 space-y-1 overflow-y-auto luxury-scrollbar">
                        <SidebarContent activeTab={activeTab} handleNavigate={handleNavigate} />
                    </nav>

                    <div className="p-4 border-t border-zinc-100">
                        <UserBlock user={user} role={role} />
                    </div>
                </div>
            </aside>

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-white hidden md:flex flex-col flex-shrink-0 z-20 border-r border-zinc-200">
                <div className="px-6 py-8">
                    <PremiumLogo siteTitle={siteSettings?.site_title} />
                </div>

                <div className="flex-1 overflow-y-auto px-3 space-y-1 luxury-scrollbar">
                    <SidebarContent activeTab={activeTab} handleNavigate={handleNavigate} />
                </div>

                <div className="p-4 border-t border-zinc-100">
                    <UserBlock user={user} role={role} />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-white flex flex-col">
                <header className="h-15 py-4 sticky top-0 z-40 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-zinc-200">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-zinc-400 font-medium tracking-tight">Dashboard</span>
                            <span className="text-zinc-300">/</span>
                            <span className="text-zinc-900 font-semibold tracking-tight capitalize">{activeTab === 'dashboard' ? 'Overview' : activeTab.replace('_', ' ')}</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search system..."
                                className="pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm w-64 focus:bg-white focus:ring-2 focus:ring-brand/5 transition-all outline-none"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                            />

                            {showSearchResults && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowSearchResults(false)} />
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 overflow-hidden min-w-[320px] animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Search Results</span>
                                            {isLoadingSearch && <div className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" />}
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto luxury-scrollbar">
                                            {searchResults.length > 0 ? (
                                                searchResults.map((result, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            handleNavigate(result.tab);
                                                            setShowSearchResults(false);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                                {result.type === 'product' ? <Package size={14} /> : result.type === 'order' ? <ShoppingBag size={14} /> : <Users size={14} />}
                                                            </div>
                                                            <div>
                                                                <div className="text-[13px] font-semibold text-zinc-900 leading-tight">{result.title}</div>
                                                                <div className="text-[11px] text-zinc-400 font-medium capitalize mt-0.5">{result.type} • {result.tab}</div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : !isLoadingSearch && (
                                                <div className="px-4 py-8 text-center text-zinc-400 italic text-sm">
                                                    No results found for "{searchQuery}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="relative">
                            <button 
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`p-2 transition-all relative rounded-lg ${showNotifications ? 'bg-brand/10 text-brand' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50'}`}
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full border-2 border-white" />
                                )}
                            </button>

                            {showNotifications && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                    <div className="absolute top-full right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 overflow-hidden w-80 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Notifications</span>
                                            {unreadCount > 0 && (
                                                <button onClick={() => setUnreadCount(0)} className="text-[10px] font-bold text-zinc-900 hover:underline uppercase tracking-widest">Mark All Read</button>
                                            )}
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto luxury-scrollbar">
                                            {notifications.length > 0 ? (
                                                notifications.map((n) => (
                                                    <div 
                                                        key={n.id} 
                                                        className={`px-4 py-4 border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors cursor-pointer relative ${!n.is_read ? 'bg-zinc-50/30' : ''}`}
                                                        onClick={() => handleMarkAsRead(n.id)}
                                                    >
                                                        {!n.is_read && <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand rounded-full" />}
                                                        <div className="flex items-start gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!n.is_read ? 'bg-white shadow-sm text-zinc-900' : 'bg-zinc-100 text-zinc-400'}`}>
                                                                <Bell size={14} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-[13px] leading-snug ${!n.is_read ? 'font-bold text-zinc-900' : 'text-zinc-500'}`}>{n.message || 'System Notification'}</p>
                                                                <p className="text-[11px] text-zinc-400 font-medium mt-1">{n.created_at ? new Date(n.created_at).toLocaleTimeString() : 'Recently'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-12 text-center">
                                                    <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <Bell size={20} className="text-zinc-200" />
                                                    </div>
                                                    <p className="text-sm font-medium text-zinc-400">All caught up!</p>
                                                </div>
                                            )}
                                        </div>
                                        {notifications.length > 0 && (
                                            <div className="px-4 py-2 bg-zinc-50/50 border-t border-zinc-100 text-center">
                                                <button className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 uppercase tracking-widest transition-colors">View Activity Log</button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-4 md:p-12 max-w-[1600px] mx-auto w-full">
                    <Routes>
                        <Route path="/" element={<DashboardStats
                            stats={stats}
                            role={role}
                            user={user}
                            navigate={navigate}
                            handleNavigate={handleNavigate}
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            customStart={customStart}
                            setCustomStart={setCustomStart}
                            customEnd={customEnd}
                            setCustomEnd={setCustomEnd}
                        />} />
                        <Route path="users" element={<UserManager />} />
                        <Route path="products/*" element={<ProductManager />} />
                        <Route path="orders" element={<OrderManager />} />
                        <Route path="order_map" element={<OrderMap />} />
                        <Route path="banners" element={<BannerManager />} />
                        <Route path="flash_sales" element={<FlashSaleManager />} />
                        <Route path="funnels" element={<FunnelManager />} />
                        <Route path="blog_posts" element={<BlogPostManager />} />
                        <Route path="blog_categories" element={<BlogCategoryManager />} />
                        <Route path="brands" element={<BrandManager />} />
                        <Route path="categories" element={<CategoryManager />} />
                        <Route path="notices" element={<NoticeManager />} />
                        <Route path="settings" element={<ConfigManager />} />
                        <Route path="*" element={<Navigate to={`/staff/${role}`} replace />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

const SidebarItem = ({ icon, label, id, activeTab, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200 ${
            activeTab === id
                ? 'bg-brand/10 text-brand'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
        }`}
    >
        <span className={activeTab === id ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-900'}>{icon}</span>
        <span className="tracking-tight">{label}</span>
    </button>
);

const DashboardStats = ({
    stats, role, user, navigate, handleNavigate,
    dateRange, setDateRange,
    customStart, setCustomStart,
    customEnd, setCustomEnd
}) => (
    <div className="animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Overview</h2>
                <p className="text-sm text-zinc-500 mt-1 font-medium">Real-time performance monitoring and systems status.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-zinc-50 p-1 rounded-lg border border-zinc-200">
                {['1d', '7days', '30days', 'all', 'custom'].map((range) => (
                    <button
                        key={range}
                        onClick={() => setDateRange(range)}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${dateRange === range 
                            ? 'bg-brand text-white shadow-sm' 
                            : 'text-zinc-500 hover:text-zinc-900'}`}
                    >
                        {range === '1d' ? '24h' : range === '7days' ? '7d' : range === '30days' ? '30d' : range === 'all' ? 'Max' : <Calendar size={14} />}
                    </button>
                ))}
            </div>
        </div>

        {dateRange === 'custom' && (
            <div className="flex items-center gap-3 mb-8 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 shadow-sm">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Start</span>
                    <input 
                        type="date" 
                        className="text-xs font-semibold text-zinc-900 bg-transparent border-none focus:ring-0 outline-none w-28"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 shadow-sm">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">End</span>
                    <input 
                        type="date" 
                        className="text-xs font-semibold text-zinc-900 bg-transparent border-none focus:ring-0 outline-none w-28"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                    />
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
                title="Total Revenue" 
                value={`৳${(stats?.total_sales ?? 0).toLocaleString()}`} 
                icon={<DollarSign size={16} />} 
                trend="+12.5%" 
            />
            <StatCard 
                title="Orders" 
                value={stats?.total_orders ?? 0} 
                icon={<ShoppingBag size={16} />} 
                trend="+3.2%"
                onClick={() => navigate(`/staff/${role}/orders?view=real`)}
            />
            <StatCard 
                title="Incomplete" 
                value={stats?.total_incomplete ?? 0} 
                icon={<XCircle size={16} />} 
                trend="-1.4%"
                onClick={() => navigate(`/staff/${role}/orders?view=incomplete`)}
            />
            <StatCard 
                title="Conversion" 
                value={`${stats?.conversion_rate ?? 0}%`} 
                icon={<BarChart2 size={16} />} 
                trend="+0.8%"
            />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-8">
            <div className="lg:col-span-2 next-panel p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Revenue Analytics</h3>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-brand"></div>
                            <span className="text-[11px] font-bold text-zinc-500">Sales</span>
                        </div>
                    </div>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.graph_data || mockStatistics} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#5173FB" stopOpacity={0.05}/>
                                    <stop offset="95%" stopColor="#5173FB" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                                dataKey={stats?.graph_data ? "name" : "day"} 
                                axisLine={false} 
                                tickLine={false} 
                                fontSize={11} 
                                fontWeight="500" 
                                tick={{ fill: '#71717a' }} 
                                dy={10} 
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                fontSize={11} 
                                fontWeight="500" 
                                tick={{ fill: '#71717a' }} 
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                            />
                            <Area type="monotone" dataKey={stats?.graph_data ? "orders" : "value"} stroke="#5173FB" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="next-panel p-6">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-6">
                    {dateRange === 'all' ? 'Orders by Month' : 'Order Distribution'}
                </h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.graph_data || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                fontSize={10} 
                                fontWeight="500" 
                                tick={{ fill: '#71717a' }} 
                                dy={10} 
                            />
                            <Tooltip 
                                cursor={{ fill: '#f4f4f5' }}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                            />
                            <Bar dataKey="orders" fill="#5173FB" radius={[4, 4, 0, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        <div className="next-panel overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Recent Transactions</h3>
                <button onClick={() => navigate('orders')} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors uppercase tracking-widest">View All</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-50/50 border-b border-zinc-100">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4 text-center">Amount</th>
                            <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {(stats?.recent_orders || []).map(order => (
                            <tr 
                                key={order.id} 
                                onClick={() => handleNavigate('orders')}
                                className="hover:bg-zinc-50 transition-colors cursor-pointer group"
                            >
                                <td className="px-6 py-4 text-[13px] font-medium text-zinc-400 font-mono">
                                    #{order.id.toString().padStart(6, '0')}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-[13px] font-semibold text-zinc-900">{order.customer_name}</div>
                                    <div className="text-[11px] text-zinc-400 font-medium">Verified User</div>
                                </td>
                                <td className="px-6 py-4 text-[13px] font-bold text-zinc-900 text-center font-mono">৳{Number(order.total_amount).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <StatusBadge status={order.status} />
                                </td>
                            </tr>
                        ))}
                        {(!stats?.recent_orders || stats.recent_orders.length === 0) && (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <ShoppingBag size={24} className="text-zinc-200" />
                                        <p className="text-sm font-medium text-zinc-400">No transactions found for this period.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

const PlaceholderModule = ({ title, icon }) => (
    <div className="flex flex-col items-center justify-center h-[50vh] bg-white rounded-xl border border-gray-200 border-dashed text-center">
        <div className="p-4 rounded-full bg-gray-50 mb-4 text-gray-400">
            {React.cloneElement(icon, { size: 32 })}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 max-w-xs mb-6">
            This module is under development.
        </p>
        <a
            href="http://127.0.0.1:8000/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-brand text-white hover:bg-[#3a5bd9] rounded-lg text-sm font-medium hover:bg-gray-800 transition"
        >
            Open Django Admin
        </a>
    </div>
);

const StatCard = ({ title, value, icon, trend, onClick }) => (
    <div 
        onClick={onClick}
        className={`next-panel p-5 transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-zinc-300 hover:shadow-xl hover:-translate-y-1' : ''}`}
    >
        <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{title}</span>
            <div className="text-zinc-400">{icon}</div>
        </div>
        <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">{value}</span>
            <span className={`text-[11px] font-bold ${trend?.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                {trend}
            </span>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const styles = {
        pending: 'bg-amber-100 text-amber-700 border-amber-200',
        processing: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        shipped: 'bg-blue-100 text-blue-700 border-blue-200',
        delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.pending} shadow-sm`}>
            {status}
        </span>
    );
};

const SidebarContent = ({ activeTab, handleNavigate }) => (
    <div className="space-y-8">
        <div>
            <div className="px-3 pb-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">General</div>
            <div className="space-y-0.5">
                <SidebarItem id="dashboard" label="Dashboard" icon={<LayoutDashboard size={18} />} activeTab={activeTab} onClick={() => handleNavigate('dashboard')} />
                <SidebarItem id="users" label="Users" icon={<Users size={18} />} activeTab={activeTab} onClick={() => handleNavigate('users')} />
            </div>
        </div>

        <div>
            <div className="px-3 pb-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">E-Commerce</div>
            <div className="space-y-0.5">
                <SidebarItem id="products" label="Products" icon={<Package size={18} />} activeTab={activeTab} onClick={() => handleNavigate('products')} />
                <SidebarItem id="orders" label="Orders" icon={<ShoppingBag size={18} />} activeTab={activeTab} onClick={() => handleNavigate('orders')} />
                <SidebarItem id="order_map" label="Order Map" icon={<Map size={18} />} activeTab={activeTab} onClick={() => handleNavigate('order_map')} />
                <SidebarItem id="brands" label="Brands" icon={<Tag size={18} />} activeTab={activeTab} onClick={() => handleNavigate('brands')} />
                <SidebarItem id="categories" label="Categories" icon={<Layers size={18} />} activeTab={activeTab} onClick={() => handleNavigate('categories')} />
            </div>
        </div>

        <div>
            <div className="px-3 pb-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">Marketing</div>
            <div className="space-y-0.5">
                <SidebarItem id="funnels" label="Sales Funnels" icon={<Ticket size={18} />} activeTab={activeTab} onClick={() => handleNavigate('funnels')} />
                <SidebarItem id="flash_sales" label="Flash Sales" icon={<Zap size={18} />} activeTab={activeTab} onClick={() => handleNavigate('flash_sales')} />
                <SidebarItem id="banners" label="Banners" icon={<Image size={18} />} activeTab={activeTab} onClick={() => handleNavigate('banners')} />
            </div>
        </div>

        <div>
            <div className="px-3 pb-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-sans">System</div>
            <div className="space-y-0.5">
                <SidebarItem id="settings" label="Settings" icon={<Settings size={18} />} activeTab={activeTab} onClick={() => handleNavigate('settings')} />
            </div>
        </div>
    </div>
);

const UserBlock = ({ user, role }) => (
    <div className="flex items-center gap-3 px-2">
        <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold ring-4 ring-zinc-50">
            {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-zinc-900 truncate tracking-tight">{user?.first_name || user?.username}</p>
            <p className="text-[10px] font-medium text-zinc-400 capitalize">{role}</p>
        </div>
        <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
            <ExternalLink size={14} />
        </button>
    </div>
);

const PremiumLogo = ({ siteTitle }) => {
    return (
        <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand rounded-md flex items-center justify-center text-white">
                <LayoutDashboard size={18} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
                <span className="text-[14px] font-bold tracking-tight text-zinc-900 leading-none">
                    {siteTitle || "Spaceghor"}
                </span>
                <span className="text-[10px] font-medium text-zinc-400 mt-1 uppercase tracking-wider leading-none">Management</span>
            </div>
        </div>
    );
};


const mockMonthlySales = [
    { month: 'Jan', sales: 150 },
    { month: 'Feb', sales: 380 },
    { month: 'Mar', sales: 190 },
    { month: 'Apr', sales: 290 },
    { month: 'May', sales: 180 },
    { month: 'Jun', sales: 190 },
    { month: 'Jul', sales: 280 },
    { month: 'Aug', sales: 100 },
    { month: 'Sep', sales: 210 },
    { month: 'Oct', sales: 380 },
    { month: 'Nov', sales: 270 },
    { month: 'Dec', sales: 100 },
];

const mockStatistics = [
    { day: 'Apr 20', value: 180 },
    { day: 'Apr 21', value: 190 },
    { day: 'Apr 22', value: 170 },
    { day: 'Apr 23', value: 160 },
    { day: 'Apr 24', value: 175 },
    { day: 'Apr 25', value: 210 },
    { day: 'Apr 26', value: 230 },
];

export default StaffDashboard;
