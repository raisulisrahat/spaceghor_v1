import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, User } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { motion } from 'framer-motion';

const MobileBottomNav = () => {
  const { wishlist } = useWishlist();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isAccountActive = location.pathname.startsWith('/account');

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/90 backdrop-blur-xl border-t border-neutral-100 px-6 py-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0,05)]">
      <div className="flex items-center justify-around">
        {/* Wishlist */}
        <Link to="/wishlist" className="flex flex-col items-center py-1 group">
          <div className="relative p-1">
            <motion.div
              animate={{ scale: isActive('/wishlist') ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <Heart 
                className={`w-6 h-6 transition-colors duration-300 ${
                  isActive('/wishlist') 
                    ? 'text-[#5173FB] fill-[#5173FB]' 
                    : 'text-neutral-400 group-hover:text-neutral-600'
                }`} 
              />
            </motion.div>
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-brand text-white text-[9px] font-black flex items-center justify-center rounded-full px-1 border-2 border-white">
                {wishlist.length}
              </span>
            )}
          </div>
          {/* <span className={`text-[10px] font-bold mt-0.5 transition-colors duration-300 ${
            isActive('/wishlist') ? 'text-[#5173FB]' : 'text-neutral-400'
          }`}>
            Wishlist
          </span> */}
        </Link>

        {/* Home */}
        <Link to="/" className="flex flex-col items-center py-1 group">
          <div className="relative p-1">
            <motion.div
              animate={{ scale: isActive('/') ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <Home 
                className={`w-6 h-6 transition-colors duration-300 ${
                  isActive('/') 
                    ? 'text-[#5173FB] fill-[#5173FB]/10' 
                    : 'text-neutral-400 group-hover:text-neutral-600'
                }`} 
              />
            </motion.div>
            {isActive('/') && (
              <motion.div 
                layoutId="activeTab"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand rounded-full"
              />
            )}
          </div>
          {/* <span className={`text-[10px] font-bold mt-0.5 transition-colors duration-300 ${
            isActive('/') ? 'text-[#5173FB]' : 'text-neutral-400'
          }`}>
            Home
          </span> */}
        </Link>

        {/* Profile */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            window.dispatchEvent(new Event('openProfileSidebar'));
          }}
          className="flex flex-col items-center py-1 group"
        >
          <div className="relative p-1">
            <motion.div
              animate={{ scale: isAccountActive ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <User 
                className={`w-6 h-6 transition-colors duration-300 ${
                  isAccountActive 
                    ? 'text-[#5173FB] fill-[#5173FB]/10' 
                    : 'text-neutral-400 group-hover:text-neutral-600'
                }`} 
              />
            </motion.div>
            {isAccountActive && (
              <motion.div 
                layoutId="activeTab"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand rounded-full"
              />
            )}
          </div>
          {/* <span className={`text-[10px] font-bold mt-0.5 transition-colors duration-300 ${
            isAccountActive ? 'text-[#5173FB]' : 'text-neutral-400'
          }`}>
            Profile
          </span> */}
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;
