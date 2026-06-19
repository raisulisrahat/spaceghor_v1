import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ChevronDown, Star, CheckCircle, ArrowRight, Clock, Phone, MapPin, Zap, Award, Check, Sparkles, TrendingUp, ShoppingCart } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const PremiumFunnelLayout = ({
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
    const [currentTime, setCurrentTime] = useState('04:59:59');

    const whyBuyFromUs = [
        "100% Authentic Luxury Quality",
        "Fast & Fully Insured Express Delivery",
        "No Advance Payment Required",
        "Open & Inspect Package Before Payment",
        "7 Days Satisfied Return Guarantee"
    ];

    const dynamicWhyBuyList = funnel?.features_list
        ? funnel.features_list.split('\n').map(item => item.trim()).filter(Boolean)
        : whyBuyFromUs;

    useEffect(() => {
        const timer = setInterval(() => {
            // Mock countdown
            setCurrentTime(prev => {
                const parts = prev.split(':');
                let h = parseInt(parts[0]);
                let m = parseInt(parts[1]);
                let s = parseInt(parts[2]);
                if (s > 0) s--;
                else if (m > 0) { m--; s = 59; }
                else if (h > 0) { h--; m = 59; s = 59; }
                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="bg-white min-h-screen font-sans text-neutral-900 pb-24">
            {/* Urgency Header */}
            <div className="bg-brand text-white py-4 px-6 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-50 shadow-2xl animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
                    <span className="text-sm font-black tracking-tighter uppercase">{funnel?.top_header_line_1 || "Flash Sale is Live! Save 35% Today"}</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span className="text-sm font-black font-mono tracking-widest">{currentTime}</span>
                    </div>
                    <a href="#order-form" className="bg-white text-brand px-6 py-2 rounded-full text-xs font-black uppercase hover:bg-neutral-100 transition-colors">Claim Offer</a>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-16 space-y-24">
                
                {/* Hero / Main Product Showcase */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                         <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/5 text-brand rounded-full text-xs font-black uppercase tracking-widest">
                             <Sparkles size={14} /> Luxury Collection 2026
                         </div>
                         <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] text-neutral-900">
                             {funnel?.title || product.name}
                         </h1>
                         <p className="text-lg text-neutral-500 font-medium leading-relaxed">
                             Experience the pinnacle of craftsmanship and design. Our most sought-after product is now available for a limited time at an exclusive price.
                         </p>
                         
                         <div className="flex items-baseline gap-6 pt-4">
                             <span className="text-6xl font-black text-brand tracking-tighter">৳{Math.floor(product.sale_price || product.regular_price)}</span>
                             <span className="text-2xl font-bold text-neutral-300 line-through tracking-tighter">৳{Math.floor(product.regular_price)}</span>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                              <div className="p-6 bg-neutral-50 rounded-3xl border border-neutral-100 flex flex-col gap-2">
                                  <TrendingUp className="text-brand" size={24} />
                                  <p className="text-[10px] font-black uppercase text-neutral-400">Demand</p>
                                  <p className="font-bold">High (34 Sold Today)</p>
                              </div>
                              <div className="p-6 bg-neutral-50 rounded-3xl border border-neutral-100 flex flex-col gap-2">
                                  <ShieldCheck className="text-brand" size={24} />
                                  <p className="text-[10px] font-black uppercase text-neutral-400">Protection</p>
                                  <p className="font-bold">Official Warranty</p>
                              </div>
                         </div>
                    </div>

                    <div className="relative group">
                         <div className="absolute inset-0 bg-brand rounded-[3rem] blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                         <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
                             <img 
                                 src={product.images?.[0]?.image || ''} 
                                 alt={product.name} 
                                 className="w-full h-full object-cover aspect-square hover:scale-105 transition-transform duration-700" 
                             />
                         </div>
                    </div>
                </div>

                {/* Benefits / Social Proof */}
                <div className="bg-neutral-50 rounded-3xl sm:rounded-[4rem] p-6 sm:p-12 md:p-20 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto text-brand">
                            <ChevronDown size={32} />
                        </div>
                        <h3 className="text-xl font-black tracking-tight">Express Shipping</h3>
                        <p className="text-neutral-500 font-medium text-sm">Delivery within 24-72 hours across Bangladesh.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto text-brand">
                            <Zap size={32} />
                        </div>
                        <h3 className="text-xl font-black tracking-tight">Cash on Delivery</h3>
                        <p className="text-neutral-500 font-medium text-sm">No advance payment needed. Pay after you check.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto text-brand">
                            <TrendingUp size={32} />
                        </div>
                        <h3 className="text-xl font-black tracking-tight">Satisfaction</h3>
                        <p className="text-neutral-500 font-medium text-sm">Over 5,000+ happy customers love our products.</p>
                    </div>
                </div>

                {/* Features Checklist */}
                <div className="bg-neutral-50 rounded-3xl sm:rounded-[4rem] p-6 sm:p-12 md:p-20 space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-neutral-900">
                            {funnel?.top_header_line_2 || "Why Choose Premium?"}
                        </h2>
                        <p className="text-lg text-neutral-500 font-medium max-w-xl mx-auto">
                            We pride ourselves on offering only the finest materials and authentic master craftsmanship.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {dynamicWhyBuyList.map((reason, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-6 bg-white rounded-3xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                                <span className="w-10 h-10 rounded-2xl bg-brand/5 text-brand flex items-center justify-center shrink-0 shadow-inner">
                                    <CheckCircle size={20} />
                                </span>
                                <div className="space-y-1">
                                    <p className="font-bold text-neutral-800 text-base leading-relaxed uppercase tracking-wider">{reason}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Checkout Form */}
                <div id="order-form" className="bg-white rounded-3xl sm:rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(81, 115, 251,0.15)] border border-neutral-100 max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Order Summary Side */}
                        <div className="bg-brand p-6 sm:p-12 text-white space-y-10">
                            <div>
                                <h2 className="text-4xl font-black tracking-tighter leading-none mb-4">{t('complete_order')}</h2>
                                <p className="text-white/60 font-medium">{t('fill_in_details_desc')}</p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-6 p-4 bg-white/10 rounded-2xl border border-white/10">
                                    <div className="w-16 h-16 rounded-xl bg-white p-1 shrink-0">
                                        <img src={product.images?.[0]?.image} className="w-full h-full object-contain" alt="" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm truncate max-w-[200px]">{product.name}</p>
                                        <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Qty: 1</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-white/10">
                                    <div className="flex justify-between font-bold">
                                        <span className="text-white/50">{t('subtotal')}</span>
                                        <span>৳{subtotal}</span>
                                    </div>
                                    <div className="flex justify-between font-bold">
                                        <span className="text-white/50">{t('shipping')}</span>
                                        <span>৳{shippingCost}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4">
                                        <span className="text-lg font-black tracking-tight">{t('total_amount')}</span>
                                        <span className="text-4xl font-black tracking-tighter">৳{finalTotal}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-black/10 p-6 rounded-[2rem] border border-white/5">
                                 <ShieldCheck className="shrink-0 text-white/80" size={32} />
                                 <p className="text-xs font-bold text-white/80 uppercase tracking-widest leading-relaxed">Secured with 256-bit AES Encryption. Your data is safe.</p>
                            </div>
                        </div>

                        {/* Form Side */}
                        <div className="p-6 sm:p-12">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    {/* Variant Selection List */}
                                    {selectedVariants?.length > 0 && selectedVariants[0].id !== 'default' && (
                                        <div className="space-y-4">
                                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Select Variation</p>
                                            <div className="space-y-3">
                                                {selectedVariants.map((variant) => (
                                                    <div
                                                        key={variant.id}
                                                        onClick={() => handleVariantSelect(variant.id)}
                                                        className={`cursor-pointer flex items-center justify-between p-2 sm:p-3 rounded-2xl border-2 transition-all gap-2 sm:gap-3 ${variant.quantity > 0 ? 'border-brand bg-brand/5' : 'border-neutral-100 hover:border-neutral-200'}`}
                                                    >
                                                        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                                            <img src={variant.image} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-neutral-200 shrink-0" />
                                                            <span className="font-bold text-neutral-800 text-xs sm:text-sm truncate w-full block">{[variant.color?.name, variant.size?.name].filter(Boolean).join(' ') || 'Standard'}</span>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0 ml-2">
                                                            <span className="font-black text-xs sm:text-sm">৳{Math.floor(variant.price)}</span>
                                                            <div className="flex items-center bg-white rounded-lg border border-neutral-200" onClick={e => e.stopPropagation()}>
                                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleVariantQuantityChange(variant.id, -1); }} className="px-1.5 sm:px-3 py-0.5 sm:py-1 font-bold text-xs sm:text-sm">-</button>
                                                                <span className="px-1.5 sm:px-3 py-0.5 sm:py-1 font-bold border-x border-neutral-100 text-xs sm:text-sm min-w-[1.2rem] sm:min-w-[2rem] text-center">{variant.quantity}</span>
                                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleVariantQuantityChange(variant.id, 1); }} className="px-1.5 sm:px-3 py-0.5 sm:py-1 font-bold text-xs sm:text-sm">+</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="customer_name"
                                            required
                                            className="w-full px-4 sm:px-6 py-3.5 sm:py-5 bg-neutral-50 border border-neutral-100 rounded-2xl focus:bg-white focus:border-brand outline-none transition-all font-bold"
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
                                            className="w-full px-4 sm:px-6 py-3.5 sm:py-5 bg-neutral-50 border border-neutral-100 rounded-2xl focus:bg-white focus:border-brand outline-none transition-all font-bold"
                                            placeholder={`${t('phone_number')} *`}
                                            value={formData.phone_number}
                                            onChange={handleChange}
                                        />
                                        <input
                                            type="email"
                                            name="email"
                                            className="w-full px-4 sm:px-6 py-3.5 sm:py-5 bg-neutral-50 border border-neutral-100 rounded-2xl focus:bg-white focus:border-brand outline-none transition-all font-bold"
                                            placeholder="ইমেইল (অপশনাল)"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    {siteSettings?.enable_district_upazila !== false && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <select
                                                name="district"
                                                required
                                                className="w-full px-4 sm:px-6 py-3.5 sm:py-5 bg-neutral-50 border border-neutral-100 rounded-2xl focus:bg-white focus:border-brand outline-none transition-all font-bold appearance-none"
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
                                                className="w-full px-4 sm:px-6 py-3.5 sm:py-5 bg-neutral-50 border border-neutral-100 rounded-2xl focus:bg-white focus:border-brand outline-none transition-all font-bold appearance-none disabled:opacity-50"
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
                                    )}

                                    {siteSettings?.enable_district_upazila === false && (
                                        <div className="relative group">
                                            <select
                                                name="shipping_zone"
                                                required
                                                className="w-full px-4 sm:px-6 py-3.5 sm:py-5 bg-neutral-50 border border-neutral-100 rounded-2xl focus:bg-white focus:border-brand outline-none transition-all font-bold appearance-none"
                                                value={formData.shipping_zone}
                                                onChange={handleChange}
                                            >
                                                <option value="">{t('select_shipping_zone')}</option>
                                                {shippingZones.map(zone => {
                                                    const displayName = zone.name.toLowerCase().includes('inside dhaka city')
                                                        ? 'ঢাকা সিটির ভেতরে'
                                                        : zone.name.toLowerCase().includes('outside dhaka city')
                                                            ? 'ঢাকা সিটির বাইরে'
                                                            : zone.name;
                                                    return (
                                                        <option key={zone.id} value={zone.id}>
                                                            {displayName} (+ ৳{parseFloat(zone.shipping_cost).toFixed(0)})
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
                                        </div>
                                    )}
                                    <textarea
                                        name="address"
                                        required
                                        className="w-full px-4 sm:px-6 py-3.5 sm:py-5 bg-neutral-50 border border-neutral-100 rounded-2xl focus:bg-white focus:border-brand outline-none transition-all font-bold resize-none"
                                        placeholder="আপনার ঠিকানা, জেলা এবং থানাসহ বিস্তারিত লিখুন"
                                        rows={2}
                                        value={formData.address}
                                        onChange={handleChange}
                                    ></textarea>
                                    <textarea
                                        name="order_note"
                                        className="w-full px-4 sm:px-6 py-3.5 sm:py-5 bg-neutral-50 border border-neutral-100 rounded-2xl focus:bg-white focus:border-brand outline-none transition-all font-bold resize-none"
                                        placeholder="অর্ডার নোট (অপশনাল)"
                                        rows={1}
                                        value={formData.order_note}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-brand hover:bg-brand text-white font-black text-xl py-6 rounded-2xl shadow-xl shadow-red-700/20 transform transition-all active:scale-95 disabled:opacity-70 uppercase tracking-widest flex items-center justify-center gap-3"
                                >
                                    {submitting ? 'অর্ডার হচ্ছে...' : (
                                        <>
                                            {t('place_order')} <ArrowRight size={24} />
                                        </>
                                    )}
                                </button>

                                <div className="text-center">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">সম্ভাব্য ডেলিভারি: ২-৩ দিন</p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Customer Reviews Carousel */}
                {product.funnel_sections && product.funnel_sections.length > 0 && (
                    <div className="pt-20">
                        <div className="bg-[#FF6B00] rounded-t-[3rem] py-8 text-center shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase relative z-10">
                                কাস্টমার রিভিউ
                            </h2>
                        </div>
                        <div className="bg-white p-8 md:p-12 shadow-2xl border-x border-neutral-100">
                            <Swiper
                                modules={[Navigation, Pagination, Autoplay]}
                                spaceBetween={40}
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
                                {product.funnel_sections.map((section, idx) => (
                                    <SwiperSlide key={section.id || idx}>
                                        <div className="bg-neutral-50 rounded-[2.5rem] overflow-hidden border border-neutral-100 h-full flex flex-col items-center justify-center p-3 group/item transition-all hover:shadow-xl hover:-translate-y-2">
                                            {section.image ? (
                                                <img 
                                                    src={section.image} 
                                                    alt={section.title || "Review Screenshot"} 
                                                    className="w-auto h-auto max-h-[500px] object-contain rounded-xl mx-auto transition-transform duration-1000 group-hover/item:scale-105" 
                                                />
                                            ) : (
                                                <div className="w-full aspect-[9/16] max-h-[500px] bg-neutral-900 flex items-center justify-center rounded-xl">
                                                    <Zap className="text-white/10" size={64} />
                                                </div>
                                            )}
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                        <div className="bg-[#2563EB] rounded-b-[3rem] py-8 text-center shadow-2xl">
                            <button 
                                onClick={() => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' })}
                                className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase animate-bounce flex items-center justify-center gap-4 mx-auto"
                            >
                                <ShoppingCart size={32} /> অর্ডার করতে ক্লিক করুন
                            </button>
                        </div>
                    </div>
                )}

                {/* Final Trust Signal */}
                <div className="text-center space-y-6 pt-20">
                     <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">© 2026 Spaceghor. Developed by <a href="https://ctsolutionbd.com" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Cyber and Tech Solution</a>.</p>
                     <div className="flex justify-center gap-10 opacity-30 grayscale">
                         <img src="/payment-icons.png" className="h-8 w-auto grayscale" alt="" />
                         <ShieldCheck size={32} />
                         <Award size={32} />
                     </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumFunnelLayout;
