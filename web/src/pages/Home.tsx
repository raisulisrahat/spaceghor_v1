import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, CreditCard, Truck, Headset, ChevronRight, Plus, ChevronLeft, ShoppingBag } from 'lucide-react';
import { getBanners, getProducts, getCategories, getBlogPosts, BASE_URL } from '../services/api';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import FlashSaleSection from '../components/FlashSaleSection';
import BlogCard from '../components/BlogCard';
import { Link } from 'react-router-dom';
import { resolveImageUrl } from '../utils/image';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Home = () => {
  const { t } = useLanguage();
  const { addToCart } = useCart();

  const { data: banners, isLoading: bannersLoading } = useQuery({ queryKey: ['banners'], queryFn: () => getBanners().then(res => res.data) });
  const { data: products, isLoading: productsLoading } = useQuery({ queryKey: ['products', 'recent'], queryFn: () => getProducts({ ordering: '-updated_at' }).then(res => res.data) });
  const { data: categories, isLoading: categoriesLoading } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories().then(res => res.data) });
  const { data: blogs } = useQuery({ queryKey: ['blogs'], queryFn: () => getBlogPosts().then(res => res.data) });

  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('All');

  const loading = productsLoading || categoriesLoading;

  const parentCategories = categories?.filter((c: any) => !c.parent);
  const trendingCategories = parentCategories?.slice(0, 6) || [];

  const getFilteredProducts = () => {
    if (!products) return [];
    const inStock = products.filter((product: any) => product.stock !== undefined ? product.stock > 0 : true);
    if (activeTab === 'All') return inStock;

    const activeCategory = categories?.find((c: any) => c.name === activeTab);
    if (!activeCategory) return [];

    const activeCategoryIds = [
      activeCategory.id,
      ...(categories?.filter((c: any) => c.parent === activeCategory.id).map((c: any) => c.id) || [])
    ];

    return inStock.filter((product: any) =>
      product.categories?.some((cat: any) => activeCategoryIds.includes(cat.id))
    );
  };

  const subCategoriesMap = categories?.reduce((acc: any, cat: any) => {
    if (cat.parent) {
      if (!acc[cat.parent]) acc[cat.parent] = [];
      acc[cat.parent].push(cat);
    }
    return acc;
  }, {});

  const heroBanners = banners?.filter((b: any) => b.type === 'hero') || [];
  const promoBanners = banners?.filter((b: any) => b.type === 'promo') || [];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  // Auto-scroll categories
  useEffect(() => {
    const el = document.getElementById('category-carousel');
    if (!el || !parentCategories || parentCategories.length === 0) return;

    const autoScroll = setInterval(() => {
      if (el.scrollLeft + el.offsetWidth >= el.scrollWidth - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 240, behavior: 'smooth' });
      }
    }, 4000);

    return () => clearInterval(autoScroll);
  }, [parentCategories]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      <SEO title="Premium Shopping in Bangladesh" />
      {/* Top Banner & Category Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Parent Categories with Mega Menu Logic */}
        <aside
          className="hidden lg:block lg:col-span-1 bg-white rounded-xl border border-neutral-100 shadow-sm relative z-30 h-fit"
          onMouseLeave={() => setActiveCategoryId(null)}
        >
          <nav className="py-2">
            {parentCategories?.map((cat: any) => (
              <div
                key={cat.id}
                onMouseEnter={() => setActiveCategoryId(cat.id)}
                className="relative"
              >
                <Link
                  to={`/products?category=${cat.slug}`}
                  className={`flex items-center justify-between px-5 py-3 text-sm transition-all group ${activeCategoryId === cat.id
                      ? 'text-brand bg-brand/5'
                      : 'text-neutral-600 hover:text-brand hover:bg-neutral-50'
                    }`}
                >
                  <span>{cat.name}</span>
                  <div className="flex items-center space-x-2">
                    {subCategoriesMap?.[cat.id]?.length > 0 && (
                      <Plus className={`w-3.5 h-3.5 text-brand transition-transform ${activeCategoryId === cat.id ? 'rotate-90' : 'opacity-40 group-hover:opacity-100'}`} />
                    )}
                  </div>
                </Link>

                {/* Mega Menu Flyout */}
                <AnimatePresence>
                  {activeCategoryId === cat.id && subCategoriesMap?.[cat.id] && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-full top-0 ml-px w-[600px] min-h-full bg-white border border-neutral-100 shadow-2xl rounded-r-xl z-50 p-8 grid grid-cols-2 gap-8 overflow-y-auto"
                      style={{ height: 'calc(100% * 1.5)', minHeight: '400px' }}
                    >
                      <div className="col-span-2 border-b border-neutral-50 pb-4 mb-2">
                        <h3 className="text-xl font-bold text-neutral-900">{cat.name}</h3>
                        <p className="text-sm text-neutral-500">Shop by specialized sub-categories</p>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Sub Categories</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {subCategoriesMap[cat.id].map((sub: any) => (
                            <Link
                              key={sub.id}
                              to={`/products?category=${sub.slug}`}
                              className="text-sm text-neutral-600 hover:text-brand hover:translate-x-1 transition-all"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                      <div
                        className={`rounded-xl p-6 flex flex-col justify-end relative overflow-hidden group/banner ${!cat.mega_menu_banner ? 'bg-brand/5' : ''}`}
                        style={cat.mega_menu_banner ? {
                          backgroundImage: `url(${resolveImageUrl(cat.mega_menu_banner)})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        } : {}}
                      >
                        {cat.mega_menu_banner && <div className="absolute inset-0 bg-black/40 group-hover/banner:bg-black/50 transition-colors" />}
                        <div className="space-y-4 relative z-10">
                          <h4 className={`font-bold text-lg ${cat.mega_menu_banner ? 'text-white underline decoration-brand decoration-2 underline-offset-4' : 'text-brand'}`}>Top Brands in {cat.name}</h4>
                          <p className={`text-xs capitalize ${cat.mega_menu_banner ? 'text-white/90' : 'text-brand/70'}`}>Curated selection for your premium lifestyle.</p>
                          <Link
                            to={`/products?category=${cat.slug}`}
                            className="inline-block bg-brand text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-hover transition-all hover:scale-105 active:scale-95 shadow-xl"
                          >
                            Explore Global Store
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>
        </aside>

        {/* Middle Column: Main Banners */}
        <div className="lg:col-span-3 relative z-10">
          {/* Banner 1: Hero */}
          <div className="relative h-[160px] sm:h-[300px] md:h-[400px] lg:h-[450px] rounded-2xl overflow-hidden group shadow-2xl shadow-red-700/10">
            <AnimatePresence mode="wait">
              {heroBanners.length > 0 ? (
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 w-full h-full"
                >
                  {heroBanners[currentSlide].link ? (
                    <Link
                      to={heroBanners[currentSlide].link}
                      className="absolute inset-0 w-full h-full block cursor-pointer"
                    >
                      <img
                        src={resolveImageUrl(heroBanners[currentSlide].image)}
                        className="w-full h-full object-cover"
                        alt={heroBanners[currentSlide].title}
                      />
                      <div className="absolute inset-0 to-transparent" />

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="absolute bottom-4 left-4 md:bottom-10 md:left-10 max-w-[85%] md:max-w-lg space-y-2 md:space-y-6"
                      >
                        {heroBanners[currentSlide].title && (
                          <h2 className="text-lg sm:text-2xl md:text-5xl font-extrabold text-white drop-shadow-2xl leading-tight">
                            {heroBanners[currentSlide].title}
                          </h2>
                        )}
                        {heroBanners[currentSlide].button_text && (
                          <span className="inline-flex items-center space-x-1.5 md:space-x-2 bg-white text-neutral-900 font-bold px-4 py-2 md:px-8 md:py-4 rounded-lg md:rounded-xl hover:bg-brand hover:text-white transition-all shadow-2xl text-[10px] md:text-sm transform hover:-translate-y-1">
                            <span>{heroBanners[currentSlide].button_text}</span>
                            <ArrowRight className="w-3.5 h-3.5 md:w-5 md:h-5" />
                          </span>
                        )}
                      </motion.div>
                    </Link>
                  ) : (
                    <div className="absolute inset-0 w-full h-full">
                      <img
                        src={resolveImageUrl(heroBanners[currentSlide].image)}
                        className="w-full h-full object-cover"
                        alt={heroBanners[currentSlide].title}
                      />
                      <div className="absolute inset-0 to-transparent" />

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="absolute bottom-4 left-4 md:bottom-10 md:left-10 max-w-[85%] md:max-w-lg space-y-2 md:space-y-6"
                      >
                        {heroBanners[currentSlide].title && (
                          <h2 className="text-lg sm:text-2xl md:text-5xl font-extrabold text-white drop-shadow-2xl leading-tight">
                            {heroBanners[currentSlide].title}
                          </h2>
                        )}
                        {heroBanners[currentSlide].button_text && (
                          <span className="inline-flex items-center space-x-1.5 md:space-x-2 bg-white text-neutral-900 font-bold px-4 py-2 md:px-8 md:py-4 rounded-lg md:rounded-xl hover:bg-brand hover:text-white transition-all shadow-2xl text-[10px] md:text-sm transform hover:-translate-y-1">
                            <span>{heroBanners[currentSlide].button_text}</span>
                            <ArrowRight className="w-3.5 h-3.5 md:w-5 md:h-5" />
                          </span>
                        )}
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              ) : bannersLoading ? (
                <div className="w-full h-full bg-neutral-200 animate-pulse flex items-center justify-center">
                  <span className="text-neutral-400 font-medium">Loading premium deals...</span>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-[#C0561F] to-[#809BFF] flex flex-col justify-center p-8 md:p-12 text-white space-y-4">
                  <h2 className="text-3xl md:text-5xl font-extrabold leading-tight max-w-lg">
                    Premium Gadgets & Accessories
                  </h2>
                  <p className="text-xs md:text-sm opacity-90 max-w-md">
                    Explore the best-curated tech products at unbeatable prices in Bangladesh.
                  </p>
                  <div>
                    <Link
                      to="/products"
                      className="inline-flex items-center space-x-2 bg-white text-neutral-900 font-bold px-5 py-2.5 rounded-xl hover:bg-neutral-100 transition-all shadow-lg text-xs md:text-sm"
                    >
                      <span>Explore Shop</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Carousel Controls */}
            {heroBanners.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/20 backdrop-blur-md text-white rounded-full md:opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40 border border-white/20"
                >
                  <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white/20 backdrop-blur-md text-white rounded-full md:opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40 border border-white/20"
                >
                  <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
                </button>

                {/* Pagination Dots */}
                <div className="absolute bottom-3 right-4 md:bottom-6 md:right-10 flex space-x-2 md:space-x-3">
                  {heroBanners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 transition-all duration-300 rounded-full ${currentSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/40'
                        }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Truck, title: 'Fast Delivery', desc: 'All over Bangladesh' },
          { icon: CreditCard, title: 'Payment Method', desc: 'Cash On Delivery' },
          { icon: ShoppingBag, title: 'Items', desc: 'Premium Quality Products' },
          { icon: Headset, title: 'Customer Service', desc: '24/7 dedicated assistance' },
        ].map((item, i) => (
          <div key={i} className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-brand/10 p-2 rounded-lg text-brand">
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-neutral-900 text-xs">{item.title}</h4>
              <p className="text-[10px] text-neutral-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories Carousel in a White Card */}
      <section className="bg-white rounded-[2rem] border border-neutral-100 shadow-sm p-6 md:p-10 space-y-8 relative group">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-bold text-neutral-900 uppercase tracking-tight">Popular Categories</h2>
            <p className="text-sm text-neutral-500">Explore items by their specialized usage</p>
          </div>

          {/* Navigation Arrows in Header */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const el = document.getElementById('category-carousel');
                if (el) el.scrollLeft -= 240;
              }}
              className="w-10 h-10 bg-neutral-100/80 hover:bg-neutral-200 text-neutral-600 rounded-full flex items-center justify-center transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('category-carousel');
                if (el) el.scrollLeft += 240;
              }}
              className="w-10 h-10 bg-neutral-100/80 hover:bg-neutral-200 text-neutral-600 rounded-full flex items-center justify-center transition-all active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <div
            id="category-carousel"
            className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-2 -mx-2 px-2 scroll-smooth no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style>{`
              #category-carousel::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {parentCategories?.map((category: any) => (
              <Link
                key={category.id}
                to={`/products?category=${category.slug}`}
                className="flex-shrink-0 w-28 sm:w-36 md:w-44 snap-start group flex flex-col items-center space-y-4"
              >
                <div className="w-20 h-20 sm:w-28 sm:h-28 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center rounded-full overflow-hidden p-4">
                  {category.image ? (
                    <img
                      src={resolveImageUrl(category.image)}
                      className="w-full h-full object-contain"
                      alt={category.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://api.iconify.design/lucide:shopping-bag.svg?color=%23C0561F';
                      }}
                    />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-brand" />
                  )}
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-neutral-800 text-center line-clamp-1 group-hover:text-brand transition-colors">{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sale Section */}
      <FlashSaleSection />

      {/* Top Trending Section */}
      <div className="container mx-auto px-4 mb-20">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-200 pb-4">
          <div className="flex flex-col items-center md:items-start mb-6 md:mb-0">
            <h2 className="text-base md:text-lg font-black text-gray-900 tracking-tight">Trending Products</h2>
            <div className="h-0.5 w-6 bg-brand mt-1 rounded-full"></div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4 md:gap-5 justify-center md:justify-end">
            <button
              onClick={() => setActiveTab('All')}
              className={`text-[8px] md:text-[8.5px] font-black uppercase tracking-widest transition-all hover:text-brand relative py-2 ${activeTab === 'All' ? 'text-brand' : 'text-gray-400'}`}
            >
              All
              {activeTab === 'All' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-full"></span>}
            </button>
            {trendingCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.name)}
                className={`text-[8px] md:text-[8.5px] font-black uppercase tracking-widest transition-all hover:text-brand relative py-2 ${activeTab === cat.name ? 'text-brand' : 'text-gray-400'}`}
              >
                {cat.name}
                {activeTab === cat.name && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-full"></span>}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5].map((item) => (
                <ProductSkeleton key={item} />
              ))}
            </div>
          ) : getFilteredProducts().length > 0 ? (
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={16}
              slidesPerView={2}
              breakpoints={{
                640: { slidesPerView: 2, spaceBetween: 20 },
                768: { slidesPerView: 3, spaceBetween: 24 },
                1024: { slidesPerView: 4, spaceBetween: 24 },
                1280: { slidesPerView: 5, spaceBetween: 28 },
              }}
              navigation={false}
              pagination={{
                clickable: true,
                renderBullet: function (index, className) {
                  return '<span class=""></span>';
                },
              }}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              className="py-4 trending-swiper"
            >
              {getFilteredProducts().slice(0, 10).map((product: any) => (
                <SwiperSlide key={product.id}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              </div>
              <p className="text-gray-500 font-bold">{t('no_products_found')}</p>
            </div>
          )}
        </div>
      </div>


      {/* Dual Promo Banners */}
      <div className="container mx-auto px-4 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {promoBanners.slice(0, 2).map((banner) => (
            <Link to={banner.link || '#'} key={banner.id} className="relative h-[220px] md:h-[300px] lg:h-[350px] rounded-3xl overflow-hidden group shadow-xl block">
              {banner.image ? (
                <img src={resolveImageUrl(banner.image)} alt={banner.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-gray-400">No Image</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex flex-col justify-center p-8 md:p-12">
                <h3 className="text-base md:text-xl font-black text-white mb-3 leading-tight max-w-[85%] transform transition-transform group-hover:-translate-y-1 hover:underline">{banner.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-neutral-900">Latest Products</h2>
            <p className="text-sm text-neutral-500">Discover the latest items</p>
          </div>
          <Link to="/products" className="text-brand font-bold text-sm flex items-center space-x-1 group">
            <span>Explore Products</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {productsLoading ? (
            Array.from({ length: 10 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))
          ) : products ? (
            products
              .filter((product: any) => product.stock !== undefined ? product.stock > 0 : true)
              .slice(0, 25)
              .map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))
          ) : null}
        </div>
      </section>

      {/* Blogs Section */}
      {blogs && blogs.length > 0 && (
        <section className="space-y-8 py-10 border-t border-neutral-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-neutral-900 uppercase tracking-tight">Blogs</h2>
              <p className="text-sm text-neutral-500">Our Latest Blogs</p>
            </div>

            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6">
              {/* Carousel controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const el = document.getElementById('blog-carousel');
                    if (el) el.scrollBy({ left: -360, behavior: 'smooth' });
                  }}
                  className="w-10 h-10 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 rounded-full flex items-center justify-center border border-neutral-100/80 shadow-sm transition-all active:scale-95 hover:scale-105"
                  aria-label="Previous blogs"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('blog-carousel');
                    if (el) el.scrollBy({ left: 360, behavior: 'smooth' });
                  }}
                  className="w-10 h-10 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 rounded-full flex items-center justify-center border border-neutral-100/80 shadow-sm transition-all active:scale-95 hover:scale-105"
                  aria-label="Next blogs"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <Link to="/blogs" className="text-brand font-bold text-sm flex items-center space-x-1 group">
                <span>View All Articles</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="relative">
            <div
              id="blog-carousel"
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 scroll-smooth no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`
                #blog-carousel::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {blogs.slice(0, 12).map((post: any) => (
                <div
                  key={post.id}
                  className="w-[85%] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)] flex-shrink-0 snap-start"
                >
                  <BlogCard post={post} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;