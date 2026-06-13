import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardSidebar from './DashboardSidebar';
import { 
    Loader2, 
    Bell, 
    Search, 
    User, 
    X, 
    Command, 
    Settings, 
    LogOut, 
    Check, 
    Info, 
    AlertCircle,
    ChevronDown,
    ShoppingBag,
    Trash2
} from 'lucide-react';
import api from '../../utils/api';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    // Fetch stats for the header
    const fetchStats = async () => {
        try {
            const res = await api.get('admin-stats/');
            setStats(res.data);
        } catch (e) {
            console.error("Failed to fetch header stats", e);
        }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Update every minute

    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        clearInterval(interval);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
        setIsNotificationsOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!isAuthenticated || !user?.user?.is_staff) {
    return <Navigate to="/login" replace />;
  }

  const pageTitle = location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard';

  const mockNotifications = [
    { id: 1, title: 'New Order Received', desc: 'Order #45291 needs fulfillment', time: '5m ago', type: 'info', icon: ShoppingBag },
    { id: 2, title: 'Low Stock Alert', desc: 'Binbond 2521 is below 10 units', time: '1h ago', type: 'warning', icon: AlertCircle },
    { id: 3, title: 'System Updated', desc: 'Terminal v2.1.0 deployed successfully', time: '2h ago', type: 'success', icon: Check },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
      <div className="flex-grow flex flex-col ml-64">
        {/* Header */}
        <header className="h-16 border-b border-gray-100 bg-white sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-sm font-semibold text-gray-900 capitalize">{pageTitle}</h1>
          </div>

          <div className="flex items-center space-x-5">
            {/* Global Search */}
            <div className="hidden md:flex items-center relative">
              <div className={`flex items-center bg-gray-50 border rounded-lg transition-all duration-300 ${isSearchFocused ? 'border-brand ring-2 ring-brand/10 w-96 shadow-sm' : 'border-gray-100 w-64'}`}>
                <Search className={`w-4 h-4 ml-3 transition-colors ${isSearchFocused ? 'text-brand' : 'text-gray-400'}`} />
                <input 
                    id="global-search"
                    type="text" 
                    placeholder="Search anything (Cmd+K)..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    className="bg-transparent pl-2 pr-4 py-1.5 text-xs focus:outline-none flex-grow"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="mr-2 text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
                {!isSearchFocused && (
                    <div className="mr-2 flex items-center space-x-1 px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-400 font-mono select-none">
                        <Command className="w-2.5 h-2.5" />
                        <span>K</span>
                    </div>
                )}
              </div>

              {/* Real-time Search Results Dropdown */}
              <AnimatePresence>
                {isSearchFocused && searchQuery.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-2xl p-2 z-[60]"
                    >
                        <p className="text-[10px] font-bold text-gray-400 uppercase px-3 py-2 tracking-widest border-b border-gray-50">Global Search</p>
                        <div className="max-h-64 overflow-y-auto p-1 mt-1">
                            <div className="px-3 py-3 hover:bg-gray-50 rounded-lg cursor-pointer flex items-center space-x-3 group transition-colors">
                                <div className="p-2 bg-brand/5 rounded-lg">
                                    <Search className="w-3.5 h-3.5 text-brand" />
                                </div>
                                <div className="flex-grow">
                                    <p className="text-xs text-gray-900 font-medium">Find products matching "<span className="font-bold text-brand">{searchQuery}</span>"</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Search in Catalog</p>
                                </div>
                            </div>
                            <div className="px-3 py-3 hover:bg-gray-50 rounded-lg cursor-pointer flex items-center space-x-3 group transition-colors">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <User className="w-3.5 h-3.5 text-blue-500" />
                                </div>
                                <div className="flex-grow">
                                    <p className="text-xs text-gray-900 font-medium">Search customers for "{searchQuery}"</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Search in Users</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Cancelled Orders (Replaced Notifications) */}
            <button 
                onClick={() => navigate('/staff/admin/orders')}
                className="flex items-center space-x-2 px-3 py-1.5 bg-brand/5 text-brand rounded-xl hover:bg-red-100 transition-all border border-red-100"
            >
                <Trash2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-tight">Cancel Order</span>
                <span className="bg-brand text-white text-[10px] font-black px-1.5 py-0.5 rounded-md min-w-[1.25rem] text-center">
                    {stats?.cancelled_orders || 0}
                </span>
            </button>

            <div className="h-8 w-px bg-gray-100" />

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
                <div 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 group cursor-pointer hover:bg-gray-50 p-1.5 rounded-xl transition-all"
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-gray-900 leading-none">{user?.user?.username}</p>
                        <p className="text-[10px] text-gray-400 mt-1 leading-none font-medium">Administrator</p>
                    </div>
                    <div className="relative">
                        <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-100 group-hover:ring-red-100 transition-all overflow-hidden">
                             {user?.user?.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </div>

                <AnimatePresence>
                    {isProfileOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl z-[60] overflow-hidden p-1.5"
                        >
                            <div className="px-3 py-3 border-b border-gray-50 mb-1">
                                <p className="text-xs font-bold text-gray-900 uppercase">{user?.user?.username}</p>
                            </div>
                            <button 
                                onClick={() => { navigate('/staff/admin/settings'); setIsProfileOpen(false); }}
                                className="w-full flex items-center space-x-3 px-3 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all text-xs font-medium"
                            >
                                <Settings className="w-4 h-4" />
                                <span>Settings</span>
                            </button>
                            <button className="w-full flex items-center space-x-3 px-3 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all text-xs font-medium">
                                <User className="w-4 h-4" />
                                <span>Public Profile</span>
                            </button>
                            <div className="h-px bg-gray-50 my-1.5" />
                            <button 
                                onClick={() => { logout(); setIsProfileOpen(false); }}
                                className="w-full flex items-center space-x-3 px-3 py-2.5 text-brand hover:bg-brand/5 rounded-lg transition-all text-xs font-bold"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Disconnect</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-8 overflow-y-auto min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
