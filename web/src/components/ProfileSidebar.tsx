import React, { useState, useEffect } from 'react';
import { X, UserCircle, Package, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../services/api';
import { useSettings } from '../context/SettingsContext';

const ProfileSidebar = () => {
  const { siteTitle } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOpen = (e: Event) => {
      e.preventDefault();
      setIsOpen(true);
    };
    window.addEventListener('openProfileSidebar', handleOpen);
    return () => window.removeEventListener('openProfileSidebar', handleOpen);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const getProfileImageUrl = () => {
    if (user?.profile?.profile_picture) {
      return user.profile.profile_picture.startsWith('http') 
        ? user.profile.profile_picture 
        : `${BASE_URL}${user.profile.profile_picture}`;
    }
    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] md:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[85vw] max-w-sm bg-gray-50 shadow-2xl z-[101] flex flex-col md:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Account</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              {user ? (
                <>
                  {/* User Info */}
                  <div className="bg-white p-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                        {getProfileImageUrl() ? (
                          <img src={getProfileImageUrl()!} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-gray-400">{user.user.first_name?.[0] || 'U'}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{user.user.first_name} {user.user.last_name}</h3>
                        <p className="text-sm text-gray-500">{user.user.username}</p>
                      </div>
                    </div>
                  </div>

                  {/* Admin Dashboard Link */}
                  {(user?.user?.is_staff || ['admin', 'moderator', 'ads_manager'].includes(user?.profile?.role || user?.user?.role)) && (
                    <div className="bg-white px-2 py-2 border-b border-gray-100">
                      <button
                        onClick={() => handleNavigation(
                          (user?.profile?.role === 'ads_manager' || user?.user?.role === 'ads_manager')
                            ? '/staff/ads_manager/'
                            : (user?.profile?.role === 'moderator' || user?.user?.role === 'moderator')
                            ? '/staff/moderator/'
                            : '/staff/admin/'
                        )}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <LayoutDashboard className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">Staff Dashboard</span>
                      </button>
                    </div>
                  )}

                  {/* Navigation Links */}
                  <div className="bg-white px-2 py-2 border-b border-gray-100">
                    <button
                      onClick={() => handleNavigation('/account')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <LayoutDashboard className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">Overview</span>
                    </button>
                    <button
                      onClick={() => handleNavigation('/account/orders')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Package className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">My Orders</span>
                    </button>
                    <button
                      onClick={() => handleNavigation('/account')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <UserCircle className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">Profile Settings</span>
                    </button>
                  </div>

                  {/* Sign Out Section - Pushed to bottom */}
                  <div className="bg-white px-2 py-2 border-t border-gray-100 mt-auto">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-brand hover:bg-brand/5 rounded-lg transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-6">
                  <div className="bg-white p-8 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 mb-6">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                      <UserCircle size={32} className="text-gray-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">Welcome to {siteTitle}</h3>
                    <p className="text-sm text-gray-500 mb-6">Log in to manage your account and view orders.</p>
                    <div className="w-full flex flex-col gap-3">
                      <button
                        onClick={() => handleNavigation('/login')}
                        className="w-full bg-brand text-white rounded-xl py-3 font-semibold hover:bg-[#3a5bd9] transition-colors"
                      >
                        Log In
                      </button>
                      <button
                        onClick={() => handleNavigation('/signup')}
                        className="w-full bg-white text-black border border-gray-200 rounded-xl py-3 font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Create Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileSidebar;
