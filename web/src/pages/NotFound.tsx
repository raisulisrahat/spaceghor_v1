import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Home, ShoppingBag, Search, ChevronRight, PackageSearch, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../services/api';
import illustration from '../assets/404-illustration.png';
import { useSettings } from '../context/SettingsContext';

const NotFound = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { siteTitle } = useSettings();
  
  // Mouse position for eye-tracking pupils
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const pupilX = useSpring(useTransform(mouseX, [0, 1], [-5, 5]), springConfig);
  const pupilY = useSpring(useTransform(mouseY, [0, 1], [-5, 5]), springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseX.set(e.clientX / innerWidth);
      mouseY.set(e.clientY / innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // 3D Tilt coordinates
  const cardX = useMotionValue(0);
  const cardY = useMotionValue(0);

  const rotateX = useSpring(useTransform(cardY, [-200, 200], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(cardX, [-200, 200], [-10, 10]), springConfig);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const x = e.clientX - rect.left - width / 2;
    const y = e.clientY - rect.top - height / 2;
    cardX.set(x);
    cardY.set(y);
  };

  const handleCardMouseLeave = () => {
    cardX.set(0);
    cardY.set(0);
  };

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then(res => res.data)
  });

  const parentCategories = categories?.filter((c: any) => !c.parent).slice(0, 4) || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row items-center justify-center p-6 md:p-12 gap-12 md:gap-24 font-sans overflow-hidden">
      <SEO title="404 - Page Not Found" />
      
      {/* Decorative Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] opacity-60" />
      </div>

      {/* Left Column: Anime Illustration */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-[320px] md:max-w-[450px] relative z-10"
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        style={{
          perspective: 1000
        }}
      >
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d"
          }}
          className="relative group cursor-pointer"
        >
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-20"
          >
            <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
              <img 
                src={illustration} 
                alt="404 Illustration" 
                className="w-full h-auto drop-shadow-[0_20px_50px_rgba(81, 115, 251,0.2)]"
                style={{
                  transform: "translateZ(30px)"
                }}
              />
              
              {/* Right eye pupil (our left) */}
              <motion.div 
                className="absolute w-[0.8%] h-[1.8%] bg-[#1a173d] rounded-full"
                style={{
                  top: '34.0%',
                  left: '41.8%',
                  x: pupilX,
                  y: pupilY,
                  z: 30.1,
                  translateX: '-50%',
                  translateY: '-50%',
                  filter: 'blur(0.2px)',
                  boxShadow: '0 0 2px rgba(26,23,61,0.5)'
                }}
              />
              {/* Left eye pupil (our right) */}
              <motion.div 
                className="absolute w-[0.8%] h-[1.8%] bg-[#1a173d] rounded-full"
                style={{
                  top: '34.0%',
                  left: '43.2%',
                  x: pupilX,
                  y: pupilY,
                  z: 30.1,
                  translateX: '-50%',
                  translateY: '-50%',
                  filter: 'blur(0.2px)',
                  boxShadow: '0 0 2px rgba(26,23,61,0.5)'
                }}
              />
            </div>
          </motion.div>
          {/* Shadow/Reflection */}
          <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-[80%] h-4 bg-black/5 blur-xl rounded-full" />
        </motion.div>
      </motion.div>

      {/* Right Column: Content & Actions */}
      <div className="w-full max-w-xl space-y-10 relative z-10 text-center md:text-left">
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-2 bg-brand/10 px-4 py-2 rounded-full text-brand font-black text-[10px] uppercase tracking-[0.2em] border border-brand/20 shadow-sm"
          >
            <PackageSearch className="w-3.5 h-3.5" />
            <span>Connection Lost</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-black text-neutral-900 leading-[0.9] tracking-tighter">
            Lost in <br />
            <span className="bg-gradient-to-r from-brand to-[#8551FB] bg-clip-text text-transparent block mt-2">Hyperspace?</span>
          </h1>
          
          <p className="text-neutral-500 font-medium text-lg max-w-md mx-auto md:mx-0 leading-relaxed">
            We couldn't track down that page, but our navigation systems are fully operational. Let's get you back on course!
          </p>
        </div>

        {/* Action Center */}
        <div className="space-y-8">
          <form onSubmit={handleSearch} className="relative group max-w-md">
            <div className="absolute inset-0 bg-brand/5 blur-xl group-focus-within:bg-brand/10 transition-colors rounded-3xl" />
            <div className="relative flex items-center bg-white border-2 border-neutral-100 group-focus-within:border-brand rounded-2xl overflow-hidden transition-all shadow-sm">
              <Search className="ml-4 w-5 h-5 text-neutral-400 group-focus-within:text-brand transition-colors" />
              <input 
                type="text"
                placeholder="Search premium products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow py-4 px-3 text-sm font-bold text-neutral-900 outline-none placeholder:text-neutral-300 bg-transparent"
              />
              <button type="submit" className="bg-brand text-white px-6 py-4 font-black text-xs uppercase tracking-widest hover:bg-brand-hover transition-colors">
                Find
              </button>
            </div>
          </form>

          {/* Quick Categories */}
          <div className="space-y-4">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-300">Popular Categories</span>
             <div className="flex flex-wrap gap-2 justify-center md:justify-start">
               {parentCategories.map((cat: any) => (
                 <Link 
                  key={cat.id} 
                  to={`/products?category=${cat.slug}`}
                  className="px-5 py-2.5 bg-neutral-50 border border-neutral-100 rounded-xl text-xs font-bold text-neutral-600 hover:border-brand hover:text-brand hover:bg-white transition-all shadow-sm"
                 >
                   {cat.name}
                 </Link>
               ))}
             </div>
          </div>

          {/* Core Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              to="/"
              className="flex-1 bg-neutral-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-3 hover:bg-brand hover:shadow-2xl hover:shadow-brand/20 transition-all active:scale-[0.98]"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 bg-white border-2 border-neutral-100 text-neutral-400 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-3 hover:border-brand hover:text-brand transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Page</span>
            </button>
          </div>
        </div>
      </div>

      {/* Side Brand Badge */}
      <div className="fixed bottom-10 right-10 hidden lg:flex items-center space-x-6 rotate-90 origin-right translate-y-[-50%] pointer-events-none opacity-10">
        <span className="text-sm font-black tracking-[0.5em] uppercase whitespace-nowrap">Protocol ERROR_404</span>
        <div className="w-12 h-px bg-neutral-900" />
        <span className="text-sm font-black tracking-[0.5em] uppercase whitespace-nowrap text-brand">{siteTitle} Global Store</span>
      </div>
    </div>
  );
};

export default NotFound;
