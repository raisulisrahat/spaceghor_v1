import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Truck, Star, CheckCircle, ArrowRight, Clock, Phone, MapPin, Zap, Award, ShoppingCart } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
import { useLanguage } from '../../context/LanguageContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { resolveImageUrl } from '../../utils/image';

const ClassicFunnelLayout = ({
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
    hideSalesCopy = false
}) => {
    const { t, language } = useLanguage();
    const [isHovered, setIsHovered] = useState(false);
    const [shippingError, setShippingError] = useState('');

    // Active Variant for Summary and display
    const activeVariant = selectedVariants?.find(v => v.quantity > 0) || selectedVariants?.[0];

    const toBanglaNumber = (num) => {
        if (num === undefined || num === null) return '';
        const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return num.toString().replace(/\d/g, d => banglaDigits[d]);
    };

    const handlePhoneChange = (e) => {
        const cleaned = e.target.value.replace(/\D/g, '');
        const limited = cleaned.slice(0, 11);
        
        handleChange({
            ...e,
            target: {
                ...e.target,
                name: 'phone_number',
                value: limited
            }
        });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        
        const phone = formData.phone_number || '';
        const cleanPhone = phone.replace(/\D/g, '');
        
        if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
            alert(language === 'bn' 
                ? 'দয়া করে একটি সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।' 
                : 'Please enter a valid 11-digit mobile number starting with 01 (e.g. 017XXXXXXXX).'
            );
            return;
        }

        if (!formData.shipping_zone) {
            setShippingError(language === 'bn' ? 'দয়া করে শিপিং এলাকা নির্বাচন করুন।' : 'Please select the shipping area.');
            document.getElementsByName('shipping_zone')[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setShippingError('');
        handleSubmit(e);
    };

    useEffect(() => {
        if (formData.shipping_zone) {
            setShippingError('');
        }
    }, [formData.shipping_zone]);

    // Observer for Mobile CTA
    const submitBtnRef = useRef(null);
    const [showMobileCTA, setShowMobileCTA] = useState(true);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Hide CTA when submit button is visible
                setShowMobileCTA(!entry.isIntersecting);
            },
            { threshold: 0.1 }
        );

        if (submitBtnRef.current) {
            observer.observe(submitBtnRef.current);
        }

        return () => {
            if (submitBtnRef.current) {
                observer.unobserve(submitBtnRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (hideSalesCopy) return;

        const ctx = gsap.context(() => {
            // Hero typography and CTA buttons are rendered statically to ensure instant visibility,
            // 100% conversion stability, and prevent any GSAP/JS load delay or invisibility issues.


            // Why Buy Checklist staggered entrance (on scroll)
            gsap.from(".feature-card", {
                scrollTrigger: {
                    trigger: ".why-buy-section",
                    start: "top 80%",
                    toggleActions: "play none none none"
                },
                opacity: 0,
                y: 30,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out"
            });

            // Review Swiper entrance (on scroll)
            gsap.from(".review-swiper-container", {
                scrollTrigger: {
                    trigger: ".review-swiper-container",
                    start: "top 85%",
                    toggleActions: "play none none none"
                },
                opacity: 0,
                y: 40,
                scale: 0.98,
                duration: 1,
                ease: "power3.out"
            });

            // Order Form entrance (on scroll)
            gsap.from(".checkout-form-container", {
                scrollTrigger: {
                    trigger: ".checkout-form-container",
                    start: "top 80%",
                    toggleActions: "play none none none"
                },
                opacity: 0,
                y: 50,
                scale: 0.98,
                duration: 1,
                ease: "power3.out"
            });
        });

        return () => ctx.revert();
    }, [hideSalesCopy]);

    const whyBuyFromUs = [
        "100% Secure Checkout | Cash on Delivery",
        "Fast & Trackable Home Delivery",
        "100% Genuine Brand Products",
        "7 Days Money Back Guarantee",
        "Priority Customer Support Available"
    ];

    const dynamicWhyBuyList = funnel?.features_list
        ? funnel.features_list.split('\n').map(item => item.trim()).filter(Boolean)
        : whyBuyFromUs;

    if (hideSalesCopy) {
        return (
            <div id="order-form" className="py-2 relative overflow-hidden bg-white rounded-3xl">
                <div className="container mx-auto px-4 max-w-4xl relative z-10">
                    <div className="bg-slate-900 border border-white/20 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                        <div className="bg-gradient-to-r from-[#D97706] via-[#C0561F] to-[#B45309] p-5 text-center shadow-md relative z-10">
                            <p className="font-black text-white uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2">
                                <Zap size={14} /> {t('cash_on_delivery')} <Zap size={14} />
                            </p>
                        </div>

                        <div className="p-6 md:p-10 relative z-10">
                            <form onSubmit={handleFormSubmit} className="space-y-6">
                                {/* Name and Phone */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2 text-left">
                                        <label className="block text-[10px] font-black text-white uppercase tracking-[0.2em] ml-2 opacity-70">{t('full_name')} <span className="text-red-400">*</span></label>
                                        <input
                                            type="text"
                                            name="customer_name"
                                            required
                                            className="w-full px-5 py-4 bg-white/5 border border-white/20 rounded-2xl focus:border-brand focus:bg-white/10 text-white placeholder-slate-500 outline-none font-medium transition-all"
                                            placeholder={t('full_name')}
                                            value={formData.customer_name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <label className="block text-[10px] font-black text-white uppercase tracking-[0.2em] ml-2 opacity-70">{t('phone_number')} <span className="text-red-400">*</span></label>
                                        <input
                                            type="tel"
                                            name="phone_number"
                                            required
                                            className="w-full px-5 py-4 bg-white/5 border border-white/20 rounded-2xl focus:border-brand focus:bg-white/10 text-white placeholder-slate-500 outline-none font-medium transition-all"
                                            placeholder="017XXXXXXXX"
                                            value={formData.phone_number}
                                            onChange={handlePhoneChange}
                                        />
                                    </div>
                                </div>

                                {/* Variant Selection */}
                                {selectedVariants?.length > 0 && selectedVariants[0].id !== 'default' && (
                                    <div className="space-y-3 text-left">
                                        <label className="block text-[10px] font-black text-white uppercase tracking-[0.2em] ml-2 opacity-70">{t('select_variant')}</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {selectedVariants.map((variant) => (
                                                <div
                                                    key={variant.id}
                                                    onClick={() => handleVariantSelect(variant.id)}
                                                    className={`cursor-pointer flex items-center justify-between p-3 rounded-2xl border-2 transition-all duration-300 ${variant.quantity > 0 ? 'border-brand bg-white/10 shadow-[0_0_15px_rgba(81, 115, 251,0.2)]' : 'border-white/5 bg-black/20 hover:border-white/20'}`}
                                                >
                                                   <div className="flex items-center gap-4">
                                                       {/* Radio Bullet Indicator */}
                                                       <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${variant.quantity > 0 ? 'border-brand bg-white/10' : 'border-white/20'}`}>
                                                           <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${variant.quantity > 0 ? 'bg-brand scale-100' : 'bg-transparent scale-0'}`} />
                                                       </div>
                                                       <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0">
                                                           <img src={variant.image} className="w-full h-full object-cover" alt={variant.color?.name} onError={(e) => { e.target.src = product.images?.[0]?.image || ''; }} loading="eager" fetchPriority="high" />
                                                       </div>
                                                       <span className="text-white font-bold text-sm tracking-tight">{variant.color?.name || variant.size?.name}</span>
                                                   </div>
                                                   <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                                                       <span className="text-brand font-black">৳{variant.price}</span>
                                                       <div className="flex items-center bg-black/40 rounded-lg border border-white/10 overflow-hidden">
                                                            <button type="button" onClick={() => handleVariantQuantityChange(variant.id, -1)} className="px-3 py-1 text-white hover:bg-white/20">-</button>
                                                            <span className="px-2 text-white font-bold text-xs">{variant.quantity}</span>
                                                            <button type="button" onClick={() => handleVariantQuantityChange(variant.id, 1)} className="px-3 py-1 text-white hover:bg-white/20">+</button>
                                                       </div>
                                                   </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Address Section */}
                                {siteSettings?.enable_district_upazila !== false && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 text-left">
                                            <label className="block text-[10px] font-black text-white uppercase tracking-[0.2em] ml-2 opacity-70">{t('district')}</label>
                                            <select
                                                name="district"
                                                required
                                                className="w-full px-5 py-4 bg-slate-800 text-white border border-white/20 rounded-2xl outline-none"
                                                value={formData.district}
                                                onChange={handleChange}
                                            >
                                                <option value="">{t('select_district')}</option>
                                                {districts.map(dist => (
                                                    <option key={dist.id} value={dist.id}>{dist.name.split('|')[language === 'bn' ? 0 : 1] || dist.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2 text-left">
                                            <label className="block text-[10px] font-black text-white uppercase tracking-[0.2em] ml-2 opacity-70">{t('area_upazila')}</label>
                                            <select
                                                name="upazila"
                                                required
                                                className="w-full px-5 py-4 bg-slate-800 text-white border border-white/20 rounded-2xl outline-none"
                                                value={formData.upazila}
                                                onChange={handleChange}
                                                disabled={!formData.district}
                                            >
                                                <option value="">{t('select_area')}</option>
                                                {upazilas.map(upz => (
                                                    <option key={upz.id} value={upz.id}>{upz.name.split('|')[language === 'bn' ? 0 : 1] || upz.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 text-left">
                                    <label className="block text-[10px] font-black text-white uppercase tracking-[0.2em] ml-2 opacity-70">{t('address_details')}</label>
                                    <textarea
                                        name="address"
                                        required
                                        rows="2"
                                        className="w-full px-5 py-4 bg-white/5 border border-white/20 rounded-2xl text-white outline-none"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Order Summary */}
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mt-6 text-left">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-white/60 text-sm">{t('subtotal')}</span>
                                        <span className="text-white font-bold">৳{subtotal}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-white/60 text-sm">{t('shipping')}</span>
                                        <span className="text-brand font-bold">৳{shippingCost}</span>
                                    </div>
                                    <div className="h-px bg-white/10 mb-4" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-black text-lg">{t('total_amount')}</span>
                                        <span className="text-brand font-black text-3xl">৳{finalTotal}</span>
                                    </div>
                                </div>

                                <button
                                    ref={submitBtnRef}
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-gradient-to-r from-[#D97706] via-[#C0561F] to-[#B45309] py-6 rounded-2xl text-white font-black text-2xl uppercase tracking-tighter hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand/20 disabled:opacity-50"
                                >
                                    {submitting ? '...' : t('place_order')}
                                </button>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center mt-4">100% Secure Checkout | Cash on Delivery</p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-800 overflow-x-hidden">
            <div className="bg-brand text-white py-3 px-4 shadow-md relative z-30 border-b border-white/10">
                <div className="max-w-xl mx-auto flex items-center gap-4">
                    <Zap size={16} className="text-white fill-white shrink-0 animate-pulse" />
                    <div className="whitespace-pre-line text-center text-xs sm:text-sm font-black leading-relaxed tracking-wide flex-1 uppercase">
                        {funnel?.top_header_line_1}
                    </div>
                    <Zap size={16} className="text-white fill-white shrink-0 animate-pulse" />
                </div>
            </div>
            {/* Animated Gradient Hero Section */}
            <div className="relative pb-20 pt-16 overflow-hidden">
                <div className="container mx-auto px-4 z-10 relative lg:flex lg:items-center lg:gap-16 max-w-7xl">
                    {/* Left Typography Side */}
                    <div className="lg:w-1/2 mb-12 lg:mb-0 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-700/80 backdrop-blur-md text-white font-bold text-sm mb-8 border border-white/30 shadow-xl  hero-badge">
                            <span className="uppercase tracking-widest text-md">{funnel?.top_header_line_1}</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black/80 leading-[1.1] mb-6 drop-shadow-md hero-title">
                            {product.name}
                        </h1>
                        <button onClick={() => document.getElementById('order-form').scrollIntoView({ behavior: 'smooth' })}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            className="group relative hidden lg:inline-flex items-center justify-center bg-brand hover:bg-[#3a5bd9] text-white font-black text-xl lg:text-2xl py-5 px-10 rounded-full shadow-[0_0_40px_rgba(81, 115, 251,0.5)] transform transition-all duration-300 hover:scale-105 active:scale-95 w-full sm:w-auto overflow-hidden hero-cta">
                            <span className="relative z-10 flex items-center gap-2">
                                {t('secure_your_order')} <ArrowRight className={`transition-transform duration-300 ${isHovered ? 'translate-x-2' : ''}`} />
                            </span>
                        </button>
                    </div>

                    {/* Right Image Side */}
                    <div className="lg:w-1/2 relative group hero-gallery max-w-[85%] sm:max-w-[450px] lg:max-w-none mx-auto w-full">
                        <div className="relative transform transition-transform duration-500">
                            <div className="absolute inset-0 bg-white rounded-3xl blur-2xl opacity-20 transition-opacity duration-500"></div>
                            {(() => {
                                const allImages = [];
                                if (product.images?.[0]?.image) allImages.push(product.images[0].image);
                                if (product.images && product.images.length > 0) {
                                    product.images.forEach(img => {
                                        if (img.image !== product.images?.[0]?.image) {
                                            allImages.push(img.image);
                                        }
                                    });
                                }

                                if (allImages.length > 1) {
                                    return (
                                        <div className="relative w-full rounded-3xl shadow-2xl border-4 border-white/20 overflow-hidden z-10 aspect-square md:aspect-auto">
                                            <Swiper
                                                modules={[Navigation, Pagination, Autoplay, EffectFade]}
                                                effect="fade"
                                                navigation
                                                pagination={{ clickable: true }}
                                                autoplay={{ delay: 3000, disableOnInteraction: false }}
                                                loop={true}
                                                className="w-full h-full"
                                            >
                                                {allImages.map((imgUrl, idx) => (
                                                    <SwiperSlide key={idx}>
                                                        <img src={imgUrl} alt={`${product.name} - ${idx + 1}`} className="w-full h-full object-cover" loading="eager" />
                                                    </SwiperSlide>
                                                ))}
                                            </Swiper>
                                            <style dangerouslySetInnerHTML={{
                                                __html: `
                                                .swiper-button-next, .swiper-button-prev { color: white !important; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); transform: scale(0.7); }
                                                .swiper-pagination-bullet { background: white !important; opacity: 0.5 !important; }
                                                .swiper-pagination-bullet-active { background: var(--color-brand) !important; opacity: 1 !important; }
                                                @media (max-width: 768px) {
                                                    .swiper-button-next, .swiper-button-prev { display: none !important; }
                                                }
                                            `}} />
                                        </div>
                                    );
                                }

                                return (
                                    <img src={product.images?.[0]?.image || ''} alt={product.name} className="relative w-full rounded-3xl shadow-2xl border-4 border-white/20 object-cover z-10 aspect-square md:aspect-auto" loading="eager" />
                                );
                            })()}
                            {/* Floating Badges */}
                            <div className="absolute bottom-2 left-2 md:-bottom-6 md:-left-12 bg-white/90 backdrop-blur p-3 sm:p-4 rounded-2xl shadow-xl flex items-center gap-2 sm:gap-4 z-20 animate-bounce delay-100 border border-white/50 scale-[0.75] sm:scale-90 md:scale-100 origin-bottom-left">
                                <div className="bg-green-500 p-2 sm:p-3 rounded-xl text-white shadow-inner"><Award size={20} className="sm:w-6 sm:h-6" /></div>
                                <div>
                                    <p className="font-black text-slate-900 text-sm sm:text-lg">{t('premium')}</p>
                                    <p className="text-[10px] sm:text-sm font-bold text-slate-500 uppercase">{t('quality')}</p>
                                </div>
                            </div>
                            <div className="absolute top-2 right-2 md:-top-6 md:-right-6  flex items-center gap-2 sm:gap-4 z-20 animate-bounce delay-300 scale-[0.75] sm:scale-90 md:scale-100 origin-top-right">
                                <div>
                                    {product.sale_price && (
                                <div className="bg-brand text-white px-4 py-2 rounded-xl font-black text-lg shadow-lg border-2 border-red-400 rotate-[-3deg] animate-pulse">
                                    {t('save_discount')} {Math.round(((product.regular_price - product.sale_price) / product.regular_price) * 100)}%
                                </div>
                            )}                                </div>
                            </div>
                        </div>
                        {/* Mobile-only CTA Button below the Hero Image */}
                        <div className="block lg:hidden mt-8 text-center px-4 w-full">
                            <button onClick={() => document.getElementById('order-form').scrollIntoView({ behavior: 'smooth' })}
                                className="w-full group relative inline-flex items-center justify-center bg-brand hover:bg-[#3a5bd9] text-white font-black text-xl py-5 px-10 rounded-full shadow-[0_0_40px_rgba(81, 115, 251,0.5)] transform transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden">
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {t('secure_your_order')} <ArrowRight className="transition-transform duration-300 group-hover:translate-x-2" />
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Animated Pricing Banners (Only for ClassicFunnelLayout) */}
            <div className="w-full shadow-2xl relative z-20">
                {/* Orange Strip */}
                <div className="bg-gradient-to-r from-[#D97706] via-[#C0561F] to-[#B45309] py-5 text-center text-white font-black text-2xl md:text-3xl tracking-wide border-b border-black/10 shadow-lg">
                    <span className="flex items-center justify-center gap-1 md:gap-3 flex-wrap">
                        {language === 'bn' ? 'রেগুলার প্রাইস আগে ছিলো:' : 'Regular Price Was Before:'}
                        <span className="relative inline-flex items-center justify-center px-4 py-1">
                            <svg className="absolute inset-0 w-full h-full text-red-600 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <line x1="5" y1="15" x2="95" y2="85" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="animate-draw-line-1" />
                                <line x1="95" y1="15" x2="5" y2="85" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="animate-draw-line-2" />
                            </svg>
                            <span className="relative z-10 text-white font-black drop-shadow-md">
                                ৳{language === 'bn' ? toBanglaNumber(Math.floor(product.regular_price)) : Math.floor(product.regular_price)}
                            </span>
                        </span>
                        {language === 'bn' ? 'টাকা।' : 'Taka.'}
                    </span>
                </div>

                {/* Green Strip */}
                <div className="bg-gradient-to-r from-[#065F46] via-[#059669] to-[#065F46] py-6 text-center text-white font-black text-3xl md:text-4xl tracking-wide shadow-inner">
                    <span className="flex items-center justify-center gap-1 md:gap-3 flex-wrap">
                        {language === 'bn' ? 'বর্তমান ডিসকাউন্ট প্রাইস মাত্র' : 'Current Discount Price Only'}
                        <span className="relative inline-block px-6 py-2 mx-2">
                            <svg className="absolute inset-0 w-full h-full text-white pointer-events-none" viewBox="0 0 100 40" preserveAspectRatio="none">
                                <path
                                    d="M 4,20 C 4,4 96,4 96,20 C 96,36 4,36 4,20 Z"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    className="animate-draw-circle"
                                />
                            </svg>
                            <span className="relative z-10 text-yellow-300 font-extrabold drop-shadow-[0_0_15px_rgba(253,224,71,0.6)]">
                                ৳{language === 'bn' ? toBanglaNumber(Math.floor(product.sale_price || product.regular_price)) : Math.floor(product.sale_price || product.regular_price)}
                            </span>
                        </span>
                        {language === 'bn' ? 'টাকা।' : 'Taka.'}
                    </span>
                </div>
            </div>

            {/* Custom Keyframes embedded via inline style for tailwind classes if needed, but we can just use tailwind default or we'll define a quick style block */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                @keyframes draw-line-1 {
                    0% { stroke-dashoffset: 150; opacity: 0; }
                    1% { stroke-dashoffset: 150; opacity: 1; }
                    12% { stroke-dashoffset: 0; opacity: 1; }
                    80% { stroke-dashoffset: 0; opacity: 1; }
                    85% { stroke-dashoffset: 150; opacity: 0; }
                    100% { stroke-dashoffset: 150; opacity: 0; }
                }
                @keyframes draw-line-2 {
                    0% { stroke-dashoffset: 150; opacity: 0; }
                    10% { stroke-dashoffset: 150; opacity: 1; }
                    22% { stroke-dashoffset: 0; opacity: 1; }
                    80% { stroke-dashoffset: 0; opacity: 1; }
                    85% { stroke-dashoffset: 150; opacity: 0; }
                    100% { stroke-dashoffset: 150; opacity: 0; }
                }
                @keyframes draw-circle {
                    0% { stroke-dashoffset: 400; opacity: 0; }
                    16% { stroke-dashoffset: 400; opacity: 1; }
                    46% { stroke-dashoffset: 0; opacity: 1; }
                    80% { stroke-dashoffset: 0; opacity: 1; }
                    85% { stroke-dashoffset: 400; opacity: 0; }
                    100% { stroke-dashoffset: 400; opacity: 0; }
                }
                .animate-draw-line-1 {
                    stroke-dasharray: 150;
                    stroke-dashoffset: 150;
                    animation: draw-line-1 5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                .animate-draw-line-2 {
                    stroke-dasharray: 150;
                    stroke-dashoffset: 150;
                    animation: draw-line-2 5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                .animate-draw-circle {
                    stroke-dasharray: 400;
                    stroke-dashoffset: 400;
                    animation: draw-circle 5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                .perspective-1000 { perspective: 1000px; }
                .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.5); }
            `}} />

            {/* Why Buy Checklist */}
            <div className="my-12 py-10bg-white why-buy-section">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center mb-6">
                    <p className="text-xl md:text-2xl font-black tracking-tight uppercase">
                                    {funnel?.top_header_line_2}
                                </p>
                        </div>        
                    <div className="text-center mb-12 px-6 py-2 bg-gradient-to-r from-[#D97706] via-[#C0561F] to-[#B45309] rounded-[2rem] shadow-xl shadow-brand/10 text-white">
                        <h4 className="text-lg md:text-2xl font-black text-white mb-2">{funnel?.top_header_line_3}</h4>
                        <div className="w-24 h-1.5 bg-yellow-300 mx-auto rounded-full shadow-[0_0_10px_rgba(253,224,71,0.8)]"></div>
                    </div>
                    <div className=" grid gap-1">
                        {dynamicWhyBuyList.map((reason, idx) => (
                            <div key={idx} className="flex items-center gap-2 feature-card">
                                <span className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
                                    <CheckCircle size={20} />
                                </span>
                                <span className="font-bold text-slate-900 text-base">{reason}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Additional Funnel Sections as Carousel */}
            {product.funnel_sections && product.funnel_sections.length > 0 && (
                <div className="py-24 bg-slate-50 border-y border-slate-200">
                    <div className="container mx-auto px-4 max-w-6xl">
                        {/* Section Header */}
                        <div className="text-center mb-16 space-y-4">
                            <div className="bg-gradient-to-r from-[#D97706] via-[#C0561F] to-[#B45309] text-white px-8 py-4 rounded-3xl inline-block shadow-2xl transform -rotate-1">
                                <h5 className="text-xl md:text-2xl font-black tracking-tight uppercase">
                                    আমাদের কাস্টমার রিভিউ
                                </h5>
                            </div>
                        </div>

                        <div className="relative review-swiper-container">
                            <Swiper
                                modules={[Navigation, Pagination, Autoplay]}
                                spaceBetween={30}
                                slidesPerView={1}
                                breakpoints={{
                                    640: { slidesPerView: 2 },
                                    1024: { slidesPerView: 3 },
                                }}
                                navigation
                                pagination={{ clickable: true }}
                                autoplay={{ delay: 3000, disableOnInteraction: false }}
                                className="pb-16"
                            >
                                <style dangerouslySetInnerHTML={{
                                    __html: `
                                    .review-swiper-container .swiper-pagination {
                                        bottom: 0px !important;
                                    }
                                    .review-swiper-container .swiper-pagination-bullet {
                                        width: 8px !important;
                                        height: 8px !important;
                                        background: #cbd5e1 !important;
                                        opacity: 1 !important;
                                        margin: 0 5px !important;
                                        border-radius: 50% !important;
                                        transition: all 0.3s ease !important;
                                    }
                                    .review-swiper-container .swiper-pagination-bullet-active {
                                        background: #000000 !important;
                                        opacity: 1 !important;
                                        width: 8px !important;
                                        border-radius: 50% !important;
                                    }
                                `}} />
                                {product.funnel_sections.map((section, idx) => (
                                    <SwiperSlide key={section.id || idx}>
                                        <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 h-full flex flex-col items-center justify-center p-3 group">
                                            <div className="relative overflow-hidden rounded-xl w-full flex items-center justify-center bg-slate-50">
                                                {section.image ? (
                                                    <img src={section.image} alt={section.title} className="w-auto h-auto max-h-[500px] object-contain rounded-xl mx-auto transition-transform duration-700 group-hover:scale-105" loading="eager" />
                                                ) : (
                                                    <div className="w-full aspect-[9/16] max-h-[500px] bg-slate-900 flex items-center justify-center rounded-xl">
                                                        <Zap className="text-white/20" size={48} />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {(section.title || section.text) && (
                                                <div className="p-6 text-center w-full">
                                                    {section.title && <h3 className="font-black text-slate-900 text-lg mb-2 leading-tight">{section.title}</h3>}
                                                    {section.text && <p className="text-slate-500 font-bold text-xs leading-relaxed">{section.text}</p>}
                                                </div>
                                            )}
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>

                        {/* Order CTA */}
                        <div className="mt-10 text-center">
                            <button 
                                onClick={() => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' })}
                                className="bg-gradient-to-r from-[#D97706] via-[#C0561F] to-[#B45309] text-white px-8 py-5 rounded-full text-md md:text-xl font-black shadow-2xl shadow-brand/30 transform transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4 mx-auto uppercase tracking-tighter"
                            >
                                <ShoppingCart size={20} /> অর্ডার করতে ক্লিক করুন
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Glassmorphism Order Form Section */}
            <div id="order-form" className="py-12 relative overflow-hidden bg-[#0a0a0a]/90">
                <div className="container mx-auto px-4 max-w-4xl relative z-10 checkout-form-container">
                    <div className="text-center text-white mb-8 sm:mb-12">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-6 drop-shadow-md">{t('fill_form_to_order')}</h2>
                    </div>

                    {/* Glassmorphism Card */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                        {/* Shimmer Effect */}
                        <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] animate-[shimmer_3s_infinite]"></div>
            
                        <div className="bg-gradient-to-r p-3 sm:p-5 text-center shadow-md relative z-10">
                            {/* Variant Selection List */}
                                {selectedVariants?.length > 0 && selectedVariants[0].id !== 'default' && (
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm space-y-4">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                                            {t('select_variant')} <span className="text-red-400">*</span>
                                        </h3>
                                        <div className="space-y-3">
                                            {selectedVariants.map((variant) => (
                                                <div
                                                    key={variant.id}
                                                    onClick={() => handleVariantSelect(variant.id)}
                                                    className={`cursor-pointer flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-300 ${variant.quantity > 0 ? 'border-brand bg-white/10 shadow-[0_0_15px_rgba(81, 115, 251,0.2)]' : 'border-white/10 bg-black/20 hover:border-white/30 hover:bg-white/5'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        {/* Radio Bullet Indicator */}
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${variant.quantity > 0 ? 'border-white bg-white/10' : 'border-white/20'}`}>
                                                            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${variant.quantity > 0 ? 'bg-white scale-100' : 'bg-transparent scale-0'}`} />
                                                        </div>
                                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-white shrink-0">
                                                            <img src={variant.image} alt={variant.color ? variant.color.name : product.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = product.images?.[0]?.image || ''; }} loading="eager" />
                                                        </div>
                                                        <div className="flex flex-col items-start text-left">
                                                            <h4 className="font-bold text-white leading-tight max-w-[150px] md:max-w-[200px] truncate">
                                                                {product.name}
                                                            </h4>
                                                            <p className="text-sm text-white font-medium">
                                                                {variant.color?.name || variant.size?.name}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                                        <span className="font-black text-white">৳{Math.floor(variant.price)}</span>
                                                        <div className="flex items-center bg-black/40 rounded-lg border border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); handleVariantQuantityChange(variant.id, -1); }}
                                                                className="px-3 py-1 text-white hover:bg-white/20 transition-colors font-bold"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="px-3 py-1 text-white font-bold min-w-[2.5rem] text-center border-x border-white/10">
                                                                {variant.quantity}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); handleVariantQuantityChange(variant.id, 1); }}
                                                                className="px-3 py-1 text-white hover:bg-white/20 transition-colors font-bold"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                        </div>

                        <div className="p-4 sm:p-8 md:p-12 relative z-10">
                            <form onSubmit={handleFormSubmit} className="space-y-8">
                                {/* Name and Phone */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="block text-sm font-bold text-white uppercase tracking-wider">{t('full_name')} <span className="text-red-400">*</span></label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                name="customer_name"
                                                required
                                                className="w-full pl-5 pr-5 py-4 bg-white/5 border border-white/20 rounded-2xl focus:border-brand focus:bg-white/10 focus:ring-4 focus:ring-brand/20 text-white placeholder-slate-400 outline-none font-medium transition-all duration-300"
                                                placeholder={t('full_name')}
                                                value={formData.customer_name}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-sm font-bold text-white uppercase tracking-wider">{t('phone_number')} <span className="text-red-400">*</span></label>
                                        <div className="relative group">
                                            <input
                                                type="tel"
                                                name="phone_number"
                                                required
                                                className="w-full pl-5 pr-12 py-4 bg-white/5 border border-white/20 rounded-2xl focus:border-brand focus:bg-white/10 focus:ring-4 focus:ring-brand/20 text-white placeholder-slate-400 outline-none font-medium transition-all duration-300"
                                                placeholder="017XXXXXXXX"
                                                value={formData.phone_number}
                                                onChange={handlePhoneChange}
                                            />
                                            <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={20} />
                                        </div>
                                    </div>
                                </div>

                                

                                {/* Address Section */}
                                {siteSettings?.enable_district_upazila !== false && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="block text-sm font-bold text-white uppercase tracking-wider">{t('district')} <span className="text-red-400">*</span></label>
                                            <div className="relative group">
                                                <select
                                                    name="district"
                                                    required
                                                    className="w-full pl-5 pr-12 py-4 bg-slate-800/50 border border-white/20 rounded-2xl focus:border-brand focus:bg-slate-800 text-white outline-none font-medium transition-all duration-300 appearance-none"
                                                    value={formData.district}
                                                    onChange={handleChange}
                                                >
                                                    <option value="" className="bg-slate-800 text-slate-300">{t('select_district')}</option>
                                                    {districts.map(dist => {
                                                        const displayYear = dist.name.includes('|')
                                                            ? (language === 'bn' ? dist.name.split('|')[0].trim() : dist.name.split('|')[1].trim())
                                                            : dist.name;
                                                        return <option key={dist.id} value={dist.id} className="bg-slate-800 text-white">{displayYear}</option>
                                                    })}
                                                </select>
                                                <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors pointer-events-none" size={20} />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-sm font-bold text-white uppercase tracking-wider">{t('area_upazila')} <span className="text-red-400">*</span></label>
                                            <div className="relative group">
                                                <select
                                                    name="upazila"
                                                    required
                                                    className="w-full pl-5 pr-12 py-4 bg-slate-800/50 border border-white/20 rounded-2xl focus:border-brand focus:bg-slate-800 text-white outline-none font-medium transition-all duration-300 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                                                    value={formData.upazila}
                                                    onChange={handleChange}
                                                    disabled={!formData.district}
                                                >
                                                    <option value="" className="bg-slate-800 text-slate-300">{t('select_area')}</option>
                                                    {upazilas.map(upz => {
                                                        const displayYear = upz.name.includes('|')
                                                            ? (language === 'bn' ? upz.name.split('|')[0].trim() : upz.name.split('|')[1].trim())
                                                            : upz.name;
                                                        return <option key={upz.id} value={upz.id} className="bg-slate-800 text-white">{displayYear}</option>
                                                    })}
                                                </select>
                                                <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors pointer-events-none" size={20} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-white uppercase tracking-wider">{t('address_details')} <span className="text-red-400">*</span></label>
                                    <div className="relative group">
                                        <textarea
                                            name="address"
                                            required
                                            rows="2"
                                            className="w-full pl-5 pr-12 py-4 bg-white/5 border border-white/20 rounded-2xl focus:border-brand focus:bg-white/10 focus:ring-4 focus:ring-brand/20 text-white placeholder-slate-400 outline-none font-medium transition-all duration-300 resize-none"
                                            placeholder={t('write_full_address')}
                                            value={formData.address}
                                            onChange={handleChange}
                                        ></textarea>
                                        <MapPin className="absolute right-5 top-6 text-slate-400 group-focus-within:text-brand transition-colors pointer-events-none" size={20} />
                                    </div>
                                </div>

                                {/* Delivery Zone */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-white uppercase tracking-wider">{t('shipping_method')}</label>
                                    <div className="relative">
                                        <select
                                            name="shipping_zone"
                                            className={`w-full pl-5 pr-12 py-4 bg-white/5 border rounded-2xl text-slate-300 outline-none font-medium appearance-none ${siteSettings?.enable_district_upazila !== false ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white/10'} ${shippingError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-white/10'}`}
                                            value={formData.shipping_zone}
                                            disabled={siteSettings?.enable_district_upazila !== false}
                                            onChange={handleChange}
                                        >
                                            <option value="" className="bg-slate-800">{siteSettings?.enable_district_upazila !== false ? '...' : t('select_area')}</option>
                                            {shippingZones.map(zone => (
                                                <option key={zone.id} value={zone.id} className="bg-slate-800">
                                                    {zone.name} - ৳{parseFloat(zone.shipping_cost).toFixed(0)}
                                                </option>
                                            ))}
                                        </select>
                                        <Truck className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" size={20} />
                                    </div>
                                    {shippingError && (
                                        <p className="text-red-400 text-sm font-bold mt-2 animate-pulse flex items-center gap-1.5 ml-2">
                                            <span>⚠️</span> {shippingError}
                                        </p>
                                    )}
                                </div>

                                {/* Summary Box */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-8 backdrop-blur-sm">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-white/90">
                                            <span className="font-medium">{t('product')}</span>
                                            <div className='flex gap-4 items-center'>
                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0">
                                                    <img src={resolveImageUrl(activeVariant?.image || product.image || product.images?.[0]?.image)} alt={product.name} className="w-full h-full object-cover" loading="eager" fetchPriority="high" />
                                                </div>
                                                <span className="font-bold">
                                                    {product.name}
                                                    {activeVariant && activeVariant.id !== 'default' ? ` - ${activeVariant.color?.name || ''} ${activeVariant.size?.name || ''}`.trim() : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-white/90">
                                            <span className="font-medium">{t('subtotal')}</span>
                                            <span className="font-bold">৳{subtotal || Math.floor(product.sale_price || product.regular_price)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-white/90">
                                            <span className="font-medium">{t('shipping')}</span>
                                            <span className="font-bold text-white">
                                                {selectedZone ? `+ ৳${shippingCost}` : '-'}
                                            </span>
                                        </div>
                                        <div className="h-px bg-white/20 w-full my-4"></div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xl font-black text-white">{t('total_amount')}</span>
                                            <span className="text-3xl font-black text-white drop-shadow-lg">৳{finalTotal}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    ref={submitBtnRef}
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-gradient-to-r from-[#D97706] via-[#C0561F] to-[#B45309] hover:from-[#D97706] hover:via-[#C0561F] hover:to-[#B45309] text-white font-black text-2xl py-6 rounded-2xl shadow-[0_0_30px_rgba(81, 115, 251,0.3)] hover:shadow-[0_0_50px_rgba(81, 115, 251,0.5)] transform transition-all duration-300 active:scale-95 flex justify-center items-center gap-3 group relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <div className="absolute inset-0 w-[50%] h-full bg-white/30 skew-x-[-20deg] translate-x-[-200%] group-hover:animate-[shimmer_2s_infinite]"></div>
                                    {submitting ? '...' : (
                                        <>
                                            {t('place_order')} <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" size={28} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-950 text-slate-500 py-10 text-center text-sm">
                <div className="container mx-auto px-4 max-w-4xl">
                    <p className="mb-2 font-medium text-white">© 2026 Spaceghor. Developed  by <a href="https://ctsolutionbd.com" target="_blank" rel="noopener noreferrer" className='text-white hover:text-slate-300 transition-colors'>Cyber and Tech Solution</a>.</p>
                </div>
            </div>

            {/* Mobile Sticky CTA */}
            <div className={`fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md p-4 border-t border-slate-200 lg:hidden z-50 transition-transform duration-300 ${showMobileCTA ? 'translate-y-0' : 'translate-y-full'}`}>
                <a href="#order-form" className="flex items-center justify-center w-full bg-brand text-white font-black py-4 rounded-xl text-lg shadow-lg shadow-brand/30 animate-pulse hover:bg-[#3a5bd9] active:scale-95 transition-all">
                    অর্ডার করুন - ৳{finalTotal}
                </a>
            </div>
        </div>
    );
};

export default ClassicFunnelLayout;
