import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ChevronDown, Star, CheckCircle, ArrowRight, Clock, Phone, MapPin, Zap, Award, Check, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const ProfessionalFunnelLayout = ({
    product,
    funnel,
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
}) => {
    const { t, language } = useLanguage();
    const [selectedImage, setSelectedImage] = useState(product.images?.[0]?.image || '');
    
    const whyBuyFromUs = [
        "Premium Official Packaging",
        "Official Brand Warranty",
        "Quality Verified Products",
        "Easy 7-Day Returns",
        "Priority Customer Support"
    ];

    const dynamicWhyBuyList = funnel?.features_list
        ? funnel.features_list.split('\n').map(item => item.trim()).filter(Boolean)
        : whyBuyFromUs;

    return (
        <div className="bg-[#fafafa] min-h-screen font-serif text-slate-900 overflow-x-hidden">
            {/* Elegant Top Bar */}
            <div className="bg-[#800000] text-white py-2 px-4 text-center text-xs font-bold tracking-widest uppercase border-b border-white/10 animate-pulse">
                {funnel?.top_header_line_1 || "Premium Quality Guaranteed • Official Store • Trusted by 10k+ Customers"}
            </div>

            {/* Main Navigation Mockup */}
            <nav className="bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="text-2xl font-black text-[#800000] tracking-tighter uppercase italic">
                    {siteSettings?.site_title}
                </div>
                <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <span className="text-[#800000]">Product Info</span>
                    <span>Reviews</span>
                    <span>Specifications</span>
                    <a href="#order-form" className="bg-[#800000] text-white px-6 py-2 rounded-full hover:bg-black transition-colors">Order Now</a>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left Column: Content & Details (Col 7) */}
                    <div className="lg:col-span-7 space-y-12">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            <div className="aspect-square md:aspect-[4/3] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 p-8">
                                <img src={selectedImage} alt={product.name} className="w-full h-full object-contain" />
                            </div>
                            {product.images && product.images.length > 1 && (
                                <div className="flex gap-4 overflow-x-auto pb-2 scroll-hide">
                                    {product.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(img.image)}
                                            className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-white ${selectedImage === img.image ? 'border-[#800000] scale-105 shadow-lg' : 'border-slate-100 opacity-60'}`}
                                        >
                                            <img src={img.image} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Headlines */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-[#800000] font-bold text-sm uppercase tracking-widest">
                                <Award size={18} /> Verified Original Product
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                                {product.name}
                            </h1>
                            <div className="flex items-center gap-6">
                                <div className="flex text-[#800000]">
                                    <Star fill="currentColor" size={20} /><Star fill="currentColor" size={20} /><Star fill="currentColor" size={20} /><Star fill="currentColor" size={20} /><Star fill="currentColor" size={20} />
                                </div>
                                <span className="text-slate-400 font-bold border-l border-slate-200 pl-6">128+ Reviews</span>
                            </div>
                            
                            <div className="prose prose-slate prose-lg max-w-none font-sans text-slate-600">
                                <div dangerouslySetInnerHTML={{ __html: product.short_description }} className="product-description-content"></div>
                            </div>
                        </div>

                        {/* Professional Highlights */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2 font-serif">
                                <span className="w-1.5 h-6 bg-[#800000] rounded-full"></span>
                                {funnel?.top_header_line_2 || "Key Highlights"}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {dynamicWhyBuyList.map((text, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-[#800000]/10 flex items-center justify-center text-[#800000] shrink-0 mt-1">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                        <p className="font-bold text-slate-700 font-sans">{text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Checkout (Col 5) */}
                    <div className="lg:col-span-5">
                        <div id="order-form" className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden sticky top-28">
                            <div className="p-8 md:p-10 space-y-8">
                                <div className="text-center space-y-2 border-b border-slate-100 pb-8">
                                    <h2 className="text-3xl font-black text-[#800000] tracking-tight">{t('complete_order')}</h2>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest font-sans">{t('safe_secure_checkout')}</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Variant Selection Component */}
                                    {selectedVariants?.length > 0 && selectedVariants[0].id !== 'default' && (
                                        <div className="space-y-4">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans ml-1">{t('select_variant')}</p>
                                            <div className="space-y-3">
                                                {selectedVariants.map((variant) => (
                                                    <div
                                                        key={variant.id}
                                                        onClick={() => handleVariantSelect(variant.id)}
                                                        className={`cursor-pointer flex items-center justify-between p-2 sm:p-3 rounded-2xl border-2 transition-all font-sans gap-2 sm:gap-3 ${variant.quantity > 0 ? 'border-[#800000] bg-[#800000]/5' : 'border-slate-100 hover:border-slate-200'}`}
                                                    >
                                                        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                                            <img src={variant.image} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-slate-200 shrink-0" />
                                                            <span className="font-bold text-slate-900 text-xs sm:text-sm truncate w-full block">{[variant.color?.name, variant.size?.name].filter(Boolean).join(' ') || 'Standard'}</span>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0 ml-2">
                                                            <span className="font-black text-xs sm:text-sm">৳{Math.floor(variant.price)}</span>
                                                            <div className="flex items-center bg-white rounded-lg border border-slate-200" onClick={e => e.stopPropagation()}>
                                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleVariantQuantityChange(variant.id, -1); }} className="px-1.5 sm:px-3 py-0.5 sm:py-1 font-bold text-xs sm:text-sm">-</button>
                                                                <span className="px-1.5 sm:px-3 py-0.5 sm:py-1 font-bold border-x border-slate-100 text-xs sm:text-sm min-w-[1.2rem] sm:min-w-[2rem] text-center">{variant.quantity}</span>
                                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleVariantQuantityChange(variant.id, 1); }} className="px-1.5 sm:px-3 py-0.5 sm:py-1 font-bold text-xs sm:text-sm">+</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                name="customer_name"
                                                required
                                                className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-[#800000] outline-none transition-all font-sans font-bold"
                                                placeholder={`${t('full_name')} *`}
                                                value={formData.customer_name}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input
                                                type="tel"
                                                name="phone_number"
                                                required
                                                className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-[#800000] outline-none transition-all font-sans font-bold"
                                                placeholder={`${t('phone_number')} *`}
                                                value={formData.phone_number}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <select
                                                name="district"
                                                required
                                                className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-[#800000] outline-none transition-all font-sans font-bold appearance-none"
                                                value={formData.district}
                                                onChange={handleChange}
                                            >
                                                <option value="">{t('district')}</option>
                                                {districts.map(d => {
                                                    const displayName = d.name.includes('|')
                                                        ? (language === 'bn' ? d.name.split('|')[0].trim() : d.name.split('|')[1].trim())
                                                        : d.name;
                                                    return <option key={d.id} value={d.id}>{displayName}</option>;
                                                })}
                                            </select>
                                            <select
                                                name="upazila"
                                                required
                                                disabled={!formData.district}
                                                className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-[#800000] outline-none transition-all font-sans font-bold appearance-none disabled:opacity-50"
                                                value={formData.upazila}
                                                onChange={handleChange}
                                            >
                                                <option value="">{t('area_upazila')}</option>
                                                {upazilas.map(u => {
                                                    const displayName = u.name.includes('|')
                                                        ? (language === 'bn' ? u.name.split('|')[0].trim() : u.name.split('|')[1].trim())
                                                        : u.name;
                                                    return <option key={u.id} value={u.id}>{displayName}</option>;
                                                })}
                                            </select>
                                        </div>

                                        <textarea
                                            name="address"
                                            required
                                            className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-[#800000] outline-none transition-all font-sans font-bold resize-none"
                                            placeholder={t('write_full_address')}
                                            rows={2}
                                            value={formData.address}
                                            onChange={handleChange}
                                        ></textarea>
                                    </div>

                                    {/* Customer Reviews Section */}
                                    {product.funnel_sections && product.funnel_sections.length > 0 && (
                                        <div className="pt-8">
                                            <div className="bg-[#FF6B00] rounded-t-2xl py-4 text-center shadow-lg">
                                                <h2 className="text-xl font-black text-white tracking-tight">আমাদের কাস্টমার রিভিউ</h2>
                                            </div>
                                            <div className="bg-white p-4 border-x border-slate-100">
                                                <Swiper
                                                    modules={[Navigation, Pagination, Autoplay]}
                                                    spaceBetween={15}
                                                    slidesPerView={1}
                                                    breakpoints={{
                                                        640: { slidesPerView: 2 },
                                                        1024: { slidesPerView: 3 },
                                                    }}
                                                    navigation
                                                    pagination={{ clickable: true }}
                                                    autoplay={{ delay: 3000, disableOnInteraction: false }}
                                                    className="pb-8"
                                                >
                                                    {product.funnel_sections.map((section, idx) => (
                                                        <SwiperSlide key={section.id || idx}>
                                                            <div className="rounded-xl overflow-hidden border border-slate-100 flex flex-col items-center justify-center p-2 h-full bg-slate-50">
                                                                {section.image ? (
                                                                    <img 
                                                                        src={section.image} 
                                                                        className="w-auto h-auto max-h-[500px] object-contain rounded-xl mx-auto" 
                                                                        alt={section.title || "Review Screenshot"} 
                                                                    />
                                                                ) : (
                                                                    <div className="w-full aspect-[9/16] max-h-[500px] bg-slate-100 flex items-center justify-center text-slate-300 rounded-xl">
                                                                        <Zap size={32} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </SwiperSlide>
                                                    ))}
                                                </Swiper>
                                            </div>
                                            <div className="bg-blue-600 rounded-b-2xl py-4 text-center shadow-lg">
                                                <button 
                                                    type="button"
                                                    onClick={() => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' })}
                                                    className="text-white font-black text-sm uppercase tracking-widest animate-pulse"
                                                >
                                                    অর্ডার করতে ক্লিক করুন
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Order Totals */}
                                    <div className="bg-[#800000]/5 rounded-[2rem] p-8 space-y-4 border border-[#800000]/10 font-sans">
                                        <div className="flex justify-between font-bold text-slate-500">
                                            <span>{t('subtotal')}</span>
                                            <span>৳{subtotal}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-slate-500">
                                            <span>{t('shipping')}</span>
                                            <span>৳{shippingCost}</span>
                                        </div>
                                        <div className="h-px bg-[#800000]/10 my-4"></div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xl font-black text-slate-900 tracking-tight">{t('total_amount')}</span>
                                            <span className="text-4xl font-black text-[#800000]">৳{finalTotal}</span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-[#800000] hover:bg-black text-white font-black text-xl py-6 rounded-2xl shadow-xl shadow-[#800000]/20 transform transition-all active:scale-95 disabled:opacity-70 uppercase tracking-widest font-sans flex items-center justify-center gap-3"
                                    >
                                        {submitting ? 'অর্ডার হচ্ছে...' : (
                                            <>
                                                {t('place_order')} <ChevronRight size={24} />
                                            </>
                                        )}
                                    </button>
                                </form>
                                <div className="flex justify-center items-center gap-6 opacity-30 grayscale pt-4">
                                     <ChevronDown size={32} /> <ShieldCheck size={32} /> <Award size={32} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Footer */}
            <footer className="bg-slate-900 text-white py-20 px-4 mt-20">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <div className="text-3xl font-black tracking-tighter uppercase italic text-[#800000]">
                         {siteSettings?.site_title}
                    </div>
                    <div className="h-px bg-white/10 w-24 mx-auto"></div>
                    <div className="flex justify-center gap-10 text-xs font-bold uppercase tracking-widest text-slate-400">
                         <span>Privacy</span> <span>Terms</span> <span>Returns</span>
                    </div>
                    <p className="text-slate-600 text-[10px] font-bold tracking-widest uppercase">
                         © 2026 Spaceghor. Developed by <a href="https://ctsolutionbd.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Cyber and Tech Solution</a>.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default ProfessionalFunnelLayout;
