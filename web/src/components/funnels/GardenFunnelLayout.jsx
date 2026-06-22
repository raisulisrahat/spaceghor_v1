import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ChevronDown, Star, CheckCircle, ArrowRight, Clock, Phone, MapPin, Zap, Award, ShoppingCart, Lock } from 'lucide-react';
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

const GardenFunnelLayout = ({
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
    const formRef = useRef(null);
    const [showMobileCTA, setShowMobileCTA] = useState(true);

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

            // Price Strips Animation
            gsap.from(".price-strip-anim", {
                scrollTrigger: {
                    trigger: ".price-strip-trigger",
                    start: "top 90%",
                    toggleActions: "play none none none"
                },
                opacity: 0,
                y: 20,
                duration: 0.6,
                stagger: 0.15,
                ease: "power2.out"
            });

            // Section 1: Why Buy
            gsap.from(".sec-1-content", {
                scrollTrigger: {
                    trigger: ".section-1-trigger",
                    start: "top 80%",
                    toggleActions: "play none none none"
                },
                opacity: 0,
                x: -50,
                duration: 0.8,
                ease: "power2.out"
            });
            
            gsap.from(".sec-1-image", {
                scrollTrigger: {
                    trigger: ".section-1-trigger",
                    start: "top 80%",
                    toggleActions: "play none none none"
                },
                opacity: 0,
                x: 50,
                duration: 0.8,
                ease: "power2.out"
            });

            // Section 2: For Whom
            gsap.from(".sec-2-content", {
                scrollTrigger: {
                    trigger: ".section-2-trigger",
                    start: "top 80%",
                    toggleActions: "play none none none"
                },
                opacity: 0,
                x: 50,
                duration: 0.8,
                ease: "power2.out"
            });
            
            gsap.from(".sec-2-image", {
                scrollTrigger: {
                    trigger: ".section-2-trigger",
                    start: "top 80%",
                    toggleActions: "play none none none"
                },
                opacity: 0,
                x: -50,
                duration: 0.8,
                ease: "power2.out"
            });

            // Review Swiper entrance
            gsap.from(".review-swiper-container", {
                scrollTrigger: {
                    trigger: ".review-swiper-container",
                    start: "top 85%",
                    toggleActions: "play none none none"
                },
                opacity: 0,
                y: 30,
                duration: 0.8,
                ease: "power2.out"
            });

            // Order Form entrance
            gsap.from(".checkout-form-container", {
                scrollTrigger: {
                    trigger: ".checkout-form-container",
                    start: "top 80%",
                    toggleActions: "play none none none"
                },
                opacity: 0,
                y: 40,
                duration: 0.8,
                ease: "power2.out"
            });
        });

        return () => ctx.revert();
    }, [hideSalesCopy]);

    const whyBuyFromUs = [
        "১০০% সিকিউরড পেমেন্ট ও ক্যাশ অন ডেলিভারি সুবিধা",
        "দ্রুত ও নির্ভরযোগ্য হোম ডেলিভারি",
        "শতভাগ প্রিমিয়াম কোয়ালিটি পণ্য নিশ্চিতকরণ",
        "সহজ রিটার্ন ও রিপ্লেসমেন্ট পলিসি সুবিধা",
        "২৪/৭ ডেডিকেটেড কাস্টমার সাপোর্ট টিম"
    ];

    const dynamicWhyBuyList = funnel?.features_list
        ? funnel.features_list.split('\n').map(item => item.trim()).filter(Boolean)
        : whyBuyFromUs;

    // Direct render for checkout-only pages
    if (hideSalesCopy) {
        return (
            <div id="order-form" className="py-12 relative overflow-hidden bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#2e1065] min-h-screen flex items-center justify-center">
                <div className="container mx-auto px-4 max-w-4xl relative z-10 checkout-form-container">
                    <div className="text-center text-white mb-8 sm:mb-12">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-6 drop-shadow-md">{t('fill_out_form_to_order')}</h2>
                    </div>

                    {/* Glassmorphism Card */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                        {/* Shimmer Effect */}
                        <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] animate-[shimmer_3s_infinite]"></div>
            
                        <div className="p-3 sm:p-5 text-center shadow-md relative z-10">
                            {/* Variant Selection List */}
                            {selectedVariants?.length > 0 && selectedVariants[0].id !== 'default' && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-5 backdrop-blur-sm space-y-4">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 text-left">
                                        {t('select_variant')} <span className="text-red-400">*</span>
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedVariants.map((variant) => (
                                            <div
                                                key={variant.id}
                                                onClick={() => handleVariantSelect(variant.id)}
                                                className={`cursor-pointer flex items-center justify-between p-2 sm:p-3.5 rounded-xl border-2 transition-all duration-300 ${variant.quantity > 0 ? 'border-brand bg-white/10 shadow-[0_0_15px_rgba(81, 115, 251,0.2)]' : 'border-white/10 bg-black/20 hover:border-white/30 hover:bg-white/5'}`}
                                            >
                                                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                                    {/* Radio Bullet Indicator */}
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${variant.quantity > 0 ? 'border-white bg-white/10' : 'border-white/20'}`}>
                                                        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${variant.quantity > 0 ? 'bg-white scale-100' : 'bg-transparent scale-0'}`} />
                                                    </div>
                                                    <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-white shrink-0">
                                                        <img src={variant.image} alt={variant.color ? variant.color.name : product.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = product.images?.[0]?.image || ''; }} loading="eager" />
                                                    </div>
                                                    <div className="flex flex-col items-start text-left min-w-0 flex-1">
                                                        <h4 className="font-bold text-white leading-tight text-sm sm:text-base truncate w-full">
                                                            {product.name}
                                                        </h4>
                                                        <p className="text-[10px] sm:text-xs text-slate-300 font-medium truncate w-full">
                                                            {[variant.color?.name, variant.size?.name].filter(Boolean).join(' ') || 'Standard'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0 ml-2">
                                                    <span className="font-black text-white text-sm sm:text-base">৳{Math.floor(variant.price)}</span>
                                                    <div className="flex items-center bg-black/40 rounded-lg border border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleVariantQuantityChange(variant.id, -1); }}
                                                            className="px-2 sm:px-3 py-0.5 sm:py-1 text-white hover:bg-white/20 transition-colors font-bold text-base sm:text-lg"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 text-white font-bold min-w-[1.5rem] sm:min-w-[2.5rem] text-center border-x border-white/10 text-xs sm:text-sm">
                                                            {variant.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleVariantQuantityChange(variant.id, 1); }}
                                                            className="px-2 sm:px-3 py-0.5 sm:py-1 text-white hover:bg-white/20 transition-colors font-bold text-base sm:text-lg"
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
                                                placeholder="আপনার মোবাইল নাম্বার"
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
                                            placeholder="আপনার ঠিকানা, জেলা এবং থানাসহ বিস্তারিত লিখুন"
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
                                            <option value="" className="bg-slate-800">{siteSettings?.enable_district_upazila !== false ? '...' : t('select_shipping_zone')}</option>
                                            {shippingZones.map(zone => {
                                                const displayName = zone.name.toLowerCase().includes('inside dhaka city')
                                                    ? 'ঢাকা সিটির ভেতরে'
                                                    : zone.name.toLowerCase().includes('outside dhaka city')
                                                        ? 'ঢাকা সিটির বাইরে'
                                                        : zone.name;
                                                return (
                                                    <option key={zone.id} value={zone.id} className="bg-slate-800">
                                                        {displayName} - ৳{parseFloat(zone.shipping_cost).toFixed(0)}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" size={20} />
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
                                                    <img src={resolveImageUrl(activeVariant?.image || product.image || product.images?.[0]?.image)} alt={product.name} className="w-full h-full object-cover" loading="eager" />
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
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-gradient-to-r from-brand to-brand hover:from-brand hover:to-brand text-white font-black text-2xl py-6 rounded-2xl shadow-[0_0_30px_rgba(81, 115, 251,0.3)] hover:shadow-[0_0_50px_rgba(81, 115, 251,0.5)] transform transition-all duration-300 active:scale-95 flex justify-center items-center gap-3 group relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
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
        );
    }

    // Hero Section Image List
    const heroSliderImages = [];
    if (product.images && product.images.length > 0) {
        product.images.forEach(img => {
            if (img.image) heroSliderImages.push(img.image);
        });
    } else if (product.image) {
        heroSliderImages.push(product.image);
    }
    if (heroSliderImages.length === 0) {
        heroSliderImages.push('');
    }

    return (
        <div className="bg-[#f8f9ff] min-h-screen font-sans text-slate-800 overflow-x-hidden">
            {/* Top Limited Offer Strip */}
            <div className="bg-gradient-to-r from-brand via-[#8B5CF6] to-[#BC14CD] text-white py-3 px-4 shadow-md relative z-30 border-b border-white/10">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <Zap size={15} className="text-yellow-400 fill-yellow-400 shrink-0 animate-pulse" />
                    <div className="whitespace-pre-line text-center text-xs sm:text-sm font-extrabold leading-relaxed tracking-wider flex-1 uppercase">
                        সীমিত সময়ের অফার — ক্যাশ অন ডেলিভারি সুবিধা!
                    </div>
                    <Zap size={15} className="text-yellow-400 fill-yellow-400 shrink-0 animate-pulse" />
                </div>
            </div>

            {/* Premium organic warm gradient Hero Section (Centered Layout as requested) */}
            <div className="relative pb-24 pt-16 overflow-hidden bg-gradient-to-b from-[#f3f4ff] to-[#f9fafb] border-b border-slate-100">
                {/* Custom float keyframes and standard CSS classes injected inline */}
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes float-gentle-kf {
                        0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
                        50% { transform: translateY(-12px) rotate(4deg) scale(1.03); }
                    }
                    @keyframes float-reverse-kf {
                        0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
                        50% { transform: translateY(12px) rotate(-4deg) scale(1.03); }
                    }
                    .float-gentle-anim {
                        animation: float-gentle-kf 8s ease-in-out infinite;
                    }
                    .float-reverse-anim {
                        animation: float-reverse-kf 9s ease-in-out infinite;
                    }
                `}} />

                {/* Left Animated Side Shape */}
                <div className="absolute left-[-3rem] md:left-[-4rem] top-[15%] z-0 text-brand/15 w-36 h-36 md:w-52 md:h-52 pointer-events-none select-none float-gentle-anim">
                    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
                        {/* Abstract organic fluid background */}
                        <path d="M30,100 C30,40 80,20 130,40 C180,60 170,140 120,160 C70,180 30,160 30,100 Z" fill="currentColor" opacity="0.4" />
                        {/* Elegant leaf overlay */}
                        <path d="M70,140 C70,140 110,90 100,50 C90,10 110,30 110,30" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                        <path d="M100,80 C120,70 140,80 130,100" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                        <path d="M95,110 C115,100 135,110 125,130" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                        <path d="M103,60 C83,70 63,60 73,40" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                    </svg>
                </div>

                {/* Right Animated Side Shape */}
                <div className="absolute right-[-3rem] md:right-[-4rem] top-[40%] z-0 text-[#8B5CF6]/15 w-36 h-36 md:w-52 md:h-52 pointer-events-none select-none float-reverse-anim">
                    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
                        {/* Abstract organic fluid background */}
                        <path d="M40,90 C40,30 110,20 150,50 C190,80 180,160 130,170 C80,180 40,150 40,90 Z" fill="currentColor" opacity="0.4" />
                        {/* Elegant leaf overlay */}
                        <path d="M130,60 C130,60 90,110 100,150 C110,190 90,170 90,170" stroke="currentColor" strokeWidth="2" opacity="0.6" />
                        <path d="M100,120 C80,130 60,120 70,100" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                        <path d="M105,90 C85,100 65,90 75,70" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                        <path d="M97,140 C117,130 137,140 127,160" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                    </svg>
                </div>

                <div className="container mx-auto px-4 z-10 relative max-w-6xl text-center space-y-8">
                    {/* Top Brand Subtitle */}
                    {funnel?.top_header_line_1 && (
                        <div className="hero-text-anim text-brand font-black text-sm uppercase tracking-widest">
                            {funnel.top_header_line_1}
                        </div>
                    )}

                    {/* Bold Centered Main Product Name */}
                    <h1 className="hero-text-anim text-xl sm:text-2xl lg:text-3xl font-black text-[#1e1b4b] leading-tight max-w-4xl mx-auto">
                        {funnel.top_header_line_2}
                    </h1>

                    {/* Premium Multi-Card Slider exactly matching screenshot */}
                    <div className="hero-image-anim w-full max-w-5xl mx-auto">
                        <Swiper
                            modules={[Navigation, Pagination, Autoplay]}
                            slidesPerView={1}
                            spaceBetween={16}
                            breakpoints={{
                                640: { slidesPerView: 2, spaceBetween: 20 },
                                1024: { slidesPerView: 3, spaceBetween: 24 }
                            }}
                            navigation={true}
                            pagination={{ clickable: true }}
                            autoplay={{ delay: 3500, disableOnInteraction: false }}
                            className="product-hero-swiper pb-10"
                        >
                            <style dangerouslySetInnerHTML={{
                                __html: `
                                .product-hero-swiper .swiper-pagination {
                                    bottom: 0px !important;
                                    position: relative !important;
                                    margin-top: 20px !important;
                                }
                                .product-hero-swiper .swiper-pagination-bullet {
                                    width: 8px !important;
                                    height: 8px !important;
                                    background: #cbd5e1 !important;
                                    opacity: 1 !important;
                                    margin: 0 5px !important;
                                    border-radius: 50% !important;
                                    transition: all 0.3s ease !important;
                                }
                                .product-hero-swiper .swiper-pagination-bullet-active {
                                    background: #C0561F !important;
                                    opacity: 1 !important;
                                }
                            `}} />
                            {heroSliderImages.map((imgUrl, idx) => (
                                <SwiperSlide key={idx}>
                                    <div className="bg-white border-2 border-brand/25 rounded-2xl overflow-hidden aspect-square flex items-center justify-center p-4 shadow-md transition-all duration-300">
                                        <img 
                                            src={imgUrl} 
                                            alt={`${product.name} - ${idx + 1}`} 
                                            className="w-full h-full object-fill" 
                                            loading="eager" 
                                        />
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                    {/* Centered Solid Dark Maroon Order Button */}
                    <div className="hero-text-anim flex justify-center pt-2">
                        <button
                            onClick={() => document.getElementById('order-form').scrollIntoView({ behavior: 'smooth' })}
                            className="bg-gradient-to-r from-brand via-[#8B5CF6] to-[#BC14CD] hover:opacity-90 text-white font-extrabold text-lg px-12 py-4.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <ShoppingCart size={20} /> এখনই অর্ডার করুন
                        </button>
                    </div>
                </div>

            </div>

            {/* 3D Realistic Torn Paper Notebook Strip */}
            <div className="price-strip-trigger w-full py-14 relative z-20 bg-gradient-to-b from-[#f3f4ff] to-[#f9fafb] flex justify-center px-4 overflow-hidden border-b border-slate-100">
                <div className="relative w-full max-w-lg bg-white shadow-[0_20px_50px_rgba(81, 115, 251,0.08)] rounded-[3rem_1rem_3rem_1rem] border-2 border-brand/25 p-8 py-10 flex flex-col items-center justify-center select-none overflow-visible">
                    
                    {/* Top-Left Floating Botanical Leaf Accent */}
                    <div className="absolute -top-6 -left-6 z-10 text-[#8B5CF6]/30 w-16 h-16 pointer-events-none select-none">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full transform -rotate-[15deg]">
                            <path d="M12 2C12 2 15 7 12 12C9 17 12 22 12 22" />
                            <path d="M12 5C14 6 16 9 15 11" />
                            <path d="M12 9C14 10 16 13 15 15" />
                            <path d="M12 8C10 9 8 12 9 14" />
                            <path d="M12 4C10 5 8 8 9 10" />
                        </svg>
                    </div>

                    {/* Bottom-Right Floating Botanical Leaf Accent */}
                    <div className="absolute -bottom-6 -right-6 z-10 text-brand/30 w-16 h-16 pointer-events-none select-none">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full transform rotate-[165deg]">
                            <path d="M12 2C12 2 15 7 12 12C9 17 12 22 12 22" />
                            <path d="M12 5C14 6 16 9 15 11" />
                            <path d="M12 9C14 10 16 13 15 15" />
                            <path d="M12 8C10 9 8 12 9 14" />
                            <path d="M12 4C10 5 8 8 9 10" />
                        </svg>
                    </div>

                    {/* Pricing Content */}
                    <div className="relative z-10 space-y-6 text-center w-full">
                        {/* Regular Price Strip */}
                        <div className="text-neutral-500/90 font-bold text-base md:text-lg flex items-center justify-center gap-2 flex-wrap font-serif italic">
                            {language === 'bn' ? 'রেগুলার প্রাইস:' : 'Regular Price:'}
                            <span className="relative inline-flex items-center justify-center px-3 not-italic">
                                <span className="absolute left-0 right-0 h-[2px] bg-red-500/80 rounded rotate-[-4deg]" />
                                <span className="font-extrabold text-slate-500 text-lg md:text-xl">
                                    ৳{language === 'bn' ? toBanglaNumber(Math.floor(product.regular_price)) : Math.floor(product.regular_price)}
                                </span>
                            </span>
                            {language === 'bn' ? 'টাকা।' : 'Taka.'}
                        </div>

                        {/* Special Asymmetric Highlight Plaque for Offer Price */}
                        <div className="relative inline-block px-10 py-5 mx-auto bg-gradient-to-r from-brand via-[#8B5CF6] to-[#BC14CD] text-white shadow-xl rounded-[2rem_0.5rem_2rem_0.5rem] border border-brand/30 transform rotate-[-1deg] max-w-sm">
                            <div className="font-black text-lg md:text-xl tracking-wide flex items-center justify-center gap-2 flex-wrap text-white/95">
                                {language === 'bn' ? 'অফার প্রাইস' : 'Discount Price'}
                                <span className="relative z-10 font-black text-yellow-400 text-2xl md:text-3xl drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.6)] px-1">
                                    ৳{language === 'bn' ? toBanglaNumber(Math.floor(product.sale_price || product.regular_price)) : Math.floor(product.sale_price || product.regular_price)}
                                </span>
                                {language === 'bn' ? 'টাকা।' : 'Taka.'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alternating content sections inspired directly by Kazirhat */}
            <div className="py-16 space-y-16">
                <div className="section-1-trigger container mx-auto px-4 max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="sec-1-content space-y-6 text-center md:text-left">
                            {/* Centered Premium Description Bangla Text */}
                            <p className="hero-text-anim text-lg sm:text-xl font-bold text-[#1e1b4b] max-w-3xl mx-auto leading-relaxed px-4">
                                {funnel.top_header_line_3}
                            </p>
                            <div className="space-y-4">
                                {dynamicWhyBuyList.map((reason, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                        <span className="w-6 h-6 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shrink-0">
                                            <span className="text-[10px] font-bold">✔</span>
                                        </span>
                                        <span className="font-bold text-slate-800 text-sm leading-snug">{reason}</span>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => document.getElementById('order-form').scrollIntoView({ behavior: 'smooth' })}
                                className="bg-gradient-to-r from-brand to-[#8B5CF6] hover:opacity-90 text-white font-bold text-base py-4 px-8 rounded-2xl transition-all shadow-md"
                            >
                                এখনই অর্ডার করুন
                            </button>
                        </div>

                        <div className="sec-1-image flex justify-center">
                            <div className="w-full max-w-[360px] rounded-3xl overflow-hidden border-2 border-[#8B5CF6]/30 shadow-xl">
                                <img src={product.images?.[0]?.image || product.image} alt={product.name} className="w-full h-auto object-cover" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="section-2-trigger container mx-auto px-4 max-w-4xl border-t border-slate-200/60 pt-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="sec-2-content flex justify-center md:order-last">
                            <div className="space-y-6 text-center md:text-left">
                                <h3 className="text-xl md:text-2xl font-black text-[#1e1b4b]">
                                   {funnel?.top_header_line_4 || "কেন আমাদের পণ্যটি নিবেন?"}
                                </h3>
                                <div className="space-y-3 font-semibold text-slate-700 text-sm md:text-base text-left">
                                    {product.short_description ? (
                                        <div dangerouslySetInnerHTML={{ __html: product.short_description }} className="prose prose-slate max-w-none product-description-content" />
                                    ) : (
                                        <p>আমাদের পণ্যটি সকলের জন্য উপযুক্ত!</p>
                                    )}
                                </div>
                                <button 
                                    onClick={() => document.getElementById('order-form').scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-gradient-to-r from-brand to-[#8B5CF6] hover:opacity-90 text-white font-bold text-base py-4 px-8 rounded-2xl transition-all shadow-md"
                                >
                                    এখনই অর্ডার করুন
                                </button>
                            </div>
                        </div>

                        <div className="sec-2-image flex justify-center">
                            <div className="w-full max-w-[360px] rounded-3xl overflow-hidden border-2 border-[#8B5CF6]/30 shadow-xl">
                                <img src={product.images?.[1]?.image || product.images?.[0]?.image || product.image} alt={product.name} className="w-full h-auto object-cover" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Reviews gallery swiper */}
            {product.funnel_sections && product.funnel_sections.length > 0 && (
                <div className="py-16 bg-[#f8f9ff] border-y border-slate-100">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <div className="text-center mb-12 space-y-3">
                            <h2 className="text-xl md:text-2xl font-black text-[#1e1b4b] uppercase">
                                আমাদের কাস্টমারদের বাস্তব রিভিউজ
                            </h2>
                            <div className="w-20 h-1 bg-[#8B5CF6] mx-auto rounded-full" />
                        </div>
                        <div className="relative review-swiper-container">
                             <Swiper
                                 modules={[Pagination, Autoplay, Navigation]}
                                 spaceBetween={24}
                                 slidesPerView={1}
                                 breakpoints={{
                                     640: { slidesPerView: 2 },
                                     1024: { slidesPerView: 3 },
                                 }}
                                 navigation={true}
                                 pagination={{ clickable: true }}
                                 autoplay={{ delay: 3000, disableOnInteraction: false }}
                                 className="pb-12"
                             >
                                <style dangerouslySetInnerHTML={{
                                    __html: `
                                    .review-swiper-container .swiper-pagination-bullet-active {
                                        background: #C0561F !important;
                                    }
                                `}} />
                                {product.funnel_sections.map((section, idx) => (
                                    <SwiperSlide key={section.id || idx}>
                                        <div className="rounded-3xl overflow-hidden h-full flex flex-col p-4">
                                            <div className="relative overflow-hidden rounded-2xl w-full flex items-center justify-center bg-slate-50 border border-slate-100">
                                                {section.image ? (
                                                    <img src={section.image} alt={section.title} className="w-auto h-auto rounded-2xl" loading="eager" />
                                                ) : (
                                                    <div className="w-full aspect-square bg-brand/5 flex items-center justify-center rounded-2xl">
                                                        <Zap className="text-brand/20" size={36} />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {(section.title || section.text) && (
                                                <div className="pt-4 text-left space-y-2">
                                                    {section.title && <h3 className="font-extrabold text-[#1e1b4b] text-base leading-tight">{section.title}</h3>}
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

            {/* Premium Glassmorphic Dark Golden Checkout Container */}
            <div id="order-form" ref={formRef} className="py-12 relative overflow-hidden bg-gradient-to-b from-[#3d1625] to-[#3d1625]">
                <div className="container mx-auto px-4 max-w-4xl relative z-10 checkout-form-container">
                    <div className="text-center text-white mb-8 sm:mb-12">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-6 drop-shadow-md">
                            {language === 'bn' ? 'অর্ডার করতে ফর্মটি পূরণ করুন' : 'Fill out the form to order'}
                        </h2>
                    </div>

                    {/* Glassmorphism Card */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden relative">
                        {/* Shimmer Effect */}
                        <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] animate-[shimmer_3s_infinite]"></div>
            
                        <div className="p-3 sm:p-5 text-center shadow-md relative z-10">
                            {/* Variant Selection List */}
                            {selectedVariants?.length > 0 && selectedVariants[0].id !== 'default' && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-5 backdrop-blur-sm space-y-4">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 text-left">
                                        {t('select_variant')} <span className="text-red-400">*</span>
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedVariants.map((variant) => (
                                            <div
                                                key={variant.id}
                                                onClick={() => handleVariantSelect(variant.id)}
                                                className={`cursor-pointer flex items-center justify-between p-2 sm:p-3.5 rounded-xl border-2 transition-all duration-300 ${variant.quantity > 0 ? 'border-brand bg-white/10 shadow-[0_0_15px_rgba(81, 115, 251,0.2)]' : 'border-white/10 bg-black/20 hover:border-white/30 hover:bg-white/5'}`}
                                            >
                                                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                                    {/* Radio Bullet Indicator */}
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${variant.quantity > 0 ? 'border-white bg-white/10' : 'border-white/20'}`}>
                                                        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${variant.quantity > 0 ? 'bg-white scale-100' : 'bg-transparent scale-0'}`} />
                                                    </div>
                                                    <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-white shrink-0">
                                                        <img src={variant.image} alt={variant.color ? variant.color.name : product.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = product.images?.[0]?.image || ''; }} loading="eager" />
                                                    </div>
                                                    <div className="flex flex-col items-start text-left min-w-0 flex-1">
                                                        <h4 className="font-bold text-white leading-tight text-sm sm:text-base truncate w-full">
                                                            {product.name}
                                                        </h4>
                                                        <p className="text-[10px] sm:text-xs text-slate-300 font-medium truncate w-full">
                                                            {[variant.color?.name, variant.size?.name].filter(Boolean).join(' ') || 'Standard'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0 ml-2">
                                                    <span className="font-black text-white text-sm sm:text-base">৳{Math.floor(variant.price)}</span>
                                                    <div className="flex items-center bg-black/40 rounded-lg border border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleVariantQuantityChange(variant.id, -1); }}
                                                            className="px-2 sm:px-3 py-0.5 sm:py-1 text-white hover:bg-white/20 transition-colors font-bold text-base sm:text-lg"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 text-white font-bold min-w-[1.5rem] sm:min-w-[2.5rem] text-center border-x border-white/10 text-xs sm:text-sm">
                                                            {variant.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleVariantQuantityChange(variant.id, 1); }}
                                                            className="px-2 sm:px-3 py-0.5 sm:py-1 text-white hover:bg-white/20 transition-colors font-bold text-base sm:text-lg"
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
                                                placeholder="আপনার মোবাইল নাম্বার"
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
                                            placeholder="আপনার ঠিকানা, জেলা এবং থানাসহ বিস্তারিত লিখুন"
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
                                            <option value="" className="bg-slate-800">{siteSettings?.enable_district_upazila !== false ? '...' : t('select_shipping_zone')}</option>
                                            {shippingZones.map(zone => {
                                                const displayName = zone.name.toLowerCase().includes('inside dhaka city')
                                                    ? 'ঢাকা সিটির ভেতরে'
                                                    : zone.name.toLowerCase().includes('outside dhaka city')
                                                        ? 'ঢাকা সিটির বাইরে'
                                                        : zone.name;
                                                return (
                                                    <option key={zone.id} value={zone.id} className="bg-slate-800">
                                                        {displayName} - ৳{parseFloat(zone.shipping_cost).toFixed(0)}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" size={20} />
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
                                                    <img src={resolveImageUrl(activeVariant?.image || product.image || product.images?.[0]?.image)} alt={product.name} className="w-full h-full object-cover" loading="eager" />
                                                </div>
                                                <span className="font-bold text-left">
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
                                        <p className="text-sm font-medium text-white/70 text-center mt-3 leading-relaxed">
                                            ক্যাশ অন ডেলিভারি, কোনো প্রকার অগ্রিম পেমেন্টের প্রয়োজন নেই
                                        </p>
                                    </div>
                                </div>

                                <button
                                    ref={submitBtnRef}
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-gradient-to-r from-brand via-[#8B5CF6] to-[#BC14CD] text-white font-black text-2xl py-6 rounded-2xl shadow-[0_0_30px_rgba(81,115,251,0.3)] hover:shadow-[0_0_50px_rgba(81,115,251,0.5)] transform transition-all duration-300 active:scale-95 flex justify-center items-center gap-3 group relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
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
            <div className="bg-slate-900 text-slate-400 py-12 text-center text-xs font-semibold border-t border-slate-800">
                <div className="container mx-auto px-4 max-w-4xl space-y-2">
                    <p className="mb-2 font-medium text-white">© 2026 Spaceghor. Developed by <a href="https://ctsolutionbd.com" target="_blank" rel="noopener noreferrer" className='text-white hover:text-slate-300 transition-colors'>Cyber and Tech Solution</a>.</p>
                </div>
            </div>

            {/* Mobile Sticky CTA */}
            <div className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md p-4 border-t border-slate-200 lg:hidden z-50 transition-transform duration-300 ${showMobileCTA ? 'translate-y-0' : 'translate-y-full'}`}>
                <a href="#order-form" className="flex items-center justify-center w-full bg-brand hover:bg-brand text-white font-bold py-4.5 rounded-2xl text-lg shadow-lg active:scale-95 transition-all gap-2">
                    <ShoppingCart size={18} /> এখনই অর্ডার করুন - ৳{finalTotal}
                </a>
            </div>
        </div>
    );
};

export default GardenFunnelLayout;
