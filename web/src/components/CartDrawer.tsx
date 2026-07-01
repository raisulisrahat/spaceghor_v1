import React from 'react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

const CartDrawer = () => {
  const { isCartOpen, setIsCartOpen, cart, updateQuantity, removeFromCart, cartTotal } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-brand/10 rounded-xl text-brand">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Your Cart</h2>
                  <p className="text-xs text-neutral-500">{cart.length} items</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400 hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-300">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <p className="text-sm text-neutral-500 font-medium">Your cart is empty</p>
                  <Link 
                    to="/products" 
                    onClick={() => setIsCartOpen(false)}
                    className="text-brand text-sm font-bold hover:underline"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.cartKey} className="flex space-x-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-50 border border-neutral-100 flex-shrink-0">
                      <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                    </div>
                    <div className="flex-grow space-y-1">
                      <div className="flex justify-between items-start">
                        <Link 
                          to={`/product/${item.slug}`} 
                          onClick={() => setIsCartOpen(false)}
                          className="text-sm font-bold text-neutral-900 hover:text-brand transition-colors line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <button 
                          onClick={() => removeFromCart(item.cartKey)}
                          className="text-neutral-300 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Color & Size Info */}
                      {(item.color || item.size) && (
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {item.color && (
                            <span className="text-[10px] bg-neutral-50 text-neutral-500 px-1.5 py-0.5 rounded border border-neutral-100 font-bold uppercase">
                              Color: {item.color.name}
                            </span>
                          )}
                          {item.size && (
                            <span className="text-[10px] bg-neutral-50 text-neutral-500 px-1.5 py-0.5 rounded border border-neutral-100 font-bold uppercase">
                              Size: {item.size.code}
                            </span>
                          )}
                        </div>
                      )}

                      {item.stock !== undefined && item.stock <= 0 ? (
                        <span className="text-[10px] text-rose-600 font-bold block pt-1">
                          Out of Stock
                        </span>
                      ) : (
                        <p className="text-xs font-bold text-brand uppercase tracking-wider pt-0.5">৳{Math.round(parseFloat(item.price.toString())).toLocaleString()}</p>
                      )}
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center border border-neutral-100 rounded-lg p-0.5 px-1 bg-neutral-50/50">
                          <button 
                            disabled={item.stock !== undefined && item.stock <= 0}
                            onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                            className="p-1 hover:bg-white rounded-md transition-colors text-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-neutral-900">{item.quantity || 1}</span>
                          <button 
                            disabled={item.quantity >= (item.stock !== undefined ? item.stock : 999999)}
                            onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                            className="p-1 hover:bg-white rounded-md transition-colors text-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-neutral-900">
                          {item.stock !== undefined && item.stock <= 0 ? (
                            <span className="text-neutral-400">To be announced</span>
                          ) : (
                            `৳${(parseFloat(item.price.toString().replace(/[^0-9.]/g, '')) * (item.quantity || 1)).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-neutral-100 space-y-4 bg-neutral-50/50">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 font-medium">Subtotal</span>
                    <span className="text-neutral-900 font-bold">৳{cartTotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-neutral-900 font-bold">Product Amount</span>
                    <span className="text-lg font-extrabold text-brand">৳{cartTotal.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link 
                    to="/cart"
                    onClick={() => setIsCartOpen(false)}
                    className="flex items-center justify-center py-3.5 border-2 border-neutral-200 text-neutral-600 rounded-xl font-bold text-sm hover:bg-neutral-100 hover:border-neutral-300 transition-all active:scale-95"
                  >
                    View Cart
                  </Link>
                  <Link 
                    to="/checkout"
                    onClick={(e) => {
                      if (cart.some(i => i.stock !== undefined && i.stock <= 0)) {
                        e.preventDefault();
                        alert('Your cart contains out of stock items. Please remove them before proceeding.');
                      } else {
                        setIsCartOpen(false);
                      }
                    }}
                    className={`flex items-center justify-center space-x-2 py-3.5 bg-brand text-white rounded-xl font-bold text-sm shadow-lg shadow-red-700/10 hover:bg-[#3a5bd9] transition-all active:scale-95 ${cart.some(i => i.stock !== undefined && i.stock <= 0) ? 'opacity-50 cursor-not-allowed bg-neutral-400' : ''}`}
                  >
                    <span>Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
