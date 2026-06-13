import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import CartDrawer from './CartDrawer';
import ProfileSidebar from './ProfileSidebar';
import ChatBubble from './ChatBubble';
import ScrollToTopButton from './ScrollToTopButton';
import NoticeDisplay from './NoticeDisplay';
import SEO from './SEO';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, KeyRound, AlertTriangle, ShieldCheck } from 'lucide-react';

const UserLayout = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show prompt if user has a temporary password, is authenticated, is not already on the change password page,
    // and hasn't skipped this prompt in the current session.
    if (
      isAuthenticated &&
      user?.profile?.is_temp_password &&
      location.pathname !== '/account/change-password' &&
      sessionStorage.getItem('skipTempPasswordPrompt') !== 'true'
    ) {
      // Small timeout for better UX transitions after page loads
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setShowPrompt(false);
    }
  }, [isAuthenticated, user, location.pathname]);

  const handleSkip = () => {
    sessionStorage.setItem('skipTempPasswordPrompt', 'true');
    setShowPrompt(false);
  };

  const handleGoToChange = () => {
    setShowPrompt(false);
    navigate('/account/change-password');
  };

  return (
    <>
      <SEO />
      <NoticeDisplay />
      <Navbar />
      <CartDrawer />
      <ProfileSidebar />
      <main className="flex-grow pb-20 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
      <ScrollToTopButton />
      <ChatBubble />

      {/* Temporary Password Warning Modal */}
      <AnimatePresence>
        {showPrompt && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleSkip}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-neutral-100 overflow-hidden text-center"
            >
              {/* Top Accent Pattern */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-brand to-red-500" />

              {/* Close Button */}
              <button
                onClick={handleSkip}
                className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Security Icon Header */}
              <div className="relative mx-auto w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-8 shadow-inner">
                <KeyRound className="w-10 h-10 text-brand" />
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-sm"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </motion.div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h2 className="text-xl md:text-2xl font-black text-neutral-900 leading-tight">
                  পাসওয়ার্ড পরিবর্তন করুন<br />
                  <span className="text-neutral-500 text-base md:text-lg font-bold">Secure Your Account Now</span>
                </h2>
                
                <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100 text-left space-y-3">
                  <p className="text-xs md:text-sm text-neutral-600 leading-relaxed font-semibold">
                    আপনি একটি অস্থায়ী পাসওয়ার্ড দিয়ে লগইন করেছেন। আপনার অ্যাকাউন্টটি নিরাপদ রাখতে দয়া করে একটি নতুন পাসওয়ার্ড সেট করুন।
                  </p>
                  <div className="h-[1px] bg-neutral-200/60" />
                  <p className="text-[11px] md:text-xs text-neutral-400 leading-relaxed font-medium">
                    You have logged in with a temporary password. Please set a strong, custom password to keep your account and orders secure.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  onClick={handleSkip}
                  className="w-full sm:w-1/2 py-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold rounded-2xl transition-all active:scale-[0.97]"
                >
                  পরে করুন / Later
                </button>
                <button
                  onClick={handleGoToChange}
                  className="w-full sm:w-1/2 py-4 bg-brand hover:bg-[#3a5bd9] text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-brand/20 active:scale-[0.97] flex items-center justify-center gap-2 group"
                >
                  <span>পরিবর্তন করুন / Change</span>
                  <ShieldCheck className="w-5 h-5 transition-transform group-hover:scale-110" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UserLayout;
