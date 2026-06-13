import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import Breadcrumbs from '../components/Breadcrumbs';
import SEO from '../components/SEO';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-32 text-center">
        <SEO title="Your Cart is Empty" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto space-y-8"
        >
          <div className="w-24 h-24 bg-brand/5 rounded-full flex items-center justify-center mx-auto text-brand">
             <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Your cart is empty</h2>
            <p className="text-neutral-500">Looks like you haven't added anything to your cart yet. Explore our premium gadgets!</p>
          </div>
          <Link 
            to="/products" 
            className="inline-flex items-center space-x-3 bg-brand text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-xl shadow-brand/20 hover:bg-[#3a5bd9] hover:-translate-y-1 active:scale-95"
          >
            <span>Start Shopping</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <SEO title="My Shopping Bag" description={`You have ${cart.length} items in your shopping bag. Proceed to checkout to complete your purchase.`} />
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-2 bg-neutral-900 rounded-lg">
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Shopping Bag</h1>
          <p className="text-neutral-500 text-[11px] font-medium uppercase tracking-wider">{cart.length} items collected</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence>
            {cart.map((item, idx) => (
              <motion.div 
                key={item.cartKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center space-x-4 p-4 bg-white rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-all ${!(item.stock && item.stock > 0) ? 'opacity-75' : ''}`}
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-neutral-50 border border-neutral-100 flex-shrink-0">
                  <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                </div>
                
                <div className="flex-grow min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <Link to={`/product/${item.slug}`} className="text-[14px] font-bold text-neutral-900 hover:text-brand transition-colors leading-tight line-clamp-2">
                      {item.name}
                    </Link>
                    <p className="text-base font-bold text-neutral-900 whitespace-nowrap">
                      {item.stock !== undefined && item.stock <= 0 ? (
                        <span className="text-neutral-400">To be announced</span>
                      ) : (
                        `৳${item.price}`
                      )}
                    </p>
                  </div>
                  
                  {/* Color & Size Info */}
                  {(item.color || item.size) && (
                    <div className="flex flex-wrap gap-3 pt-1">
                      {item.color && (
                        <div className="flex items-center space-x-1.5">
                           <div className="w-2.5 h-2.5 rounded-full bg-neutral-200" />
                           <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-tight">Color: {item.color.name}</span>
                        </div>
                      )}
                      {item.size && (
                        <div className="flex items-center space-x-1.5">
                           <div className="w-2.5 h-2.5 rounded-full bg-neutral-200" />
                           <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-tight">Size: {item.size.code}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {item.stock !== undefined && item.stock <= 0 && (
                    <span className="text-[11px] text-rose-600 font-bold block pt-1">
                      Out of Stock
                    </span>
                  )}
                  
                  <div className="pt-2 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center bg-neutral-50 rounded-lg p-0.5 border border-neutral-100">
                         <button 
                          disabled={item.stock !== undefined && item.stock <= 0}
                          onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                          className="p-1 hover:bg-white rounded transition-all text-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed"
                         >
                           <Minus className="w-3 h-3" />
                         </button>
                         <span className="w-8 text-center text-xs font-bold text-neutral-900">{item.quantity || 1}</span>
                         <button 
                          disabled={item.quantity >= (item.stock !== undefined ? item.stock : 999999)}
                          onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                          className="p-1 hover:bg-white rounded transition-all text-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed"
                         >
                           <Plus className="w-3 h-3" />
                         </button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.cartKey)}
                        className="text-neutral-400 hover:text-red-700 transition-colors p-1.5 rounded-lg hover:bg-brand/5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>


        {/* Summary */}
        <div className="space-y-6">
           <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-6 space-y-6 sticky top-24">
              <div className="border-b border-neutral-50 pb-3">
                <h3 className="text-lg font-bold text-neutral-900">Order Summary</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-[13px]">
                   <span className="text-neutral-500 font-medium">Subtotal</span>
                   <span className="text-neutral-900 font-bold">৳{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                   <span className="text-neutral-500 font-medium">Delivery</span>
                   <span className="text-brand font-bold">৳60</span>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <span className="font-bold text-neutral-900 text-base">Total amount</span>
                  <span className="text-xl font-bold text-brand">৳{(cartTotal + 60).toLocaleString()}</span>
              </div>

              {cart.some(i => i.stock !== undefined && i.stock <= 0) && (
                <div className="bg-red-50 text-red-700 text-xs font-bold p-3 rounded-xl border border-red-100 leading-relaxed mb-4">
                  আপনার কার্টে কিছু আউট অফ স্টক প্রোডাক্ট রয়েছে। দয়া করে প্রস্থান করার আগে কার্ট থেকে সেগুলো বাদ দিন।
                </div>
              )}

              <div className="space-y-2">
                <Link 
                  to="/checkout"
                  onClick={(e) => {
                    if (cart.some(i => i.stock !== undefined && i.stock <= 0)) {
                      e.preventDefault();
                      alert('Your cart contains out of stock items. Please remove them before proceeding.');
                    }
                  }}
                  className={`group w-full bg-brand hover:bg-[#3a5bd9] text-white font-bold py-3 rounded-lg text-center shadow-md transition-all flex items-center justify-center space-x-2 active:scale-[0.98] ${cart.some(i => i.stock !== undefined && i.stock <= 0) ? 'opacity-50 cursor-not-allowed bg-neutral-400' : ''}`}
                >
                  <span className="text-[15px]">Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                
                <Link to="/products" className="block text-center text-neutral-400 hover:text-neutral-900 font-bold text-xs py-2 transition-colors uppercase tracking-wider">
                  Continue Shopping
                </Link>
              </div>

              <div className="pt-6 border-t border-neutral-50 flex items-center justify-center space-x-4 text-neutral-300">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">Secure</span>
                </div>
                <div className="w-[1px] h-3 bg-neutral-100" />
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px]">🚚</span>
                  <span className="text-[10px] font-bold uppercase">Fast</span>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
