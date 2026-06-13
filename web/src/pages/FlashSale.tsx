import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Clock, 
  Flame, 
  TrendingUp, 
  ShieldCheck, 
  ChevronRight,
  ArrowRight,
  Timer
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getFlashSales } from '../services/api';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const FlashSalePage = () => {
  const { data: flashSales, isLoading } = useQuery({
    queryKey: ['flash-sales'],
    queryFn: () => getFlashSales().then(res => res.data),
  });

  const activeSale = flashSales?.find((sale: any) => sale.is_active);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!activeSale) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(activeSale.end_time) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [activeSale]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-700 rounded-full animate-spin" />
          <p className="text-neutral-500 font-medium animate-pulse">Loading amazing deals...</p>
        </div>
      </div>
    );
  }

  if (!activeSale || !timeLeft) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl space-y-4 border border-neutral-100">
            <div className="w-20 h-20 bg-brand/5 rounded-full flex items-center justify-center mx-auto">
              <Timer className="w-10 h-10 text-brand" />
            </div>
            <h1 className="text-2xl font-black text-neutral-900">No Active Flash Sale</h1>
            <p className="text-neutral-500">Stay tuned! We have some incredible deals coming your way very soon.</p>
            <Link 
              to="/products"
              className="inline-flex items-center space-x-2 bg-neutral-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all active:scale-95"
            >
              <span>Explore All Products</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title={activeSale.title} 
        description={`Flash Sale! Get up to ${activeSale.discount_percentage}% OFF on premium products. Limited time offer.`}
        type="website"
      />
      {/* Subtle Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-brand/5 rounded-full blur-[100px] opacity-40" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-neutral-50 rounded-full blur-[100px] opacity-40" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-16 pb-12 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex-1 space-y-8 text-center lg:text-left"
            >
              <div className="inline-flex items-center space-x-2 bg-brand/5 px-3 py-1.5 rounded-full text-brand font-bold text-[9px] uppercase tracking-[0.2em] border border-brand/10">
                <Zap className="w-3 h-3 fill-current" />
                <span>Limited Time</span>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-black text-neutral-900 leading-none tracking-tighter">
                {activeSale.title}
                <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-brand to-[#E07030]">
                  Up to {activeSale.discount_percentage || '50'}% OFF
                </span>
              </h3>
              
              <p className="text-neutral-500 text-[13px] font-medium max-w-md mx-auto lg:mx-0 leading-relaxed opacity-70">
                Elevate your lifestyle with premium products at prices that won't last. Handpicked deals, exclusively for you.
              </p>

              <div className="flex flex-wrap items-center gap-8 justify-center lg:justify-start pt-4">
                <div className="flex items-center space-x-2 text-neutral-800">
                  <div className="w-8 h-8 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-100 shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-brand" />
                  </div>
                  <span className="font-bold text-[10px] uppercase tracking-widest text-neutral-400">Authentic</span>
                </div>
                <div className="flex items-center space-x-2 text-neutral-800">
                  <div className="w-8 h-8 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-100 shadow-sm">
                    <TrendingUp className="w-4 h-4 text-brand" />
                  </div>
                  <span className="font-bold text-[10px] uppercase tracking-widest text-neutral-400">Fast Delivery</span>
                </div>
              </div>
            </motion.div>

            {/* Countdown Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="w-full lg:w-auto"
            >
              <div className="bg-white border border-neutral-100 p-6 md:p-10 rounded-[40px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.06)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity hidden md:block">
                  <Timer className="w-32 h-32 text-brand" />
                </div>
                
                <div className="relative z-10 text-center space-y-8">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-6 h-[1px] bg-brand/20" />
                    <p className="text-neutral-400 font-bold uppercase tracking-[0.25em] text-[8px]">Ends in</p>
                  </div>
                  <div className="flex gap-2.5 md:gap-5 justify-center">
                    {[
                      { val: timeLeft.days, label: 'Days' },
                      { val: timeLeft.hours, label: 'Hrs' },
                      { val: timeLeft.minutes, label: 'Min' },
                      { val: timeLeft.seconds, label: 'Sec' }
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="text-xl md:text-3xl font-black text-neutral-900 font-mono tabular-nums bg-neutral-50 w-12 md:w-20 h-12 md:h-20 flex items-center justify-center rounded-[1.5rem] border border-neutral-100 shadow-sm">
                          {String(item.val).padStart(2, '0')}
                        </div>
                        <span className="mt-2.5 text-[7px] font-bold text-neutral-400 uppercase tracking-widest">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      {/* Grid Section */}
      <section className="px-4 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            <AnimatePresence>
              {activeSale.items.map((item: any, idx: number) => {
                const product = { ...item.product };
                const itemDiscount = parseFloat(item.discount_percentage);
                const globalDiscount = parseFloat(activeSale.discount_percentage);
                const discount = (itemDiscount > 0) ? itemDiscount : globalDiscount;
                
                if (discount) {
                  const regularPrice = parseFloat(product.regular_price);
                  const calculatedSalePrice = regularPrice * (1 - discount / 100);
                  if (product.sale_price) {
                    const dbSalePrice = parseFloat(product.sale_price);
                    const dbDiscount = Math.round((1 - dbSalePrice / regularPrice) * 100);
                    if (dbDiscount === Math.round(discount)) {
                      product.sale_price = dbSalePrice.toFixed(2);
                    } else {
                      product.sale_price = Math.min(calculatedSalePrice, dbSalePrice).toFixed(2);
                    }
                  } else {
                    product.sale_price = calculatedSalePrice.toFixed(2);
                  }
                }

                const stock = product.stock || 0;
                const soldPercentage = stock === 0 
                  ? 100 
                  : Math.max(50, Math.min(98, 100 - Math.round(stock * 1.5)));

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.03, duration: 0.6 }}
                    style={{ opacity: 0, transform: 'translateY(20px)' }}
                    className="group"
                  >
                    <div className="relative bg-white rounded-3xl p-2 border border-neutral-100 hover:border-brand/20 transition-all duration-300 hover:shadow-xl group-hover:-translate-y-1.5">
                      <div className="relative mb-4">
                        <ProductCard product={product} />
                        {/* Sold Badge */}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-[8px] font-bold text-neutral-900 px-3 py-1.5 rounded-full shadow-sm border border-neutral-100 uppercase tracking-widest">
                          {soldPercentage}% SOLD
                        </div>
                      </div>

                      <div className="px-4 pb-4 space-y-6">
                        {/* Elegant Progress Bar */}
                        <div className="space-y-2">
                           <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                             <span className="text-neutral-400 font-black">{stock > 0 ? `${stock} Left` : 'Sold Out'}</span>
                             <span className="text-brand">{soldPercentage}% Sold</span>
                           </div>
                           <div className="h-1 w-full bg-neutral-50 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                whileInView={{ width: `${soldPercentage}%` }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="h-full bg-brand rounded-full"
                              />
                           </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FlashSalePage;
