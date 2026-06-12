import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BASE_URL } from '../services/api';
import { useCart } from '../context/CartContext';
import SEO from '../components/SEO';
import { useSettings } from '../context/SettingsContext';

const Wishlist = () => {
  const { wishlist, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const { siteTitle } = useSettings();

  if (loading && wishlist.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SEO title="My Wishlist" />
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO title="My Wishlist" description={`Items you've saved to your wishlist at ${siteTitle}.`} />
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Your Wishlist</h1>
          <p className="text-neutral-500 mt-2">Saved items you love</p>
        </div>
        <div className="hidden md:block">
          <Link to="/products" className="inline-flex items-center text-brand hover:text-brand-hover font-semibold transition-colors group">
            Continue Shopping 
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {wishlist.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-neutral-100"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-neutral-50 rounded-full mb-6 text-neutral-300">
            <Heart className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Your wishlist is empty</h2>
          <p className="text-neutral-500 max-w-xs mx-auto mb-8">
            Start adding items to your wishlist and they will show up here.
          </p>
          <Link 
            to="/products" 
            className="inline-flex items-center px-8 py-4 bg-brand text-white font-bold rounded-2xl hover:bg-brand-hover transition-all shadow-lg hover:shadow-brand/20"
          >
            Explore Products
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence>
            {wishlist.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full"
              >
                <div className="relative aspect-square overflow-hidden bg-neutral-50">
                  <img 
                    src={item.product.image ? (item.product.image.startsWith('http') ? item.product.image : `${BASE_URL}${item.product.image}`) : 'https://via.placeholder.com/400'} 
                    alt={item.product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button 
                    onClick={() => removeFromWishlist(item.id)}
                    className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm text-red-700 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-brand/5 translate-y-2 group-hover:translate-y-0"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-5 flex flex-col flex-grow">
                  <Link to={`/product/${item.product.slug}`} className="flex-grow">
                    <h3 className="text-base font-bold text-neutral-900 line-clamp-2 group-hover:text-brand transition-colors mb-2">
                      {item.product.name}
                    </h3>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-lg font-extrabold text-brand">
                        ৳{item.product.sale_price || item.product.regular_price}
                      </span>
                      {item.product.sale_price && (
                        <span className="text-xs text-neutral-400 line-through">
                          ৳{item.product.regular_price}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
