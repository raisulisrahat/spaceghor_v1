import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Zap, ChevronRight, Clock, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getFlashSales } from '../services/api';
import ProductCard from './ProductCard';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

const FlashSaleSection = () => {
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
          hours: Math.floor(difference / (1000 * 60 * 60)),
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

  const isCarousel = (activeSale?.items?.length || 0) >= 5;

  if (isLoading || !activeSale || !timeLeft) return null;

  return (
    <section className="relative group/section">
      {/* Background Glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-brand/5/50 to-transparent rounded-[40px] blur-3xl -z-10 opacity-0 group-hover/section:opacity-100 transition-opacity duration-1000" />
      
      <div className="bg-white rounded-[24px] border border-neutral-100 shadow-sm overflow-hidden">
        {/* Header Section: Compact & Refined */}
        <div className="px-5 md:px-8 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between gap-3 border-b border-neutral-50 bg-neutral-50/30">
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6 text-center md:text-left">
            <div className="space-y-0">
              <div className="flex items-center justify-center md:justify-start space-x-1.5">
                <div className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand"></span>
                </div>
                <h2 className="text-[9px] font-black text-[#5173FB] uppercase tracking-[0.2em]">Flash Sale</h2>
              </div>
              <h3 className="text-base md:text-lg font-bold text-neutral-900 tracking-tight leading-tight">
                {activeSale.title}
              </h3>
            </div>

            {/* Premium Countdown: Ultra Compact */}
            <div className="flex items-center space-x-2 bg-white px-2.5 py-1 rounded-xl border border-neutral-100 shadow-sm">
              <Clock className="w-3 h-3 text-neutral-400" />
              <div className="flex items-center space-x-2 text-neutral-900 font-mono text-sm md:text-base font-bold">
                <div className="flex flex-col items-center">
                  <span className="tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-[7px] uppercase tracking-widest text-neutral-400 font-sans -mt-1 font-black">Hr</span>
                </div>
                <span className="text-neutral-200 font-sans font-normal">:</span>
                <div className="flex flex-col items-center">
                  <span className="tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="text-[7px] uppercase tracking-widest text-neutral-400 font-sans -mt-1 font-black">Min</span>
                </div>
                <span className="text-neutral-200 font-sans font-normal">:</span>
                <div className="flex flex-col items-center">
                  <span className="tabular-nums">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-[7px] uppercase tracking-widest text-neutral-400 font-sans -mt-1 font-black">Sec</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isCarousel && (
              <div className="hidden md:flex items-center space-x-1.5 mr-2">
                <button 
                  onClick={() => document.getElementById('flash-sale-scroll')?.scrollBy({ left: -240, behavior: 'smooth' })}
                  className="w-8 h-8 bg-white border border-neutral-100 text-neutral-600 rounded-full flex items-center justify-center transition-all hover:bg-neutral-900 hover:text-white active:scale-95 shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => document.getElementById('flash-sale-scroll')?.scrollBy({ left: 240, behavior: 'smooth' })}
                  className="w-8 h-8 bg-white border border-neutral-100 text-neutral-600 rounded-full flex items-center justify-center transition-all hover:bg-neutral-900 hover:text-white active:scale-95 shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            <Link 
              to="/flash-sale" 
              className="group flex items-center space-x-2 bg-neutral-900 text-white hover:bg-brand px-4 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-md active:scale-95"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="px-4 md:px-6 pt-3 md:pt-5 pb-5 md:pb-8">
          <div 
            id="flash-sale-scroll"
            className={isCarousel 
              ? "flex overflow-x-auto gap-4 sm:gap-5 pb-4 scrollbar-hide snap-x" 
              : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"}
          >
            {activeSale.items.filter((item: any) => item.product?.stock !== undefined ? item.product.stock > 0 : true).map((item: any, idx: number) => {
              const product = { ...item.product };
              const discount = item.discount_percentage || activeSale.discount_percentage;
              
              if (discount) {
                const regularPrice = parseFloat(product.regular_price);
                const calculatedSalePrice = regularPrice * (1 - parseFloat(discount) / 100);
                if (product.sale_price) {
                  const dbSalePrice = parseFloat(product.sale_price);
                  const dbDiscount = Math.round((1 - dbSalePrice / regularPrice) * 100);
                  if (dbDiscount === Math.round(parseFloat(discount))) {
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
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  style={{ opacity: 0, transform: 'translateY(15px)' }}
                  className={isCarousel ? "flex-shrink-0 w-[200px] sm:w-[220px] md:w-[240px] snap-start flex flex-col space-y-3" : "flex flex-col space-y-3"}
                >
                  <ProductCard product={product} />
                  
                  {/* Simplified Availability Progress: More Compact */}
                  <div className="px-0.5 space-y-1">
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                      <span className="text-neutral-400 font-black">{stock > 0 ? `${stock} Left` : 'Sold Out'}</span>
                      <span className="text-[#5173FB]">{soldPercentage}% Sold</span>
                    </div>
                    <div className="h-1 w-full bg-neutral-50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${soldPercentage}%` }}
                        transition={{ duration: 1.2, delay: 0.3 }}
                        className="h-full bg-brand" 
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlashSaleSection;
