import React, { useState, useEffect, useRef } from 'react';
import { 
    ShieldCheck, 
    ChevronDown, 
    Star, 
    CheckCircle2, 
    ArrowRight, 
    Clock, 
    Phone, 
    MapPin, 
    Zap, 
    Award, 
    Check, 
    ShoppingCart,
    RefreshCcw
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const StepFunnelLayout = ({
    product,
    formData,
    handleChange,
    handleSubmit,
    submitting,
    districts,
    upazilas,
    shippingZones,
    finalTotal,
    subtotal,
    shippingCost,
    selectedZone,
    selectedVariants,
    handleVariantQuantityChange,
    handleVariantSelect,
    siteSettings,
    funnel,
}) => {
    const { t, language } = useLanguage();
    const submitBtnRef = useRef(null);
    const formRef = useRef(null);
    const [showMobileCTA, setShowMobileCTA] = useState(false);

    const whyBuyFromUs = [
        "সারা বাংলাদেশে ক্যাশ অন ডেলিভারি",
        "পন্য দেখে টাকা পরিশোধের সুযোগ",
        "৭ দিনের ইজি রিপ্লেসমেন্ট গ্যারান্টি",
        "১০০% জেনুইন ও আসল পণ্য",
        "২৪/৭ ডেডিকেটেড কাস্টমার সাপোর্ট"
    ];

    const dynamicWhyBuyList = funnel?.features_list
        ? funnel.features_list.split('\n').map(item => item.trim()).filter(Boolean)
        : whyBuyFromUs;

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowMobileCTA(!entry.isIntersecting);
            },
            { threshold: 0.1 }
        );

        if (formRef.current) {
            observer.observe(formRef.current);
        }

        return () => {
            if (formRef.current) {
                observer.unobserve(formRef.current);
            }
        };
    }, []);

    const allImages = [];
    if (product.images?.[0]?.image) allImages.push(product.images[0].image);
    if (product.images && product.images.length > 0) {
        product.images.forEach(img => {
            if (img.image !== product.images?.[0]?.image) {
                allImages.push(img.image);
            }
        });
    }

    return (
        <div className="bg-[#0b0f19] min-h-screen font-sans text-slate-100 selection:bg-brand selection:text-white">
            {/* Urgency Header */}
            <div className="bg-gradient-to-r from-brand to-[#8A3D15] text-white py-3 px-4 text-center text-xs font-black tracking-widest uppercase flex items-center justify-center gap-3 animate-pulse sticky top-0 z-50">
                <Zap size={14} fill="currentColor" />
                <span>{funnel?.top_header_line_1 || "ফ্ল্যাশ সেল চলছে - আজই অর্ডার করুন এবং সাশ্রয় করুন!"}</span>
                <Zap size={14} fill="currentColor" />
            </div>

            <main className="container mx-auto px-4 py-8 lg:py-16 max-w-6xl">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
                    
                    {/* Left: Product Media & Info */}
                    <div className="lg:w-1/2 space-y-10">
                        {/* Immersive Gallery */}
                        <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 border border-white/10 shadow-2xl group">
                            <div className="absolute top-6 left-6 z-10 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                                <span className="text-[10px] font-black uppercase tracking-widest">In Stock</span>
                            </div>
                            
                            {allImages.length > 1 ? (
                                <Swiper
                                    modules={[Navigation, Pagination, Autoplay, EffectFade]}
                                    effect="fade"
                                    navigation
                                    pagination={{ clickable: true }}
                                    autoplay={{ delay: 4000, disableOnInteraction: false }}
                                    loop={true}
                                    className="w-full aspect-square"
                                >
                                    {allImages.map((img, idx) => (
                                        <SwiperSlide key={idx}>
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            ) : (
                                <div className="w-full aspect-square">
                                    <img src={product.images?.[0]?.image} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center space-y-3 group hover:border-brand/50 transition-colors">
                                <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                    <ChevronDown size={24} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ডেলিভারি</p>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">সারা বাংলাদেশে</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center space-y-3 group hover:border-brand/50 transition-colors">
                                <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                    <RefreshCcw size={24} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">রিপ্লেসমেন্ট</p>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">৭ দিনের গ্যারান্টি</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center space-y-3 group hover:border-brand/50 transition-colors hidden md:block">
                                <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                    <ShieldCheck size={24} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">পেমেন্ট</p>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">ক্যাশ অন ডেলিভারি</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white/5 border border-white/10 p-4 sm:p-8 rounded-3xl sm:rounded-[2.5rem] prose prose-invert max-w-none">
                            <h3 className="text-2xl font-black text-white mb-6 tracking-tighter">পণ্যের বিস্তারিত</h3>
                            <div dangerouslySetInnerHTML={{ __html: product.short_description }} className="text-slate-400 font-medium leading-relaxed product-description-content" />
                        </div>
                    </div>

                    {/* Right: Checkout Sidebar */}
                    <div className="lg:w-1/2">
                        <div className="bg-white/5 border border-white/10 rounded-3xl sm:rounded-[3rem] p-4 sm:p-8 md:p-12 shadow-2xl backdrop-blur-sm sticky top-24">
                            <div className="space-y-10">
                                <div>
                                    <div className="flex items-center gap-2 text-brand font-black text-xs uppercase tracking-[0.3em] mb-4">
                                        <Award size={16} /> Exclusive Premium Quality
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-6">
                                        {funnel?.title || product.name}
                                    </h2>
                                    <div className="flex items-center gap-6">
                                        <div className="text-4xl md:text-6xl font-black text-brand tracking-tighter">
                                            ৳{subtotal}
                                        </div>
                                        {product.regular_price > subtotal && (
                                            <div className="text-xl md:text-2xl text-white/20 line-through font-bold tracking-tighter">
                                                ৳{Math.floor(product.regular_price)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Feature List */}
                                <div className="space-y-4 pt-8 border-t border-white/10">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-brand mb-3">
                                        {funnel?.top_header_line_2 || "আমাদের বৈশিষ্ট্যসমূহ"}
                                    </h4>
                                    {dynamicWhyBuyList.map((reason, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-sm font-bold text-white/80">
                                            <CheckCircle2 size={18} className="text-brand shrink-0" /> {reason}
                                        </div>
                                    ))}
                                </div>

                                {/* Variant Selection */}
                                {selectedVariants?.length > 0 && selectedVariants[0].id !== 'default' && (
                                    <div className="space-y-4 pt-8 border-t border-white/10">
                                        <p className="text-xs font-black uppercase tracking-widest text-white/30">অপশন সিলেক্ট করুন</p>
                                        <div className="space-y-3">
                                            {selectedVariants.map((variant) => (
                                                <div
                                                    key={variant.id}
                                                    onClick={() => handleVariantSelect(variant.id)}
                                                    className={`cursor-pointer flex items-center justify-between p-2 sm:p-3.5 rounded-2xl border-2 transition-all gap-2 sm:gap-3 ${variant.quantity > 0 ? 'border-brand bg-brand/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                                                >
                                                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                                        <img src={variant.image} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover bg-white shrink-0" />
                                                        <span className="font-bold text-white text-xs sm:text-sm truncate w-full block">{[variant.color?.name, variant.size?.name].filter(Boolean).join(' ') || 'Standard'}</span>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                                                        <span className="font-black text-brand text-xs sm:text-sm">৳{Math.floor(variant.price)}</span>
                                                        <div className="flex items-center bg-black/40 rounded-xl border border-white/10 overflow-hidden">
                                                            <button type="button" onClick={() => handleVariantQuantityChange(variant.id, -1)} className="px-2.5 sm:px-4 py-1 sm:py-2 hover:bg-white/10 text-white font-black text-xs sm:text-sm">-</button>
                                                            <span className="px-2 sm:px-3 font-black text-white text-xs sm:text-sm min-w-[1.2rem] sm:min-w-[2rem] text-center">{variant.quantity}</span>
                                                            <button type="button" onClick={() => handleVariantQuantityChange(variant.id, 1)} className="px-2.5 sm:px-4 py-1 sm:py-2 hover:bg-white/10 text-white font-black text-xs sm:text-sm">+</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div id="order-form" ref={formRef} className="pt-8 border-t border-white/10">
                                    <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                                        অর্ডার করতে নিচের ফর্মটি পূরণ করুন
                                    </h3>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                name="customer_name"
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-6 py-3.5 sm:py-5 focus:border-brand outline-none transition-all font-bold placeholder-white/30"
                                                placeholder="আপনার নাম লিখুন"
                                                value={formData.customer_name}
                                                onChange={handleChange}
                                            />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <input
                                                    type="tel"
                                                    name="phone_number"
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-6 py-3.5 sm:py-5 focus:border-brand outline-none transition-all font-bold placeholder-white/30"
                                                    placeholder="মোবাইল নম্বর"
                                                    value={formData.phone_number}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <select
                                                name="district"
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-6 py-3.5 sm:py-5 focus:border-brand outline-none transition-all font-bold text-white"
                                                value={formData.district}
                                                onChange={handleChange}
                                            >
                                                <option value="" className="bg-slate-900">{t('select_district')}</option>
                                                {districts.map(d => {
                                                    const displayName = d.name.includes('|')
                                                        ? (language === 'bn' ? d.name.split('|')[0].trim() : d.name.split('|')[1].trim())
                                                        : d.name;
                                                    return <option key={d.id} value={d.id} className="bg-slate-900">{displayName}</option>;
                                                })}
                                            </select>
                                            <select
                                                name="upazila"
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-6 py-3.5 sm:py-5 focus:border-brand outline-none transition-all font-bold text-white disabled:opacity-50"
                                                value={formData.upazila}
                                                onChange={handleChange}
                                                disabled={!formData.district}
                                            >
                                                <option value="" className="bg-slate-900">{t('select_area')}</option>
                                                {upazilas.map(u => {
                                                    const displayName = u.name.includes('|')
                                                        ? (language === 'bn' ? u.name.split('|')[0].trim() : u.name.split('|')[1].trim())
                                                        : u.name;
                                                    return <option key={u.id} value={u.id} className="bg-slate-900">{displayName}</option>;
                                                })}
                                            </select>
                                        </div>

                                        <textarea
                                            name="address"
                                            required
                                            rows={2}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-6 py-3.5 sm:py-5 focus:border-brand outline-none transition-all font-bold placeholder-white/30 resize-none"
                                            placeholder="আপনার ঠিকানা, জেলা এবং থানাসহ বিস্তারিত লিখুন"
                                            value={formData.address}
                                            onChange={handleChange}
                                        />

                                        <textarea
                                            name="order_note"
                                            rows={1}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-6 py-3.5 sm:py-5 focus:border-brand outline-none transition-all font-bold placeholder-white/30 resize-none"
                                            placeholder="অর্ডার নোট (অপশনাল)"
                                            value={formData.order_note}
                                            onChange={handleChange}
                                        />

                                        {/* Order Summary Summary */}
                                        <div className="bg-white/5 rounded-2xl p-6 space-y-3 font-bold text-sm">
                                            <div className="flex justify-between text-white/50">
                                                <span>পণ্যের মূল্য</span>
                                                <span className="text-white">৳{subtotal}</span>
                                            </div>
                                            <div className="flex justify-between text-white/50">
                                                <span>ডেলিভারি চার্জ</span>
                                                <span className="text-white">৳{shippingCost}</span>
                                            </div>
                                            <div className="pt-3 border-t border-white/10 flex justify-between items-center text-lg">
                                                <span>সর্বমোট</span>
                                                <span className="text-2xl font-black text-brand">৳{finalTotal}</span>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full bg-brand hover:bg-brand text-white font-black text-2xl py-6 rounded-2xl shadow-2xl shadow-brand/20 transform transition-all active:scale-95 flex items-center justify-center gap-3 group disabled:opacity-70"
                                        >
                                            {submitting ? 'অর্ডার হচ্ছে...' : (
                                                <>অর্ডার কনফার্ম করুন <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" /></>
                                            )}
                                        </button>
                                        
                                        <p className="text-center text-[10px] uppercase tracking-widest text-white/30 font-black">
                                            100% Secure Checkout | Verified by Spaceghor
                                        </p>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Floating Mobile CTA */}
            <AnimatePresence>
                {showMobileCTA && (
                    <motion.div 
                        initial={{ y: 100 }} 
                        animate={{ y: 0 }} 
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 lg:hidden z-50"
                    >
                        <a 
                            href="#order-form" 
                            className="w-full bg-brand text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-2xl shadow-brand/30"
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            <ShoppingCart size={20} /> অর্ডার করুন - ৳{finalTotal}
                        </a>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Customer Reviews Section (Funnel Sections as Carousel) */}
            {product.funnel_sections && product.funnel_sections.length > 0 && (
                <div className="py-20 bg-[#0b0f19]">
                    <div className="container mx-auto px-4 max-w-5xl">
                        {/* Orange Header Bar */}
                        <div className="bg-[#FF6B00] rounded-t-[2rem] py-6 text-center shadow-2xl">
                            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase">
                                আমাদের কাস্টমার রিভিউ
                            </h2>
                        </div>

                        {/* Carousel Container */}
                        <div className="bg-white p-4 md:p-8 shadow-2xl relative overflow-hidden">
                            <Swiper
                                modules={[Navigation, Pagination, Autoplay]}
                                spaceBetween={20}
                                slidesPerView={1}
                                breakpoints={{
                                    640: { slidesPerView: 2 },
                                    1024: { slidesPerView: 3 },
                                }}
                                navigation
                                pagination={{ clickable: true }}
                                autoplay={{ delay: 3000, disableOnInteraction: false }}
                                className="pb-12"
                            >
                                {product.funnel_sections.map((section, idx) => (
                                    <SwiperSlide key={section.id || idx}>
                                        <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 h-full flex flex-col items-center justify-center p-3">
                                            {section.image ? (
                                                <img 
                                                    src={section.image} 
                                                    alt={section.title || "Review Screenshot"} 
                                                    className="w-auto h-auto max-h-[500px] object-contain rounded-xl mx-auto" 
                                                />
                                            ) : (
                                                <div className="w-full aspect-[9/16] max-h-[500px] bg-slate-200 flex items-center justify-center rounded-xl">
                                                    <Zap className="text-slate-400" size={48} />
                                                </div>
                                            )}
                                            
                                            {(section.title || section.text) && (
                                                <div className="p-4 text-center w-full">
                                                    {section.title && <h3 className="font-bold text-slate-900 mb-2">{section.title}</h3>}
                                                    {section.text && <p className="text-sm text-slate-500">{section.text}</p>}
                                                </div>
                                            )}
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>

                        {/* Blue Button Bar */}
                        <div className="bg-[#2563EB] rounded-b-[2rem] py-6 text-center shadow-2xl">
                            <button 
                                onClick={() => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' })}
                                className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase animate-bounce flex items-center justify-center gap-3 mx-auto"
                            >
                                <ShoppingCart size={24} /> অর্ডার করতে ক্লিক করুন
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="py-12 bg-[#080b12] border-t border-white/5 text-center">
                <div className="container mx-auto px-4">
                    <div className="text-xl font-black text-slate-300 mb-4 tracking-tighter uppercase">Spaceghor</div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">&copy; 2026 Spaceghor. Developed by <a href="https://ctsolutionbd.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors">Cyber and Tech Solution</a>.</p>
                </div>
            </footer>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .swiper-pagination-bullet-active { background: #C0561F !important; }
                .swiper-button-next, .swiper-button-prev { color: #C0561F !important; }
            `}} />
        </div>
    );
};

export default StepFunnelLayout;
