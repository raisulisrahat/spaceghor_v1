import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, 
  Menu, 
  X, 
  User, 
  Heart, 
  LogIn, 
  ChevronDown, 
  LogOut, 
  LayoutDashboard,
  LayoutGrid,
  Settings,
  Shield,
  ShoppingBag,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Zap,
  Search,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import Searchbar from './Searchbar';
import { BASE_URL, getCategories } from '../services/api';
import { formatPhoneNumber, isValidPhoneNumber } from '../utils/phone';
import { useSettings } from '../context/SettingsContext';

const Navbar = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { siteLogo, siteTitle } = useSettings();
  const { cartCount, setIsCartOpen } = useCart();
  const { isAuthenticated, user, login, logout } = useAuth();
  const { wishlist } = useWishlist();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showGuestMenu, setShowGuestMenu] = useState(false);
  const [loginStep, setLoginStep] = useState<'phone' | 'password'>('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isMiniLoading, setIsMiniLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsCategoriesLoading(true);
      try {
        const catsRes = await getCategories();
        setCategories(catsRes.data.results || catsRes.data);
      } catch (error) {
        console.error('Error fetching navigation data:', error);
      } finally {
        setIsCategoriesLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleCategory = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCategoryIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Organize categories
  const parentCategories = categories.filter(c => !c.parent);
  const subCategoriesMap = categories.reduce((acc, cat) => {
    if (cat.parent) {
      if (!acc[cat.parent]) acc[cat.parent] = [];
      acc[cat.parent].push(cat);
    }
    return acc;
  }, {} as Record<number, any[]>);

  // Reset mini-login state on menu close
  useEffect(() => {
    if (!showGuestMenu) {
      setTimeout(() => {
        setLoginStep('phone');
        setPhone('');
        setPassword('');
        setLoginError('');
      }, 300); // Wait for exit animation
    }
  }, [showGuestMenu]);
  
  // Close drawers on location change
  useEffect(() => {
    setIsOpen(false);
    setIsMobileSearchOpen(false);
    setShowProfileMenu(false);
    setShowGuestMenu(false);
  }, [location.pathname, location.search]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
        setShowGuestMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate('/login');
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    if (!isValidPhoneNumber(phone)) {
      setLoginError('Please enter a valid 11-digit mobile number starting with 01.');
      return;
    }
    setLoginStep('password');
    setLoginError('');
  };

  const handleMiniLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMiniLoading(true);
    setLoginError('');
    try {
      await login({ username: phone, password });
      setShowGuestMenu(false);
    } catch (err: any) {
      setLoginError(err.response?.data?.non_field_errors?.[0] || 'Invalid credentials. Please try again.');
    } finally {
      setIsMiniLoading(false);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-18">
          {/* Desktop Only: Logo */}
          <div className="hidden md:flex flex-shrink-0 items-center">
            <Link to="/" className="flex items-center">
              {siteLogo ? (
                <img src={siteLogo} alt={siteTitle} className="h-8 w-auto" />
              ) : (
                <span className="text-xl font-black tracking-tighter text-neutral-900">{siteTitle}</span>
              )}
            </Link>
          </div>

          {/* Mobile Only: Left Menu Icon */}
          <div className="flex md:hidden items-center justify-start w-1/3">
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 text-neutral-600 active:scale-95 hover:bg-neutral-50 rounded-lg transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Only: Center Logo */}
          <div className="flex md:hidden flex-shrink-0 items-center justify-center w-1/3">
            <Link to="/" className="flex items-center">
              {siteLogo ? (
                <img src={siteLogo} alt={siteTitle} className="h-7 w-auto" />
              ) : (
                <span className="text-lg font-black tracking-tighter text-neutral-900">{siteTitle}</span>
              )}
            </Link>
          </div>

          {/* Mobile Only: Right Icons (Search & Cart) */}
          <div className="flex md:hidden items-center justify-end space-x-1 w-1/3">
            <button 
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="p-2 text-neutral-600 active:scale-95 transition-transform"
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-neutral-600 relative active:scale-95 transition-transform"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand text-white text-[9px] font-bold flex items-center justify-center rounded-full shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop Only: Search Bar */}
          <div className="hidden md:flex items-center flex-grow max-w-xl mx-8">
            <Searchbar />
          </div>

          <div className="hidden md:flex items-center space-x-2 lg:space-x-5">
    

            {/* Wishlist */}
            <Link to="/wishlist" className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors relative group">
              <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm">
                  {wishlist.length}
                </span>
              )}
            </Link>
            
            {/* Cart */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors relative group"
            >
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Separator */}
            <div className="w-[1px] h-6 bg-neutral-200 mx-1"></div>

            {/* Profile Section */}
            <div 
              className="relative" 
              ref={menuRef}
              onMouseEnter={() => !isAuthenticated && setShowGuestMenu(true)}
              onMouseLeave={() => setShowGuestMenu(false)}
            >
              {isAuthenticated ? (
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-1 pl-2 hover:bg-neutral-100 rounded-full transition-all group"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-transparent group-hover:border-brand transition-all flex items-center justify-center bg-neutral-100 shadow-sm">
                    {user?.profile?.profile_picture ? (
                      <img 
                        src={user.profile.profile_picture.startsWith('http') ? user.profile.profile_picture : `${BASE_URL}${user.profile.profile_picture}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-neutral-500" />
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <Link 
                  to="/login"
                  className="flex items-center space-x-2 px-6 py-3 bg-brand text-white rounded-xl hover:bg-brand-hover transition-all shadow-lg shadow-brand/10 font-bold text-sm active:scale-95"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Login</span>
                </Link>
              )}

              {/* Profile Dropdown */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden py-2"
                  >
                    <div className="px-4 py-3 border-b border-neutral-50 mb-1">
                      <p className="text-sm font-bold text-neutral-900 truncate">
                        {user?.user?.first_name} {user?.user?.last_name}
                      </p>
                    </div>

                    <div className="px-2 space-y-0.5">
                      {(user?.user?.is_staff || ['admin', 'moderator', 'ads_manager'].includes(user?.profile?.role || user?.user?.role)) && (
                        <Link 
                          to={
                            (user?.profile?.role === 'ads_manager' || user?.user?.role === 'ads_manager')
                              ? '/staff/ads_manager/'
                              : (user?.profile?.role === 'moderator' || user?.user?.role === 'moderator')
                              ? '/staff/moderator/'
                              : '/staff/admin/'
                          } 
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center space-x-3 px-3 py-2.5 text-sm font-bold text-brand hover:bg-brand/5 rounded-xl transition-colors mb-1"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Staff Dashboard</span>
                        </Link>
                      )}

                      <Link 
                        to="/account" 
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 rounded-xl transition-colors"
                      >
                        <LayoutGrid className="w-4 h-4" />
                        <span>Overview</span>
                      </Link>

                      <Link 
                        to="/account/orders" 
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 rounded-xl transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>My Orders</span>
                      </Link>
                      <Link 
                        to="/account/profile" 
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 rounded-xl transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile Settings</span>
                      </Link>
                    </div>

                    <div className="mt-2 pt-2 border-t border-neutral-50 px-2">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-bold text-brand hover:bg-brand/5 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Guest Dropdown */}
              <AnimatePresence>
                {showGuestMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden p-6 z-50"
                  >
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {loginStep === 'password' && (
                            <button 
                              onClick={() => setLoginStep('phone')}
                              className="p-1 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400 hover:text-neutral-900"
                            >
                              <ArrowLeft className="w-4 h-4" />
                            </button>
                          )}
                          <h3 className="text-xl font-bold text-neutral-900">{loginStep === 'phone' ? 'Sign in' : 'Enter Password'}</h3>
                        </div>
                        <Link 
                          to="/signup" 
                          onClick={() => setShowGuestMenu(false)}
                          className="text-sm font-bold text-brand hover:underline"
                        >
                          Create an Account
                        </Link>
                      </div>

                      <div className="h-px bg-neutral-100" />

                      {loginError && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-3 bg-brand/5 border border-red-100 rounded-xl flex items-start text-brand text-xs"
                        >
                          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                          <p>{loginError}</p>
                        </motion.div>
                      )}

                      <form onSubmit={loginStep === 'phone' ? handleContinue : handleMiniLogin} className="space-y-4">
                        {loginStep === 'phone' ? (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700">
                              Mobile Number <span className="text-red-700">*</span>
                            </label>
                            <input 
                              required
                              type="text" 
                              value={phone}
                              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                              placeholder="e.g. 01700000000"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700">
                              Password <span className="text-red-700">*</span>
                            </label>
                            <input 
                              required
                              type="password" 
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              autoFocus
                              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                              placeholder="••••••••"
                            />
                          </div>
                        )}

                        {loginStep === 'phone' && (
                          <Link 
                            to="/forgot-password" 
                            className="block text-sm text-neutral-500 hover:text-brand transition-colors"
                          >
                            Lost your password?
                          </Link>
                        )}

                        <label className="flex items-center space-x-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-neutral-300 text-brand focus:ring-brand"
                          />
                          <span className="text-sm font-medium text-neutral-600 group-hover:text-neutral-900 transition-colors">Remember me</span>
                        </label>

                        <button 
                          type="submit"
                          disabled={isMiniLoading}
                          className="w-full flex items-center justify-center space-x-2 bg-brand text-white py-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-700/10 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isMiniLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <span>{loginStep === 'phone' ? 'Continue' : 'Sign In'}</span>
                          )}
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Desktop Only Right Section matches previous implementation but cleaned up */}
          <div className="md:hidden invisible overflow-hidden h-0 w-0">
            {/* Hidden items removed or moved to icons */}
          </div>
        </div>
      </div>

      {/* Mobile Search Dropdown */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <>
            {/* Search Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSearchOpen(false)}
              className="md:hidden fixed inset-0 bg-black/20 z-20"
            />
            
            {/* Search Content */}
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl z-30 border-b border-neutral-100"
            >
              <div className="p-3 flex items-center gap-2">
                <div className="flex-grow">
                  <Searchbar />
                </div>
                <button 
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-900 active:scale-95 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </nav>

    {/* Sidebar Menu Drawer */}
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-[65] md:hidden"
          />
          
          {/* Sidebar Overlay Content */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 left-0 bottom-0 w-[300px] bg-white z-[70] shadow-2xl md:hidden flex flex-col h-screen overflow-hidden"
          >
            {/* Sidebar Header: Minimal with Close Button */}
            <div className="h-16 flex-shrink-0 flex items-center px-5 bg-white border-b border-neutral-100">
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 -ml-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all active:scale-95 flex items-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900">Close Menu</span>
              </button>
            </div>

            {/* Sidebar Scrollable Area: Just Categories */}
            <div className="flex-grow overflow-y-auto bg-white scrollbar-hide flex flex-col">
              <div className="flex flex-col flex-grow">
                {isCategoriesLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-6 h-6 text-brand animate-spin" />
                    <p className="text-[10px] font-bold text-neutral-400">Loading collections...</p>
                  </div>
                ) : parentCategories.length > 0 ? (
                  <div className="divide-y divide-neutral-50">

                    {parentCategories.map((category) => {
                      const hasChildren = subCategoriesMap[category.id]?.length > 0;
                      const isExpanded = expandedCategoryIds.has(category.id);
                      
                      return (
                        <div key={category.id} className="flex flex-col">
                          <div className={`flex items-center group transition-colors ${isExpanded ? 'bg-neutral-50/50' : 'hover:bg-neutral-50/30'}`}>
                            <Link 
                              to={`/products?category=${category.slug}`} 
                              onClick={() => setIsOpen(false)} 
                              className="flex-grow flex items-center space-x-3 p-3.5 pl-5"
                            >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden border transition-all ${
                                isExpanded ? 'bg-white border-brand/20 shadow-sm' : 'bg-neutral-50 border-neutral-100'
                              }`}>
                                {category.image ? (
                                  <img 
                                    src={category.image.startsWith('http') ? category.image : `${BASE_URL}${category.image}`} 
                                    className="w-full h-full object-contain p-1" 
                                    alt={category.name}
                                  />
                                ) : (
                                  <ShoppingBag className={`w-4 h-4 ${isExpanded ? 'text-brand' : 'text-neutral-400'}`} />
                                )}
                              </div>
                              <span className={`text-[13px] font-bold transition-colors ${
                                isExpanded ? 'text-brand' : 'text-neutral-700'
                              }`}>
                                {category.name}
                              </span>
                            </Link>
                            
                            {hasChildren && (
                              <button 
                                onClick={(e) => toggleCategory(category.id, e)}
                                className={`p-3.5 pr-5 transition-all ${
                                  isExpanded ? 'text-brand' : 'text-neutral-300'
                                }`}
                              >
                                {isExpanded ? (
                                  <Minus className="w-4 h-4 stroke-[3px]" />
                                ) : (
                                  <Plus className="w-4 h-4 stroke-[3px]" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* Subcategories (Accordion) */}
                          <AnimatePresence>
                            {isExpanded && hasChildren && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="overflow-hidden bg-neutral-50/30"
                              >
                                <div className="flex flex-col py-1 pb-3 px-5 space-y-0.5">
                                  {subCategoriesMap[category.id].map((sub) => (
                                    <Link
                                      key={sub.id}
                                      to={`/products?category=${sub.slug}`}
                                      onClick={() => setIsOpen(false)}
                                      className="flex items-center space-x-3 pl-11 pr-4 py-2.5 text-[12px] font-medium text-neutral-500 hover:text-brand transition-colors group"
                                    >
                                      <div className="w-1 h-1 rounded-full bg-neutral-200 group-hover:bg-brand transition-colors" />
                                      <span>{sub.name}</span>
                                    </Link>
                                  ))}
                                  
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 text-neutral-400 text-[11px]">No categories found</div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </>
  );
};

export default Navbar;