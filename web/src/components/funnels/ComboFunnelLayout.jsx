import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Truck, Star, CheckCircle, ArrowRight, Clock, Phone, MapPin, Zap, Award, ShoppingCart, Lock } from 'lucide-react';
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

const ComboFunnelLayout = ({
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

    const reviewItems = (funnel?.use_custom_reviews && funnel?.review_images && funnel.review_images.length > 0)
        ? funnel.review_images.map(img => ({
              id: img.id,
              image: resolveImageUrl(img.image),
              title: t('customer_review')
          }))
        : (product?.funnel_sections || []).map(section => ({
              id: section.id,
              image: resolveImageUrl(section.image),
              title: section.title,
              text: section.text
          }));

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

    // GSAP Scroll animations trigger on scroll
    useEffect(() => {
        if (hideSalesCopy) return;

        const ctx = gsap.context(() => {
            // Hero Load Animations
            gsap.from(".hero-text-anim", {
                opacity: 0,
                y: 30,
                duration: 0.8,
                stagger: 0.15,
                ease: "power3.out"
            });
            
            gsap.from(".hero-image-anim", {
                opacity: 0,
                y: 40,
                duration: 1,
                ease: "power3.out",
                delay: 0.2
            });

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
                y: 40,
                duration: 1,
                ease: "power3.out"
            });
        });

        return () => ctx.revert();
    }, [hideSalesCopy]);

    const whyBuyFromUs = [
        "১০০% সিকিউরড পেমেন্ট ও ক্যাশ অন ডেলিভারি সুবিধা",
        "দ্রুত ও নির্ভরযোগ্য হোম ডেলিভারি",
        "শতভাগ প্রিমিয়াম ও আকর্ষণীয় মোলায়েম কাপড়",
        "সহজ রিটার্ন ও এক্সচেঞ্জ পলিসি সুবিধা",
        "ডেডিকেটেড কাস্টমার সাপোর্ট ও কোয়ালিটি নিশ্চিতকরণ"
    ];

    const dynamicWhyBuyList = funnel?.features_list
        ? funnel.features_list.split('\n').map(item => item.trim()).filter(Boolean)
        : whyBuyFromUs;

    // Direct render for checkout-only pages
    if (hideSalesCopy) {
        return (
            <div id="order-form" className="py-12 relative overflow-hidden bg-[#FAF6ED] min-h-screen flex items-center justify-center">
                <div className="container mx-auto px-4 max-w-4xl relative z-10 checkout-form-container">
                    <div className="text-center text-[#3D1625] mb-8">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black mb-2">{t('fill_out_form_to_order')}</h2>
                        <div className="w-20 h-1 bg-[#3D1625] mx-auto rounded-full" />
                    </div>

                    <div className="bg-white border-[3px] border-[#3D1625] rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl p-4 sm:p-8 md:p-10 relative overflow-hidden">
                        <form onSubmit={handleFormSubmit} className="space-y-8">
                            {/* Variant Selection List - framed beautifully */}
                            {selectedVariants?.length > 0 && selectedVariants[0].id !== 'default' && (() => {
                                const primaryVars = selectedVariants.filter(v => v.product_id === product.id);
                                const secondaryVars = selectedVariants.filter(v => v.product_id === funnel?.product_two_details?.id);

                                const renderVariantCard = (variant) => (
                                    <div
                                        key={variant.id}
                                        onClick={() => handleVariantSelect(variant.id)}
                                        className={`cursor-pointer flex items-center justify-between p-2 sm:p-3.5 rounded-xl border-2 transition-all duration-300 gap-2 sm:gap-3 ${variant.quantity > 0 ? 'border-[#3D1625] bg-[#FAF6ED] shadow-md' : 'border-[#3D1625]/10 bg-white hover:border-[#3D1625]/30'}`}
                                    >
                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                            {/* Radio Bullet Indicator */}
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${variant.quantity > 0 ? 'border-[#3D1625] bg-white' : 'border-slate-300'}`}>
                                                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${variant.quantity > 0 ? 'bg-[#3D1625] scale-100' : 'bg-transparent scale-0'}`} />
                                            </div>
                                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-white shrink-0 border border-slate-200">
                                                <img src={variant.image} alt={variant.color ? variant.color.name : product.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = product.images?.[0]?.image || ''; }} loading="eager" />
                                            </div>
                                            <div className="flex flex-col items-start text-left min-w-0 flex-1">
                                                <h4 className="font-bold text-[#3D1625] text-xs sm:text-sm leading-tight truncate w-full">
                                                    {variant.product_id === product.id ? product.name : (funnel?.product_two_details?.name || product.name)}
                                                </h4>
                                                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                                                    <p className="text-[10px] sm:text-xs text-slate-500 font-bold truncate max-w-full">
                                                        {[variant.color?.name, variant.size?.name].filter(Boolean).join(' ') || 'Standard'}
                                                    </p>
                                                    <span className="text-[9px] sm:text-[10px] font-black text-[#3D1625] bg-[#3D1625]/5 px-1 sm:px-1.5 py-0.5 rounded shrink-0">৳{Math.floor(variant.price)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center bg-white rounded-lg border border-[#3D1625]/20 overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleVariantQuantityChange(variant.id, -1); }}
                                                    className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[#3D1625] hover:bg-slate-100 transition-colors font-bold text-xs sm:text-sm"
                                                >
                                                    -
                                                </button>
                                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[#3D1625] font-bold min-w-[1.2rem] sm:min-w-[1.8rem] text-center border-x border-[#3D1625]/10 text-xs sm:text-sm">
                                                    {variant.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleVariantQuantityChange(variant.id, 1); }}
                                                    className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[#3D1625] hover:bg-slate-100 transition-colors font-bold text-xs sm:text-sm"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );

                                if (secondaryVars.length > 0) {
                                    return (
                                        <div className="space-y-6">
                                            {/* Primary Product Selection */}
                                            {primaryVars.length > 0 && (
                                                <div className="bg-[#FAF6ED] border-2 border-[#3D1625] rounded-2xl p-3 sm:p-5 space-y-4">
                                                    <h3 className="text-sm font-black text-[#3D1625] uppercase tracking-wider mb-2 text-left">
                                                        আপনার পছন্দের {product.name} সিলেক্ট করুন <span className="text-red-500">*</span>
                                                    </h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {primaryVars.map(renderVariantCard)}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Secondary Product Selection */}
                                            {secondaryVars.length > 0 && (
                                                <div className="bg-[#FAF6ED] border-2 border-[#3D1625] rounded-2xl p-3 sm:p-5 space-y-4">
                                                    <h3 className="text-sm font-black text-[#3D1625] uppercase tracking-wider mb-2 text-left">
                                                        আপনার পছন্দের {funnel?.product_two_details?.name || 'আইটেম'} সিলেক্ট করুন <span className="text-red-500">*</span>
                                                    </h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {secondaryVars.map(renderVariantCard)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                // Fallback
                                return (
                                    <div className="bg-[#FAF6ED] border-2 border-[#3D1625] rounded-2xl p-3 sm:p-5 space-y-4">
                                        <h3 className="text-sm font-black text-[#3D1625] uppercase tracking-wider mb-2 text-left">
                                            আপনার পছন্দের সাইজ/কালার সিলেক্ট করুন <span className="text-red-500">*</span>
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {selectedVariants.map(renderVariantCard)}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Name and Phone */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3 text-left">
                                    <label className="block text-sm font-bold text-[#3D1625] uppercase tracking-wider">{t('full_name')} <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="customer_name"
                                        required
                                        className="w-full px-5 py-4 bg-white border border-[#3D1625]/20 rounded-2xl focus:border-[#3D1625] focus:ring-4 focus:ring-[#3D1625]/10 text-slate-800 placeholder-slate-400 outline-none font-semibold transition-all duration-300"
                                        placeholder={t('full_name')}
                                        value={formData.customer_name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-3 text-left">
                                    <label className="block text-sm font-bold text-[#3D1625] uppercase tracking-wider">{t('phone_number')} <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            name="phone_number"
                                            required
                                            className="w-full pl-5 pr-12 py-4 bg-white border border-[#3D1625]/20 rounded-2xl focus:border-[#3D1625] focus:ring-4 focus:ring-[#3D1625]/10 text-slate-800 placeholder-slate-400 outline-none font-semibold transition-all duration-300"
                                            placeholder="017XXXXXXXX"
                                            value={formData.phone_number}
                                            onChange={handlePhoneChange}
                                        />
                                        <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Address Section */}
                            {siteSettings?.enable_district_upazila !== false && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3 text-left">
                                        <label className="block text-sm font-bold text-[#3D1625] uppercase tracking-wider">{t('district')} <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                name="district"
                                                required
                                                className="w-full pl-5 pr-12 py-4 bg-white border border-[#3D1625]/20 rounded-2xl focus:border-[#3D1625] focus:ring-4 focus:ring-[#3D1625]/10 text-slate-800 outline-none font-semibold transition-all duration-300 appearance-none"
                                                value={formData.district}
                                                onChange={handleChange}
                                            >
                                                <option value="" className="text-slate-400">{t('select_district')}</option>
                                                {districts.map(dist => {
                                                    const displayYear = dist.name.includes('|')
                                                        ? (language === 'bn' ? dist.name.split('|')[0].trim() : dist.name.split('|')[1].trim())
                                                        : dist.name;
                                                    return <option key={dist.id} value={dist.id} className="text-slate-800">{displayYear}</option>
                                                })}
                                            </select>
                                            <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                        </div>
                                    </div>
                                    <div className="space-y-3 text-left">
                                        <label className="block text-sm font-bold text-[#3D1625] uppercase tracking-wider">{t('area_upazila')} <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                name="upazila"
                                                required
                                                className="w-full pl-5 pr-12 py-4 bg-white border border-[#3D1625]/20 rounded-2xl focus:border-[#3D1625] focus:ring-4 focus:ring-[#3D1625]/10 text-slate-800 outline-none font-semibold transition-all duration-300 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                                                value={formData.upazila}
                                                onChange={handleChange}
                                                disabled={!formData.district}
                                            >
                                                <option value="" className="text-slate-400">{t('select_area')}</option>
                                                {upazilas.map(upz => {
                                                    const displayYear = upz.name.includes('|')
                                                        ? (language === 'bn' ? upz.name.split('|')[0].trim() : upz.name.split('|')[1].trim())
                                                        : upz.name;
                                                    return <option key={upz.id} value={upz.id} className="text-slate-800">{displayYear}</option>
                                                })}
                                            </select>
                                            <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 text-left">
                                <label className="block text-sm font-bold text-[#3D1625] uppercase tracking-wider">{t('address_details')} <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <textarea
                                        name="address"
                                        required
                                        rows="2"
                                        className="w-full pl-5 pr-12 py-4 bg-white border border-[#3D1625]/20 rounded-2xl focus:border-[#3D1625] focus:ring-4 focus:ring-[#3D1625]/10 text-slate-800 placeholder-slate-400 outline-none font-semibold transition-all duration-300 resize-none"
                                        placeholder={t('write_full_address')}
                                        value={formData.address}
                                        onChange={handleChange}
                                    ></textarea>
                                    <MapPin className="absolute right-5 top-6 text-slate-400 pointer-events-none" size={20} />
                                </div>
                            </div>

                            {/* Delivery Zone */}
                            <div className="space-y-3 text-left">
                                <label className="block text-sm font-bold text-[#3D1625] uppercase tracking-wider">{t('shipping_method')}</label>
                                <div className="relative">
                                    <select
                                        name="shipping_zone"
                                        className={`w-full pl-5 pr-12 py-4 bg-white border border-[#3D1625]/20 rounded-2xl text-slate-800 outline-none font-semibold appearance-none ${siteSettings?.enable_district_upazila !== false ? 'cursor-not-allowed text-slate-400' : 'cursor-pointer hover:bg-slate-50'} ${shippingError ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}
                                        value={formData.shipping_zone}
                                        disabled={siteSettings?.enable_district_upazila !== false}
                                        onChange={handleChange}
                                    >
                                        <option value="" className="text-slate-400">{siteSettings?.enable_district_upazila !== false ? '...' : t('select_shipping_zone')}</option>
                                        {shippingZones.map(zone => {
                                            const displayName = zone.name.toLowerCase().includes('inside')
                                                ? 'ঢাকা সিটির ভেতরে (Inside Dhaka)'
                                                : zone.name.toLowerCase().includes('outside')
                                                    ? 'ঢাকা সিটির বাইরে (Outside Dhaka)'
                                                    : zone.name;
                                            return (
                                                <option key={zone.id} value={zone.id} className="text-slate-800">
                                                    {displayName} - ৳{parseFloat(zone.shipping_cost).toFixed(0)}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <Truck className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                </div>
                                {shippingError && (
                                    <p className="text-red-500 text-sm font-bold mt-2 animate-pulse flex items-center gap-1.5 ml-2">
                                        <span>⚠️</span> {shippingError}
                                    </p>
                                )}
                            </div>

                            {/* Summary Box */}
                            <div className="bg-[#FAF6ED] border-2 border-[#3D1625] rounded-2xl p-6 mt-8 text-left">
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-4 text-slate-700">
                                        <span className="font-bold border-b border-[#3D1625]/10 pb-2">{t('product')}</span>
                                        {selectedVariants?.filter(v => v.quantity > 0).length > 0 ? (
                                            selectedVariants.filter(v => v.quantity > 0).map((variant) => {
                                                const varProdName = variant.product_id === product.id ? product.name : (funnel?.product_two_details?.name || product.name);
                                                return (
                                                    <div key={variant.id} className="flex justify-between items-center gap-4 py-1">
                                                        <div className="flex gap-3 items-center min-w-0 flex-1">
                                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0 border border-slate-200">
                                                                <img src={resolveImageUrl(variant.image || product.image || product.images?.[0]?.image)} alt={varProdName} className="w-full h-full object-cover" loading="eager" />
                                                            </div>
                                                            <div className="flex flex-col items-start min-w-0 flex-1">
                                                                <span className="font-bold text-[#3D1625] truncate text-sm block w-full">
                                                                    {varProdName}
                                                                </span>
                                                                <span className="text-xs text-slate-500 font-semibold truncate block w-full">
                                                                    {[variant.color?.name, variant.size?.name].filter(Boolean).join(' ')} (x{variant.quantity})
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="font-black text-[#3D1625] shrink-0 text-sm">
                                                            ৳{Math.floor(variant.price * variant.quantity)}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex justify-between items-center gap-4 py-1">
                                                <div className="flex gap-3 items-center min-w-0 flex-1">
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0 border border-slate-200">
                                                        <img src={resolveImageUrl(activeVariant?.image || product.image || product.images?.[0]?.image)} alt={product.name} className="w-full h-full object-cover" loading="eager" />
                                                    </div>
                                                    <div className="flex flex-col items-start min-w-0 flex-1">
                                                        <span className="font-bold text-[#3D1625] truncate text-sm block w-full">
                                                            {product.name}
                                                        </span>
                                                        {activeVariant && activeVariant.id !== 'default' && (
                                                            <span className="text-xs text-slate-500 font-semibold truncate block w-full">
                                                                {[activeVariant.color?.name, activeVariant.size?.name].filter(Boolean).join(' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="font-black text-[#3D1625] shrink-0 text-sm">
                                                    ৳{Math.floor(product.sale_price || product.regular_price)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center text-slate-700">
                                        <span className="font-bold">{t('subtotal')}</span>
                                        <span className="font-black text-[#3D1625]">৳{subtotal || Math.floor(product.sale_price || product.regular_price)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-700">
                                        <span className="font-bold">{t('shipping')}</span>
                                        <span className="font-black text-[#3D1625]">
                                            {selectedZone ? `+ ৳${shippingCost}` : '-'}
                                        </span>
                                    </div>
                                    <div className="h-px bg-[#3D1625]/20 w-full my-4"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-black text-[#3D1625]">{t('total_amount')}</span>
                                        <span className="text-3xl font-black text-[#3D1625]">৳{finalTotal}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Clean secure Teal Checkout Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#006E9D] hover:bg-[#005a82] text-white font-black text-2xl py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 flex justify-center items-center gap-3 disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                                <Lock size={24} className="shrink-0 animate-pulse text-white/90" />
                                {submitting ? '...' : t('place_order')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // Gathering Hero Images
    const heroSliderImages = [];
    if (product.images && product.images.length > 0) {
        product.images.forEach(img => {
            if (img.image) heroSliderImages.push(resolveImageUrl(img.image));
        });
    } else if (product.image) {
        heroSliderImages.push(resolveImageUrl(product.image));
    }

    if (funnel?.product_two_details) {
        const p2 = funnel.product_two_details;
        if (p2.images && p2.images.length > 0) {
            p2.images.forEach(img => {
                if (img.image) heroSliderImages.push(resolveImageUrl(img.image));
            });
        } else if (p2.image) {
            heroSliderImages.push(resolveImageUrl(p2.image));
        }
    }

    if (heroSliderImages.length === 0) {
        heroSliderImages.push('');
    }

    return (
        <div className="bg-[#FAF6ED] min-h-screen font-sans text-slate-800 overflow-x-hidden">
            {/* Top Alert Bar in bright Gold/Yellow with Maroon text */}
            <div className="bg-green-900 text-white py-3.5 px-4 shadow-md relative z-30 font-black text-center text-xs sm:text-sm tracking-widest border-b border-white/15 uppercase">
                <span className="flex items-center justify-center gap-3">
                    <Zap size={15} className="fill-[#fff] animate-pulse shrink-0" />
                    <span>{funnel?.top_header_line_1}</span>
                    <Zap size={15} className="fill-[#fff] animate-pulse shrink-0" />
                </span>
            </div>

            {/* Centered Sign of Modesty aesthetic Hero Section */}
            <div className="relative pb-24 pt-16 overflow-hidden">
                <div className="container mx-auto px-4 z-10 relative max-w-6xl text-center space-y-8">

                    {/* Main Centered Product Title */}
                    <span className="hero-text-anim text-lg sm:text-xl lg:text-2xl font-black text- leading-tight max-w-4xl mx-auto">
                        {funnel?.product_two_details ? `${product.name} & ${funnel.product_two_details.name}` : product.name} = Full Set
                    </span>

                    {/* Premium Multi-Card Slider displaying rounded product items */}
                    <div className="hero-image-anim w-full max-w-5xl mx-auto pt-2">
                        <Swiper
                            modules={[Navigation, Pagination, Autoplay]}
                            slidesPerView={1}
                            spaceBetween={16}
                            breakpoints={{
                                640: { slidesPerView: 2, spaceBetween: 20 },
                                1024: { slidesPerView: 3, spaceBetween: 24 }
                            }}
                            pagination={{ clickable: true }}
                            autoplay={{ delay: 3500, disableOnInteraction: false }}
                            className="signofmodesty-hero-swiper pb-10"
                        >
                            <style dangerouslySetInnerHTML={{
                                __html: `
                                .signofmodesty-hero-swiper .swiper-pagination {
                                    bottom: 0px !important;
                                    position: relative !important;
                                    margin-top: 20px !important;
                                }
                                .signofmodesty-hero-swiper .swiper-pagination-bullet {
                                    width: 8px !important;
                                    height: 8px !important;
                                    background: #cbd5e1 !important;
                                    opacity: 1 !important;
                                    margin: 0 5px !important;
                                    border-radius: 50% !important;
                                    transition: all 0.3s ease !important;
                                }
                                .signofmodesty-hero-swiper .swiper-pagination-bullet-active {
                                    background: #3D1625 !important;
                                    opacity: 1 !important;
                                }
                            `}} />
                            {heroSliderImages.map((imgUrl, idx) => (
                                <SwiperSlide key={idx}>
                                    <div className="relative group overflow-hidden rounded-3xl shadow-md border-2 border-[#3D1625]/10 bg-white p-3 aspect-square flex items-center justify-center transition-all duration-500 hover:shadow-xl hover:border-[#3D1625]/25">
                                        <img 
                                            src={imgUrl} 
                                            alt={`Product image ${idx + 1}`} 
                                            className="w-full h-full object-cover rounded-2xl" 
                                            loading="eager" 
                                        />
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                    


                    {/* Centered Bold Emerald-Green details line */}
                    <div className="hero-text-anim text-[#1B5E20] font-black text-xl md:text-2xl py-2 tracking-wide">
                        {funnel?.top_header_line_2}
                    </div>

                    {/* Centered Soft Gold/Bronze Action Button */}
                    <div className="hero-text-anim flex justify-center pt-2">
                        <button
                            onClick={() => document.getElementById('order-form').scrollIntoView({ behavior: 'smooth' })}
                            className="bg-green-800 hover:bg-green-600/30 text-white font-extrabold text-lg px-12 py-4.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <span>অফার প্রাইস জানতে ক্লিক করুন</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Custom pricing tags with circle animations */}
            <div className="w-full shadow-lg relative z-20">
                <div className="bg-green-100 py-4 text-center text-[#3D1625] font-black text-lg md:text-xl tracking-wide border-b border-[#e2d8cd]">
                    <span className="flex items-center justify-center gap-2 flex-wrap">
                        {language === 'bn' ? 'রেগুলার প্রাইস:' : 'Regular Price Was:'}
                        <span className="relative inline-flex items-center justify-center px-3">
                            <span className="absolute left-0 right-0 h-1 bg-red-600 rounded rotate-[-4deg]" />
                            <span className="relative z-10 font-black">
                                ৳{language === 'bn' 
                                    ? toBanglaNumber(Math.floor(product.regular_price) + (funnel?.product_two_details ? Math.floor(funnel.product_two_details.regular_price || 0) : 0)) 
                                    : (Math.floor(product.regular_price) + (funnel?.product_two_details ? Math.floor(funnel.product_two_details.regular_price || 0) : 0))}
                            </span>
                        </span>
                        {language === 'bn' ? 'টাকা।' : 'Taka.'}
                    </span>
                </div>

                <div className="bg-green-900 py-5 text-center text-white font-black text-xl md:text-2xl tracking-wide shadow-inner">
                    <span className="flex items-center justify-center gap-2 flex-wrap">
                        {language === 'bn' ? 'অফার প্রাইস মাত্র' : 'Discount Price Only'}
                        <span className="relative inline-block px-4 py-1.5 mx-2 bg-[#ECC100] text-[#3D1625] rounded-xl shadow-lg transform rotate-[-1deg]">
                            <span className="relative z-10 font-extrabold">
                                ৳{language === 'bn' 
                                    ? toBanglaNumber(Math.floor(product.sale_price || product.regular_price) + (funnel?.product_two_details ? Math.floor(funnel.product_two_details.sale_price || funnel.product_two_details.regular_price || 0) : 0)) 
                                    : (Math.floor(product.sale_price || product.regular_price) + (funnel?.product_two_details ? Math.floor(funnel.product_two_details.sale_price || funnel.product_two_details.regular_price || 0) : 0))}
                            </span>
                        </span>
                        {language === 'bn' ? 'টাকা।' : 'Taka.'}
                    </span>
                </div>
            </div>
            {/* Premium framed Green Description Section */}
            <div className="py-16 container mx-auto px-4 max-w-4xl text-center space-y-6">
                <div className="bg-green-100/50 border-2 border-green-900/20 rounded-[2rem] p-8 sm:p-12 shadow-md space-y-6">
                    {/* Centered Logo/Brand tagline */}
                    {funnel?.top_header_line_4 && (
                        <div className="hero-text-anim text-green-900 font-black text-lg sm:text-xl lg:text-2xl tracking-wide uppercase">
                            {funnel.top_header_line_4}
                        </div>
                    )}

                    {/* Centered Premium Bangla description text below bullets */}
                    <div className="hero-text-anim text-green-900 text-lg sm:text-xl font-extrabold max-w-3xl mx-auto leading-relaxed space-y-4 text-left">
                        <div dangerouslySetInnerHTML={{ __html: product.short_description }} className="product-description-content" />
                        {funnel?.product_two_details?.short_description && (
                            <>
                                <div className="flex items-center justify-center gap-4 py-2">
                                    <div className="h-[2px] bg-green-900/20 w-16" />
                                    <span className="text-green-600 font-black text-2xl">&</span>
                                    <div className="h-[2px] bg-green-900/20 w-16" />
                                </div>
                                <div dangerouslySetInnerHTML={{ __html: funnel.product_two_details.short_description }} className="product-description-content" />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Why Buy from Us Checklist section inside deep maroon borders */}
            <div className="why-buy-section py-16 container mx-auto px-4 max-w-4xl">
                <div className="bg-white border-[3px] border-[#3D1625] rounded-[2rem] p-6 sm:p-10 shadow-xl space-y-8">
                    <div className="text-center space-y-2">
                        <h3 className="text-xl md:text-2xl font-black text-[#3D1625]">
                            {funnel?.top_header_line_3}
                        </h3>
                        <div className="w-20 h-1 bg-[#3D1625] mx-auto rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dynamicWhyBuyList.map((reason, idx) => (
                            <div key={idx} className="feature-card flex items-start gap-3 p-4 bg-[#FAF6ED] rounded-2xl border border-[#3D1625]/10">
                                <span className="w-6 h-6 rounded-full bg-[#1B5E20] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                    <span className="text-[10px] font-black">✓</span>
                                </span>
                                <span className="font-bold text-slate-800 text-sm leading-snug">{reason}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Custom Review Section as elegant swiper cards */}
            {reviewItems && reviewItems.length > 0 && (
                <div className="py-16 bg-[#FAF6ED] border-y border-[#3D1625]/10">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <div className="text-center mb-12 space-y-3">
                            <h2 className="text-xl md:text-2xl font-black text-[#3D1625] uppercase">
                                {t('real_customer_reviews')}
                            </h2>
                            <div className="w-20 h-1 bg-[#3D1625] mx-auto rounded-full" />
                        </div>

                        <div className="relative review-swiper-container">
                            <Swiper
                                modules={[Navigation, Pagination, Autoplay]}
                                spaceBetween={24}
                                slidesPerView={1}
                                breakpoints={{
                                    640: { slidesPerView: 2 },
                                    1024: { slidesPerView: 3 },
                                }}
                                pagination={{ clickable: true }}
                                autoplay={{ delay: 3000, disableOnInteraction: false }}
                                className="pb-12"
                            >
                                <style dangerouslySetInnerHTML={{
                                    __html: `
                                    .review-swiper-container .swiper-pagination-bullet-active {
                                        background: #3D1625 !important;
                                    }
                                `}} />
                                {reviewItems.map((section, idx) => (
                                    <SwiperSlide key={section.id || idx}>
                                        <div className="bg-white rounded-3xl overflow-hidden border border-[#3D1625]/10 h-full flex flex-col p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="relative overflow-hidden rounded-2xl w-full flex items-center justify-center bg-slate-50 border border-slate-100">
                                                {section.image ? (
                                                    <img src={section.image} alt={section.title} className="w-full h-auto  rounded-2xl" loading="eager" />
                                                ) : (
                                                    <div className="w-full aspect-square bg-[#3D1625]/5 flex items-center justify-center rounded-2xl">
                                                        <Zap className="text-[#3D1625]/20" size={36} />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {(section.title || section.text) && (
                                                <div className="pt-4 text-left space-y-2">
                                                    {section.title && <h3 className="font-extrabold text-[#3D1625] text-base leading-tight">{section.title}</h3>}
                                                    {section.text && <p className="text-slate-600 font-semibold text-xs leading-relaxed">{section.text}</p>}
                                                </div>
                                            )}
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium framed Golden Golden Checkout Area */}
            <div id="order-form" className="py-16 relative overflow-hidden bg-[#FAF6ED]">
                <div className="container mx-auto px-4 max-w-4xl relative z-10 checkout-form-container">
                    <div className="text-center text-[#3D1625] mb-8">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black mb-2">
                            {language === 'bn' ? 'অর্ডার করতে ফর্মটি পূরণ করুন' : 'Fill out the form to order'}
                        </h2>
                        <div className="w-20 h-1 bg-green-700 mx-auto rounded-full" />
                    </div>

                    {/* Frame styled like Sign of Modesty */}
                    <div className="bg-white border-[3px] border-[#3D1625] rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl p-4 sm:p-8 md:p-10 relative overflow-hidden">
                        <form onSubmit={handleFormSubmit} className="space-y-8">
                            
                            {/* Variant selection inside framed list */}
                            {selectedVariants?.length > 0 && selectedVariants[0].id !== 'default' && (() => {
                                const primaryVars = selectedVariants.filter(v => v.product_id === product.id);
                                const secondaryVars = selectedVariants.filter(v => v.product_id === funnel?.product_two_details?.id);

                                const renderVariantCard = (variant) => (
                                    <div
                                        key={variant.id}
                                        onClick={() => handleVariantSelect(variant.id)}
                                        className={`cursor-pointer flex items-center justify-between p-2 sm:p-3.5 rounded-xl border-2 transition-all duration-300 gap-2 sm:gap-3 ${variant.quantity > 0 ? 'border-[#3D1625] bg-[#FAF6ED] shadow-md' : 'border-[#3D1625]/10 bg-white hover:border-[#3D1625]/30'}`}
                                    >
                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                            {/* Radio Bullet Indicator */}
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${variant.quantity > 0 ? 'border-[#3D1625] bg-white' : 'border-slate-300'}`}>
                                                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${variant.quantity > 0 ? 'bg-[#3D1625] scale-100' : 'bg-transparent scale-0'}`} />
                                            </div>
                                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-white shrink-0 border border-slate-200">
                                                <img src={variant.image} alt={variant.color ? variant.color.name : product.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = product.images?.[0]?.image || ''; }} loading="eager" />
                                            </div>
                                            <div className="flex flex-col items-start text-left min-w-0 flex-1">
                                                <h4 className="font-bold text-[#3D1625] text-xs sm:text-sm leading-tight truncate w-full">
                                                    {variant.product_id === product.id ? product.name : (funnel?.product_two_details?.name || product.name)}
                                                </h4>
                                                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                                                    <p className="text-[10px] sm:text-xs text-slate-500 font-bold truncate max-w-full">
                                                        {[variant.color?.name, variant.size?.name].filter(Boolean).join(' ') || 'Standard'}
                                                    </p>
                                                    <span className="text-[9px] sm:text-[10px] font-black text-[#3D1625] bg-[#3D1625]/5 px-1 sm:px-1.5 py-0.5 rounded shrink-0">৳{Math.floor(variant.price)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center bg-white rounded-lg border border-[#3D1625]/20 overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleVariantQuantityChange(variant.id, -1); }}
                                                    className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[#3D1625] hover:bg-slate-100 transition-colors font-bold text-xs sm:text-sm"
                                                >
                                                    -
                                                </button>
                                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[#3D1625] font-bold min-w-[1.2rem] sm:min-w-[1.8rem] text-center border-x border-[#3D1625]/10 text-xs sm:text-sm">
                                                    {variant.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleVariantQuantityChange(variant.id, 1); }}
                                                    className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[#3D1625] hover:bg-slate-100 transition-colors font-bold text-xs sm:text-sm"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );

                                if (secondaryVars.length > 0) {
                                    return (
                                        <div className="space-y-6">
                                            {/* Primary Product Selection */}
                                            {primaryVars.length > 0 && (
                                                <div className="bg-[#FAF6ED] border-2 border-[#3D1625] rounded-2xl p-3 sm:p-5 space-y-4">
                                                    <div className="text-left">
                                                        <h3 className="text-sm font-black text-[#3D1625] uppercase tracking-wider mb-1">
                                                            আপনার পছন্দের {product.name} সিলেক্ট করুন <span className="text-red-500">*</span>
                                                        </h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {primaryVars.map(renderVariantCard)}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Secondary Product Selection */}
                                            {secondaryVars.length > 0 && (
                                                <div className="bg-[#FAF6ED] border-2 border-[#3D1625] rounded-2xl p-3 sm:p-5 space-y-4">
                                                    <div className="text-left">
                                                        <h3 className="text-sm font-black text-[#3D1625] uppercase tracking-wider mb-1">
                                                            আপনার পছন্দের {funnel?.product_two_details?.name || 'আইটেম'} সিলেক্ট করুন <span className="text-red-500">*</span>
                                                        </h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {secondaryVars.map(renderVariantCard)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                // Fallback
                                return (
                                    <div className="bg-[#FAF6ED] border-2 border-[#3D1625] rounded-2xl p-3 sm:p-5 space-y-4">
                                        <h3 className="text-sm font-black text-[#3D1625] uppercase tracking-wider mb-2 text-left">
                                            আপনার পছন্দের সাইজ/কালার সিলেক্ট করুন <span className="text-red-500">*</span>
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {selectedVariants.map(renderVariantCard)}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Name and Phone */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3 text-left">
                                    <label className="block text-sm font-bold text-[#3D1625] uppercase tracking-wider">{t('full_name')} <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="customer_name"
                                        required
                                        className="w-full px-5 py-4 bg-white border border-[#3D1625]/20 rounded-2xl focus:border-[#3D1625] focus:ring-4 focus:ring-[#3D1625]/10 text-slate-800 placeholder-slate-400 outline-none font-semibold transition-all duration-300"
                                        placeholder={t('full_name')}
                                        value={formData.customer_name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-3 text-left">
                                    <label className="block text-sm font-bold text-[#3D1625] uppercase tracking-wider">{t('phone_number')} <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            name="phone_number"
                                            required
                                            className="w-full pl-5 pr-12 py-4 bg-white border border-[#3D1625]/20 rounded-2xl focus:border-[#3D1625] focus:ring-4 focus:ring-[#3D1625]/10 text-slate-800 placeholder-slate-400 outline-none font-semibold transition-all duration-300"
                                            placeholder="017XXXXXXXX"
                                            value={formData.phone_number}
                                            onChange={handlePhoneChange}
                                        />
                                        <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* Address Section */}
                            {siteSettings?.enable_district_upazila !== false && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3 text-left">
                                        <label className="block text-sm font-bold text-[#3D1625] uppercase tracking-wider">{t('district')} <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                name="district"
                                                required
                                                className="w-full pl-5 pr-12 py-4 bg-white border border-[#3D1625]/20 rounded-2xl focus:border-[#3D1625] focus:ring-4 focus:ring-[#3D1625]/10 text-slate-800 outline-none font-semibold transition-all duration-300 appearance-none"
                                                value={formData.district}
                                                onChange={handleChange}
                                            >
                                                <option value="" className="text-slate-400">{t('select_district')}</option>
                                                {districts.map(dist => {
                                                    const displayYear = dist.name.includes('|')
                                                        ? (language === 'bn' ? dist.name.split('|')[0].trim() : dist.name.split('|')[1].trim())
                                                        : dist.name;
                                                    return <option key={dist.id} value={dist.id} className="text-slate-800">{displayYear}</option>
                                                })}
                                            </select>
                                            <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                        </div>
                                    </div>
                                    <div className="space-y-3 text-left">
                                        <label className="block text-sm font-bold text-[#3D1625] uppercase tracking-wider">{t('area_upazila')} <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                name="upazila"
                                                required
                                                className="w-full pl-5 pr-12 py-4 bg-white border border-[#3D1625]/20 rounded-2xl focus:border-[#3D1625] focus:ring-4 focus:ring-[#3D1625]/10 text-slate-800 outline-none font-semibold transition-all duration-300 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                                                value={formData.upazila}
                                                onChange={handleChange}
                                                disabled={!formData.district}
                                            >
                                                <option value="" className="text-slate-400">{t('select_area')}</option>
                                                {upazilas.map(upz => {
                                                    const displayYear = upz.name.includes('|')
                                                        ? (language === 'bn' ? upz.name.split('|')[0].trim() : upz.name.split('|')[1].trim())
                                                        : upz.name;
                                                    return <option key={upz.id} value={upz.id} className="text-slate-800">{displayYear}</option>
                                                })}
                                            </select>
                                            <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 text-left">
                                <label className="block text-sm font-bold text-[#3D1625] uppercase tracking-wider">{t('address_details')} <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <textarea
                                        name="address"
                                        required
                                        rows="2"
                                        className="w-full pl-5 pr-12 py-4 bg-white border border-[#3D1625]/20 rounded-2xl focus:border-[#3D1625] focus:ring-4 focus:ring-[#3D1625]/10 text-slate-800 placeholder-slate-400 outline-none font-semibold transition-all duration-300 resize-none"
                                        placeholder={t('write_full_address')}
                                        value={formData.address}
                                        onChange={handleChange}
                                    ></textarea>
                                    <MapPin className="absolute right-5 top-6 text-slate-400 pointer-events-none" size={20} />
                                </div>
                            </div>

                            {/* Delivery Zone */}
                            <div className="space-y-3 text-left">
                                <label className="block text-sm font-bold text-[#3D1625] uppercase tracking-wider">{t('shipping_method')}</label>
                                <div className="relative">
                                    <select
                                        name="shipping_zone"
                                        className={`w-full pl-5 pr-12 py-4 bg-white border border-[#3D1625]/20 rounded-2xl text-slate-800 outline-none font-semibold appearance-none ${siteSettings?.enable_district_upazila !== false ? 'cursor-not-allowed text-slate-400' : 'cursor-pointer hover:bg-slate-50'} ${shippingError ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}
                                        value={formData.shipping_zone}
                                        disabled={siteSettings?.enable_district_upazila !== false}
                                        onChange={handleChange}
                                    >
                                        <option value="" className="text-slate-400">{siteSettings?.enable_district_upazila !== false ? '...' : t('select_shipping_zone')}</option>
                                        {shippingZones.map(zone => {
                                            const displayName = zone.name.toLowerCase().includes('inside')
                                                ? 'ঢাকা সিটির ভেতরে (Inside Dhaka)'
                                                : zone.name.toLowerCase().includes('outside')
                                                    ? 'ঢাকা সিটির বাইরে (Outside Dhaka)'
                                                    : zone.name;
                                            return (
                                                <option key={zone.id} value={zone.id} className="text-slate-800">
                                                    {displayName} - ৳{parseFloat(zone.shipping_cost).toFixed(0)}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <Truck className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                </div>
                                {shippingError && (
                                    <p className="text-red-500 text-sm font-bold mt-2 animate-pulse flex items-center gap-1.5 ml-2">
                                        <span>⚠️</span> {shippingError}
                                    </p>
                                )}
                            </div>

                            {/* Summary Box */}
                            <div className="bg-[#FAF6ED] border-2 border-[#3D1625] rounded-2xl p-6 mt-8 text-left">
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-4 text-slate-700">
                                        <span className="font-bold border-b border-[#3D1625]/10 pb-2">{t('product')}</span>
                                        {selectedVariants?.filter(v => v.quantity > 0).length > 0 ? (
                                            selectedVariants.filter(v => v.quantity > 0).map((variant) => {
                                                const varProdName = variant.product_id === product.id ? product.name : (funnel?.product_two_details?.name || product.name);
                                                return (
                                                    <div key={variant.id} className="flex justify-between items-center gap-4 py-1">
                                                        <div className="flex gap-3 items-center min-w-0 flex-1">
                                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0 border border-slate-200">
                                                                <img src={resolveImageUrl(variant.image || product.image || product.images?.[0]?.image)} alt={varProdName} className="w-full h-full object-cover" loading="eager" />
                                                            </div>
                                                            <div className="flex flex-col items-start min-w-0 flex-1">
                                                                <span className="font-bold text-[#3D1625] truncate text-sm block w-full">
                                                                    {varProdName}
                                                                </span>
                                                                <span className="text-xs text-slate-500 font-semibold truncate block w-full">
                                                                    {[variant.color?.name, variant.size?.name].filter(Boolean).join(' ')} (x{variant.quantity})
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="font-black text-[#3D1625] shrink-0 text-sm">
                                                            ৳{Math.floor(variant.price * variant.quantity)}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex justify-between items-center gap-4 py-1">
                                                <div className="flex gap-3 items-center min-w-0 flex-1">
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0 border border-slate-200">
                                                        <img src={resolveImageUrl(activeVariant?.image || product.image || product.images?.[0]?.image)} alt={product.name} className="w-full h-full object-cover" loading="eager" />
                                                    </div>
                                                    <div className="flex flex-col items-start min-w-0 flex-1">
                                                        <span className="font-bold text-[#3D1625] truncate text-sm block w-full">
                                                            {product.name}
                                                        </span>
                                                        {activeVariant && activeVariant.id !== 'default' && (
                                                            <span className="text-xs text-slate-500 font-semibold truncate block w-full">
                                                                {[activeVariant.color?.name, activeVariant.size?.name].filter(Boolean).join(' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="font-black text-[#3D1625] shrink-0 text-sm">
                                                    ৳{Math.floor(product.sale_price || product.regular_price)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center text-slate-700">
                                        <span className="font-bold">{t('subtotal')}</span>
                                        <span className="font-black text-[#3D1625]">৳{subtotal || Math.floor(product.sale_price || product.regular_price)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-700">
                                        <span className="font-bold">{t('shipping')}</span>
                                        <span className="font-black text-[#3D1625]">
                                            {selectedZone ? `+ ৳${shippingCost}` : '-'}
                                        </span>
                                    </div>
                                    <div className="h-px bg-[#3D1625]/20 w-full my-4"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-black text-[#3D1625]">{t('total_amount')}</span>
                                        <span className="text-3xl font-black text-[#3D1625]">৳{finalTotal}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Clean secure Teal Checkout Button */}
                            <button
                                ref={submitBtnRef}
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-green-900 hover:bg-green-700/80 text-white font-black text-2xl py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 flex justify-center items-center gap-3 disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                                <Lock size={24} className="shrink-0 animate-pulse text-white/90" />
                                {submitting ? '...' : t('place_order')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-green-900 text-white/50 py-12 text-center text-xs font-semibold border-t border-white/10">
                <div className="container mx-auto px-4 max-w-4xl space-y-2">
                    <p className="mb-2 font-medium text-white">© 2026 Spaceghor. Developed by <a href="https://ctsolutionbd.com" target="_blank" rel="noopener noreferrer" className='text-white hover:text-slate-300 transition-colors'>Cyber and Tech Solution</a>.</p>
                </div>
            </div>

            {/* Mobile Sticky CTA */}
            <div className={`fixed bottom-0 left-0 right-0 bg-[#FAF6ED]/95 backdrop-blur-md p-4 border-t border-[#3D1625]/15 lg:hidden z-50 transition-transform duration-300 ${showMobileCTA ? 'translate-y-0' : 'translate-y-full'}`}>
                <a href="#order-form" className="flex items-center justify-center w-full bg-green-900 hover:bg-green-700/80 text-white font-bold py-4.5 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 gap-2">
                    <ShoppingCart size={18} /> এখনই অর্ডার করুন - ৳{finalTotal}
                </a>
            </div>
        </div>
    );
};

export default ComboFunnelLayout;
