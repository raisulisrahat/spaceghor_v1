import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ChevronDown, Star, CheckCircle, ArrowRight, Clock, Phone, MapPin, Zap, Award, ShoppingCart, MessageCircle, Facebook } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { resolveImageUrl } from '../../utils/image';
import VideoPlayer from '../VideoPlayer';

const EzyFunnelLayout = ({
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
    const [showMobileCTA, setShowMobileCTA] = useState(true);
    const [videoRatio, setVideoRatio] = useState(null);
    const [isPortrait, setIsPortrait] = useState(false);
    const submitBtnRef = useRef(null);

    // Active Variant for Summary and display
    const activeVariant = selectedVariants?.find(v => v.quantity > 0) || selectedVariants?.[0];

    // Load Hind Siliguri font dynamically
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, []);

    // IntersectionObserver scroll animations
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -50px 0px' });

        const targets = document.querySelectorAll('.animate-on-scroll');
        targets.forEach(t => observer.observe(t));

        return () => observer.disconnect();
    }, []);

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

        if (siteSettings?.enable_district_upazila === false && !formData.shipping_zone) {
            setShippingError(language === 'bn' ? 'দয়া করে শিপিং এলাকা নির্বাচন করুন।' : 'Please select the shipping area.');
            document.getElementById('shipping_zone_select')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

    // Text highlight helper
    const highlightText = (text, highlightWords = [], highlightClass = "bg-[#ffff00] text-black px-2 py-0.5 rounded mx-1 font-black inline-block") => {
        if (!text) return '';
        
        const regex = /(\*\*.*?\*\*|\[.*?\])/g;
        const subParts = text.split(regex);
        if (subParts.length > 1) {
            return subParts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <span key={i} className={highlightClass}>{part.slice(2, -2)}</span>;
                }
                if (part.startsWith('[') && part.endsWith(']')) {
                    return <span key={i} className={highlightClass}>{part.slice(1, -1)}</span>;
                }
                return part;
            });
        }
        
        let result = [text];
        highlightWords.forEach(word => {
            let newResult = [];
            result.forEach(item => {
                if (typeof item === 'string') {
                    const subregex = new RegExp(`(${word})`, 'gi');
                    const splits = item.split(subregex);
                    splits.forEach(split => {
                        if (split.toLowerCase() === word.toLowerCase()) {
                            newResult.push(<span key={Math.random()} className={highlightClass}>{split}</span>);
                        } else {
                            newResult.push(split);
                        }
                    });
                } else {
                    newResult.push(item);
                }
            });
            result = newResult;
        });
        return result;
    };

    // Helper to extract YouTube video ID and construct embed URL
    const getYoutubeEmbedUrl = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0` : null;
    };

    // Wavy Double Underline Component
    const WavyUnderline = () => (
        <div className="flex justify-center mt-3">
            <svg className="w-48 h-4 text-brand" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M 0,3 Q 10,0 20,3 T 40,3 T 60,3 T 80,3 T 100,3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 0,7 Q 10,4 20,7 T 40,7 T 60,7 T 80,7 T 100,7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        </div>
    );

    // Dynamic features
    const defaultWhyBuy = [
        "100% জেনুইন ব্রান্ড প্রিমিয়াম কোয়ালিটি পণ্য ✅",
        "ডাবল প্রটেকশন বিশিষ্ট ইন্টেক্ট পলি প্যাকেজিং ✅",
        "TR 90 ফ্লেক্সিবল ও প্রিমিয়াম বিল্ড কোয়ালিটি ✅",
        "সারা বাংলাদেশে ফাস্ট ক্যাশ অন হোম ডেলিভারি ✅",
        "৭ দিনের ইজি রিটার্ন ও রিফান্ড গ্যারান্টি ✅"
    ];

    const dynamicWhyBuyList = funnel?.features_list
        ? funnel.features_list.split('\n').map(item => item.trim()).filter(Boolean)
        : defaultWhyBuy;

    // Get active video url
    const videoUrl = funnel?.video_url || product?.video_url || product?.funnel_sections?.find(s => s.video_url || s.video)?.video_url;
    const youtubeEmbedUrl = getYoutubeEmbedUrl(videoUrl);

    // Get active direct video file
    const activeVideoFile = product?.videos?.[0]?.video || product?.video || product?.funnel_sections?.find(s => s.video)?.video;
    const videoOptions = activeVideoFile ? {
        autoplay: true,
        controls: true,
        fill: true,
        loop: true,
        muted: true,
        playsinline: true,
        sources: [{
            src: resolveImageUrl(activeVideoFile),
            type: 'video/mp4'
        }]
    } : null;

    // For YouTube embeds, use standard 16/9 (can't detect dimensions from iframe)
    useEffect(() => {
        if (youtubeEmbedUrl) {
            setVideoRatio('16/9');
            setIsPortrait(false);
        }
    }, [youtubeEmbedUrl]);

    // Format prices for displays
    const regPriceStr = language === 'bn' ? toBanglaNumber(Math.floor(product.regular_price)) : Math.floor(product.regular_price);
    const salePriceStr = language === 'bn' ? toBanglaNumber(Math.floor(product.sale_price || product.regular_price)) : Math.floor(product.sale_price || product.regular_price);
    const shipCostStr = language === 'bn' ? toBanglaNumber(Math.floor(shippingCost || 100)) : Math.floor(shippingCost || 100);

    return (
        <div className="min-h-screen bg-[#f4f6f8] text-[#1e293b] font-['Hind_Siliguri',sans-serif] antialiased overflow-x-hidden">
            {/* Inject custom visual animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse-glow {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 15px #9f441685; }
                    50% { transform: scale(1.03); box-shadow: 0 0 30px #c0561f; }
                }
                .pulse-btn {
                    animation: pulse-glow 2.5s infinite ease-in-out;
                }
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .shimmer-overlay {
                    position: relative;
                    overflow: hidden;
                }
                .shimmer-overlay::after {
                    position: absolute;
                    top: 0; right: 0; bottom: 0; left: 0;
                    transform: translateX(-100%);
                    background-image: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0) 0%,
                        rgba(255, 255, 255, 0.3) 20%,
                        rgba(255, 255, 255, 0.6) 60%,
                        rgba(255, 255, 255, 0) 100%
                    );
                    animation: shimmer 2.5s infinite;
                    content: '';
                }
                .hand-drawn-circle {
                    stroke-dasharray: 400;
                    stroke-dashoffset: 400;
                    animation: draw-circle-anim 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                @keyframes draw-circle-anim {
                    0% { stroke-dashoffset: 400; opacity: 0; }
                    15% { stroke-dashoffset: 400; opacity: 1; }
                    45% { stroke-dashoffset: 0; opacity: 1; }
                    85% { stroke-dashoffset: 0; opacity: 1; }
                    90% { stroke-dashoffset: 400; opacity: 0; }
                    100% { stroke-dashoffset: 400; opacity: 0; }
                }
                .animate-on-scroll {
                    opacity: 0;
                    transform: translateY(40px);
                    transition: opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
                    will-change: opacity, transform;
                }
                .animate-on-scroll.is-visible {
                    opacity: 1;
                    transform: translateY(0);
                }
                /* Premium Circular VideoJS Play Button */
                .video-js .vjs-big-play-button {
                    width: 80px !important;
                    height: 80px !important;
                    line-height: 74px !important;
                    border-radius: 50% !important;
                    border: 3px solid #ffffff !important;
                    background-color: rgba(81, 115, 251, 0.85) !important; /* Premium brand amber/orange */
                    box-shadow: 0 0 20px rgba(81, 115, 251, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.2) !important;
                    color: #ffffff !important;
                    font-size: 2.8em !important;
                    top: 50% !important;
                    left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    margin: 0 !important;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    backdrop-filter: blur(4px) !important;
                }
                .video-js .vjs-big-play-button:hover {
                    background-color: #C0561F !important; /* solid premium brand orange */
                    transform: translate(-50%, -50%) scale(1.12) !important;
                    box-shadow: 0 0 35px rgba(81, 115, 251, 0.8), inset 0 0 15px rgba(255, 255, 255, 0.4) !important;
                    border-color: #ffffff !important;
                }
                .video-js .vjs-big-play-button .vjs-icon-placeholder:before {
                    position: static !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    height: 100% !important;
                    width: 100% !important;
                    margin-left: 2px !important; /* slightly offset play arrow so it centers optically inside a circle */
                }
                /* Hide big play button once the video has started playing */
                .video-js.vjs-has-started .vjs-big-play-button,
                .video-js.vjs-playing .vjs-big-play-button {
                    display: none !important;
                }
            `}} />

            {/* B. Hero / Video Section */}
            <section className="bg-[#0d0f4b] text-white pt-10 pb-16 px-4 relative overflow-hidden">
                {/* Premium Grainy Silk Gradient Background (Matches reference image) */}
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    <svg className="w-full h-full object-cover opacity-95" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            {/* Grain filter (Highly compatible, safe alpha mapping) */}
                            <filter id="silkNoise" colorInterpolationFilters="sRGB">
                                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
                                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0" />
                            </filter>
                            
                            {/* Radials matching user-uploaded reference image */}
                            <radialGradient id="meshCyan" cx="0%" cy="30%" r="65%">
                                <stop offset="0%" stopColor="#9ce2ff" stopOpacity="0.9" />
                                <stop offset="45%" stopColor="#3bb2ec" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#3bb2ec" stopOpacity="0" />
                            </radialGradient>
                            
                            <radialGradient id="meshTeal" cx="80%" cy="75%" r="65%">
                                <stop offset="0%" stopColor="#1073a3" stopOpacity="0.85" />
                                <stop offset="50%" stopColor="#0e1883" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#0e1883" stopOpacity="0" />
                            </radialGradient>
                            
                            <radialGradient id="meshIndigo" cx="30%" cy="95%" r="75%">
                                <stop offset="0%" stopColor="#0e1883" stopOpacity="0.95" />
                                <stop offset="60%" stopColor="#0d0f4b" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#0d0f4b" stopOpacity="0" />
                            </radialGradient>
                            
                            <radialGradient id="meshDark" cx="95%" cy="5%" r="55%">
                                <stop offset="0%" stopColor="#07070a" stopOpacity="0.95" />
                                <stop offset="65%" stopColor="#0d0f4b" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#0d0f4b" stopOpacity="0" />
                            </radialGradient>
                        </defs>
                        
                        {/* Base blue */}
                        <rect width="1000" height="1000" fill="#0d0f4b" />
                        
                        {/* Layered silk mesh gradients */}
                        <rect width="1000" height="1000" fill="url(#meshIndigo)" />
                        <rect width="1000" height="1000" fill="url(#meshTeal)" />
                        <rect width="1000" height="1000" fill="url(#meshCyan)" />
                        <rect width="1000" height="1000" fill="url(#meshDark)" />
                        
                        {/* Soft satin waves/folds */}
                        <path d="M-100,500 C200,300 400,700 700,400 C900,200 1100,600 1200,500 L1200,1200 L-100,1200 Z" fill="url(#meshTeal)" opacity="0.3" style={{ mixBlendMode: 'screen' }} />
                        <path d="M-100,200 C300,500 500,100 800,400 C950,550 1100,250 1200,300 L1200,1200 L-100,1200 Z" fill="url(#meshCyan)" opacity="0.2" style={{ mixBlendMode: 'screen' }} />
                        
                        {/* Beautiful Silk Grain Overlay */}
                        <rect width="1000" height="1000" filter="url(#silkNoise)" />
                    </svg>
                </div>

                <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
                    {/* Main H1 Heading with Highlights */}
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-[1.25] tracking-tight drop-shadow-lg">
                        {highlightText(
                            funnel?.top_header_line_1
                        )}
                    </h2>

                    {/* Subheading H2 */}
                    <p className="text-base sm:text-lg md:text-xl font-medium text-slate-200 leading-relaxed max-w-3xl mx-auto">
                        {highlightText(
                            funnel?.top_header_line_3
                        )}
                    </p>

                    {/* Media Container: Responsive YouTube Video, Uploaded Video, or Product Swiper Slider */}
                    <div 
                        className={`mx-auto rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 bg-slate-900 relative group transition-all duration-350 ${
                            isPortrait ? 'max-w-md' : 'max-w-3xl'
                        }`}
                        style={{ aspectRatio: videoRatio || '16/9' }}
                    >
                        {youtubeEmbedUrl ? (
                            <iframe
                                src={youtubeEmbedUrl}
                                title={product.name}
                                className="w-full h-full object-cover"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : videoOptions ? (
                            <VideoPlayer
                                options={videoOptions}
                                onReady={(player) => {
                                    // Read dimensions once metadata is available — no extra network request,
                                    // this fires on the same stream the player is already loading
                                    const readDimensions = () => {
                                        const w = player.videoWidth();
                                        const h = player.videoHeight();
                                        if (w && h) {
                                            setVideoRatio(`${w}/${h}`);
                                            setIsPortrait(h > w);
                                        }
                                    };
                                    player.on('loadedmetadata', readDimensions);
                                    // Also try immediately in case metadata is already available
                                    readDimensions();
                                }}
                                className="w-full h-full"
                            />
                        ) : (
                            <Swiper
                                modules={[Pagination, Autoplay, EffectFade]}
                                effect="fade"
                                pagination={{ clickable: true }}
                                autoplay={{ delay: 3500, disableOnInteraction: false }}
                                loop={true}
                                className="w-full h-full"
                            >
                                {product.images?.map((img, idx) => (
                                    <SwiperSlide key={idx} className="bg-slate-950 flex items-center justify-center">
                                        <img
                                            src={resolveImageUrl(img.image)}
                                            alt={`${product.name} - ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            onLoad={(e) => {
                                                if (idx === 0 && !videoRatio) {
                                                    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                                                    if (w && h) {
                                                        setVideoRatio(`${w}/${h}`);
                                                        setIsPortrait(h > w);
                                                    }
                                                }
                                            }}
                                        />
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        )}
                    </div>

                    {/* Promo Ribbon */}
                    <button
                        onClick={() => document.getElementById('pricing-box-container')?.scrollIntoView({ behavior: 'smooth' })}
                        className="pulse-btn shimmer-overlay bg-brand hover:bg-brand text-white font-black text-lg sm:text-2xl py-5 px-10 rounded-full flex items-center justify-center gap-3 mx-auto transition-transform w-full sm:w-auto"
                    >
                        <ShoppingCart size={22} className="fill-white" />
                        <span>অর্ডার করতে ক্লিক করুন</span>
                    </button>
                </div>
            </section>

            {/* C. Features Section */}
            <section className="py-16 px-4 max-w-4xl mx-auto space-y-16 animate-on-scroll">
                {/* Heading */}
                <div className="text-center">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
                        {funnel?.top_header_line_2}
                    </h2>
                    <WavyUnderline />
                </div>
                {/* Key Features checklist */}
                <div className="bg-white rounded-[2rem] p-6 sm:p-10  space-y-4">
                    {dynamicWhyBuyList.map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-4">
                            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner mt-0.5">
                                <CheckCircle size={18} className="fill-emerald-100" />
                            </span>
                            <p className="font-bold text-slate-700 text-sm sm:text-base leading-relaxed">
                                {highlightText(reason)}
                            </p>
                        </div>
                    ))}
                </div>

                {/* First Pulsating CTA Button */}
                <div className="text-center">
                    <button
                        onClick={() => document.getElementById('pricing-box-container')?.scrollIntoView({ behavior: 'smooth' })}
                        className="pulse-btn shimmer-overlay bg-brand hover:bg-brand text-white font-black text-lg sm:text-2xl py-5 px-10 rounded-full flex items-center justify-center gap-3 mx-auto transition-transform w-full sm:w-auto"
                    >
                        <ShoppingCart size={22} className="fill-white" />
                        <span>মূল্য জানতে চাই</span>
                    </button>
                </div>
            </section>
            
            {/* D. Original Product Images Section */}
            {product.funnel_sections && product.funnel_sections.length > 0 && (
                <section className="py-16 px-4 bg-white border-y border-slate-100 animate-on-scroll">
                    <div className="max-w-4xl mx-auto my-auto py-10 space-y-16">
                        {/* Title */}
                        <div className="text-center">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
                                পণ্যটির অরজিনাল ছবি গুলা দেখুন
                            </h2>
                            <WavyUnderline />
                        </div>

                        {/* Image Slider 2 */}
                        <div className="relative">
                            <Swiper
                                modules={[Pagination, Autoplay]}
                                spaceBetween={24}
                                slidesPerView={1}
                                breakpoints={{
                                    640: { slidesPerView: 2 },
                                    1024: { slidesPerView: 3 },
                                }}
                                pagination={{ clickable: true }}
                                autoplay={{ delay: 3000, disableOnInteraction: false }}
                                className="pb-4"
                            >
                                {product.images.map((section, idx) => (
                                    <SwiperSlide key={section.id || idx} className="h-auto">
                                        <div className="bg-[#f8fafc] rounded-2xl p-3 border border-slate-100 h-full flex flex-col items-center justify-between group shadow-sm hover:shadow-md transition-shadow">
                                            <div className="relative overflow-hidden rounded-xl w-full bg-slate-900 aspect-square flex items-center justify-center">
                                                {section.image ? (
                                                    <img
                                                        src={resolveImageUrl(section.image)}
                                                        alt={section.title || `Gallery - ${idx + 1}`}
                                                        className="w-full h-full object-cover rounded-xl transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center rounded-xl">
                                                        <Zap className="text-white/20" size={48} />
                                                    </div>
                                                )}
                                            </div>
                                            {(section.title || section.text) && (
                                                <div className="p-4 text-center w-full">
                                                    {section.title && <h4 className="font-bold text-slate-950 text-base mb-1 line-clamp-1">{section.title}</h4>}
                                                    {section.text && <p className="text-slate-500 font-bold text-xs leading-relaxed line-clamp-2">{section.text}</p>}
                                                </div>
                                            )}
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>
                    
                    {product.funnel_sections && product.funnel_sections.length > 0 && (
                                    <div className="py-24 bg-slate-50 border-y border-slate-200 animate-on-scroll">
                                        <div className="container mx-auto px-4 max-w-6xl">
                                            {/* Section Header */}
                                            <div className="text-center mb-16 space-y-4">
                                                <div className="bg-brand text-white px-8 py-4 rounded-3xl inline-block shadow-2xl transform -rotate-1">
                                                    <h5 className="text-xl md:text-2xl font-black tracking-tight uppercase">
                                                        আমাদের কাস্টমার রিভিউ
                                                    </h5>
                                                </div>
                                            </div>
                                            <div className="relative review-swiper-container">
                                                <Swiper
                                                    modules={[Pagination, Autoplay]}
                                                    spaceBetween={30}
                                                    slidesPerView={1}
                                                    breakpoints={{
                                                        640: { slidesPerView: 2 },
                                                        1024: { slidesPerView: 3 },
                                                    }}
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
                                                                        <img src={section.image} alt={section.title} className="w-full h-auto max-h-[750px] object-contain rounded-xl mx-auto transition-transform duration-700 group-hover:scale-105" loading="eager" />
                                                                    ) : (
                                                                        <div className="w-full aspect-[9/16] max-h-[750px] bg-slate-900 flex items-center justify-center rounded-xl">
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
                                                    className="bg-brand text-white px-8 py-5 rounded-full text-md md:text-xl font-black shadow-2xl shadow-brand/30 transform transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4 mx-auto uppercase tracking-tighter"
                                                >
                                                    <ShoppingCart size={20} /> অর্ডার করতে ক্লিক করুন
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                </section>
                
            )}

            {/* E. Pricing & Checkout Form Section */}
            <section id="pricing-box-container" className="py-20 px-4 bg-[#0a0f1d]/90 text-white relative overflow-hidden animate-on-scroll">
                <div className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-5 pointer-events-none" style={{ backgroundImage: `url(${product.image})` }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="max-w-4xl mx-auto space-y-12 relative z-10">
                    {/* Main Pricing Box */}
                    <div className="bg-gradient-to-br from-[#3b0a60]/60 to-[#1e0033]/40 rounded-[2.5rem] p-6 sm:p-12 border border-white/10 shadow-2xl text-center space-y-6">
                        {/* Regular Price Tag */}
                        <div className="inline-block bg-[#ffff00] text-black px-5 py-2 rounded-xl font-black text-sm sm:text-base uppercase tracking-wider shadow-md">
                            রেগুলার প্রাইস আগে ছিলো <span className="line-through decoration-[#ff003c] decoration-4 font-black">৳ {regPriceStr}</span> টাকা
                        </div>

                        {/* Offer Price Highlight (Hand Drawn Circle style) */}
                        <h3 className="text-2xl sm:text-4xl font-extrabold flex items-center justify-center gap-2 flex-wrap leading-relaxed py-2">
                            <span>বর্তমান অফার প্রাইজ মাত্র</span>
                            <span className="relative inline-block px-6 py-2 mx-2">
                                <svg className="absolute inset-0 w-full h-full text-[#ff003c] pointer-events-none scale-125 z-0" viewBox="0 0 100 40" preserveAspectRatio="none">
                                    <path
                                        d="M 4,20 C 4,4 96,4 96,20 C 96,36 4,36 4,20 Z"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        className="hand-drawn-circle"
                                    />
                                </svg>
                                <span className="relative z-10 text-yellow-300 font-extrabold text-3xl sm:text-5xl drop-shadow-[0_0_15px_rgba(253,224,71,0.6)]">
                                    ৳ {salePriceStr}
                                </span>
                            </span>
                            <span>টাকা</span>
                        </h3>
                        {/* Heading directing to the checkout form */}
                        <div className="pt-6 border-t border-white/10">
                            <h4 className="text-lg sm:text-2xl font-black leading-relaxed">
                                অর্ডার করতে <span className="bg-[#28a745] text-white px-3 py-1 rounded mx-1 inline-block font-black shadow-md">নিচের ফর্মটি পূরণ করুন</span>
                            </h4>
                        </div>
                    </div>

                    {/* F. High Conversion Order Form */}
                    <div id="order-form-anchor" className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 sm:p-10 shadow-2xl space-y-8">
                        <form onSubmit={handleFormSubmit} className="space-y-8">
                            
                            {/* Variant Selection List */}
                            {selectedVariants?.length > 0 && selectedVariants[0].id !== 'default' && (
                                <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-5 backdrop-blur-sm">
                                    <label className="block text-sm font-black tracking-wider text-slate-200 uppercase">
                                        ১. আপনার পছন্দের ভেরিয়েন্ট বা কালার নির্বাচন করুন: <span className="text-[#ff003c]">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {selectedVariants.map((variant) => (
                                            <div
                                                key={variant.id}
                                                onClick={() => handleVariantSelect(variant.id)}
                                                className={`cursor-pointer flex items-center justify-between p-2 sm:p-3.5 rounded-xl border-2 transition-all duration-300 ${variant.quantity > 0 ? 'border-[#ff003c] bg-white/10 shadow-[0_0_15px_rgba(255,0,60,0.2)]' : 'border-white/10 bg-black/20 hover:border-white/30 hover:bg-white/5'}`}
                                            >
                                                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                                                    {/* Radio Indicator */}
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${variant.quantity > 0 ? 'border-white bg-white/10' : 'border-white/20'}`}>
                                                        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${variant.quantity > 0 ? 'bg-white scale-100' : 'bg-transparent scale-0'}`} />
                                                    </div>
                                                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-white shrink-0 border border-white/20">
                                                        <img src={resolveImageUrl(variant.image || product.image || product.images?.[0]?.image)} alt={variant.color ? variant.color.name : product.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = product.images?.[0]?.image || ''; }} loading="eager" />
                                                    </div>
                                                    <div className="flex flex-col items-start text-left min-w-0 flex-1">
                                                        <h4 className="font-bold text-white leading-tight text-sm sm:text-base truncate w-full">
                                                            {product.name}
                                                        </h4>
                                                        <p className="text-[10px] sm:text-xs text-slate-300 font-medium truncate w-full">
                                                            {variant.color?.name || variant.size?.name || 'Standard'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0 ml-2">
                                                    <span className="font-black text-white text-sm sm:text-base">৳ {language === 'bn' ? toBanglaNumber(Math.floor(variant.price)) : Math.floor(variant.price)}</span>
                                                    <div className="flex items-center bg-black/40 rounded-lg border border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleVariantQuantityChange(variant.id, -1); }}
                                                            className="px-2 sm:px-3 py-0.5 sm:py-1 text-white hover:bg-white/20 transition-colors font-bold text-base sm:text-lg"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 text-white font-bold min-w-[1.5rem] sm:min-w-[2rem] text-center border-x border-white/10 text-xs sm:text-sm">
                                                            {language === 'bn' ? toBanglaNumber(variant.quantity) : variant.quantity}
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

                            {/* Customer Details Form Fields */}
                            <div className="space-y-6">
                                <label className="block text-sm font-black tracking-wider text-slate-200 uppercase">
                                    ২. ডেলিভারি তথ্য প্রদান করুন:
                                </label>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name input */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest ml-1">{t('full_name')} <span className="text-[#ff003c]">*</span></label>
                                        <input
                                            type="text"
                                            name="customer_name"
                                            required
                                            className="w-full pl-5 pr-5 py-4 bg-slate-900/50 border border-white/20 rounded-2xl focus:border-[#ff003c] focus:bg-slate-900/80 focus:ring-4 focus:ring-[#ff003c]/10 text-white placeholder-slate-500 outline-none font-bold transition-all duration-300"
                                            placeholder="আপনার সম্পূর্ণ নাম লিখুন"
                                            value={formData.customer_name}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    {/* Phone input */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest ml-1">{t('phone_number')} <span className="text-[#ff003c]">*</span></label>
                                        <div className="relative group">
                                            <input
                                                type="tel"
                                                name="phone_number"
                                                required
                                                className="w-full pl-5 pr-12 py-4 bg-slate-900/50 border border-white/20 rounded-2xl focus:border-[#ff003c] focus:bg-slate-900/80 focus:ring-4 focus:ring-[#ff003c]/10 text-white placeholder-slate-500 outline-none font-bold transition-all duration-300"
                                                placeholder="আপনার মোবাইল নাম্বার"
                                                value={formData.phone_number}
                                                onChange={handlePhoneChange}
                                            />
                                            <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#ff003c] transition-colors" size={20} />
                                        </div>
                                    </div>
                                </div>

                                {/* District and Area select */}
                                {siteSettings?.enable_district_upazila !== false && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* District select */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest ml-1">{t('district')} <span className="text-[#ff003c]">*</span></label>
                                            <div className="relative group">
                                                <select
                                                    name="district"
                                                    required
                                                    className="w-full pl-5 pr-12 py-4 bg-slate-900 border border-white/20 rounded-2xl focus:border-[#ff003c] focus:ring-4 focus:ring-[#ff003c]/10 text-white outline-none font-bold transition-all duration-300 appearance-none cursor-pointer"
                                                    value={formData.district}
                                                    onChange={handleChange}
                                                >
                                                    <option value="" className="bg-slate-900 text-slate-400">{t('select_district')}</option>
                                                    {districts.map(dist => {
                                                        const displayDist = dist.name.includes('|')
                                                            ? (language === 'bn' ? dist.name.split('|')[0].trim() : dist.name.split('|')[1].trim())
                                                            : dist.name;
                                                        return <option key={dist.id} value={dist.id} className="bg-slate-900 text-white">{displayDist}</option>
                                                    })}
                                                </select>
                                                <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#ff003c] transition-colors pointer-events-none" size={20} />
                                            </div>
                                        </div>

                                        {/* Upazila select */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest ml-1">{t('area_upazila')} <span className="text-[#ff003c]">*</span></label>
                                            <div className="relative group">
                                                <select
                                                    name="upazila"
                                                    required
                                                    className="w-full pl-5 pr-12 py-4 bg-slate-900 border border-white/20 rounded-2xl focus:border-[#ff003c] focus:ring-4 focus:ring-[#ff003c]/10 text-white outline-none font-bold transition-all duration-300 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                    value={formData.upazila}
                                                    onChange={handleChange}
                                                    disabled={!formData.district}
                                                >
                                                    <option value="" className="bg-slate-900 text-slate-400">{t('select_area')}</option>
                                                    {upazilas.map(upz => {
                                                        const displayUpz = upz.name.includes('|')
                                                            ? (language === 'bn' ? upz.name.split('|')[0].trim() : upz.name.split('|')[1].trim())
                                                            : upz.name;
                                                        return <option key={upz.id} value={upz.id} className="bg-slate-900 text-white">{displayUpz}</option>
                                                    })}
                                                </select>
                                                <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#ff003c] transition-colors pointer-events-none" size={20} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Address Details */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest ml-1">{t('address_details')} <span className="text-[#ff003c]">*</span></label>
                                    <div className="relative group">
                                        <textarea
                                            name="address"
                                            required
                                            rows="2"
                                            className="w-full pl-5 pr-12 py-4 bg-slate-900/50 border border-white/20 rounded-2xl focus:border-[#ff003c] focus:bg-slate-900/80 focus:ring-4 focus:ring-[#ff003c]/10 text-white placeholder-slate-500 outline-none font-bold transition-all duration-300 resize-none"
                                            placeholder="আপনার ঠিকানা, জেলা এবং থানাসহ বিস্তারিত লিখুন"
                                            value={formData.address}
                                            onChange={handleChange}
                                        />
                                        <MapPin className="absolute right-5 top-6 text-slate-400 group-focus-within:text-[#ff003c] transition-colors pointer-events-none" size={20} />
                                    </div>
                                </div>
                                {/* Shipping zone select (When district select disabled) */}
                                {siteSettings?.enable_district_upazila === false && (
                                    <div id="shipping_zone_select" className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest ml-1">{t('shipping_method')}</label>
                                        <div className="relative group">
                                            <select
                                                name="shipping_zone"
                                                className={`w-full pl-5 pr-12 py-4 bg-slate-900 border rounded-2xl text-slate-200 outline-none font-bold appearance-none cursor-pointer focus:border-[#ff003c] focus:ring-4 focus:ring-[#ff003c]/10 ${shippingError ? 'border-[#ff003c] ring-4 ring-[#ff003c]/20' : 'border-white/20'}`}
                                                value={formData.shipping_zone}
                                                onChange={handleChange}
                                            >
                                                <option value="" className="bg-slate-900 text-slate-400">{t('select_shipping_zone')}</option>
                                                {shippingZones.map(zone => {
                                                    const displayName = zone.name.toLowerCase().includes('inside dhaka city')
                                                        ? 'ঢাকা সিটির ভেতরে'
                                                        : zone.name.toLowerCase().includes('outside dhaka city')
                                                            ? 'ঢাকা সিটির বাইরে'
                                                            : zone.name;
                                                    return (
                                                        <option key={zone.id} value={zone.id} className="bg-slate-900 text-white">
                                                            {displayName} - ৳ {parseFloat(zone.shipping_cost).toFixed(0)}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#ff003c] pointer-events-none" size={20} />
                                        </div>
                                        {shippingError && (
                                            <p className="text-[#ff003c] text-sm font-bold mt-2 animate-bounce flex items-center gap-1.5 ml-2">
                                                <span>⚠️</span> {shippingError}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Summary Receipt Box */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                                <h3 className="text-sm font-black tracking-wider text-slate-200 uppercase border-b border-white/10 pb-3 flex items-center gap-2">
                                    <Award size={18} className="text-yellow-400" />
                                    <span>অর্ডার সামারি</span>
                                </h3>

                                <div className="space-y-3 text-sm sm:text-base">
                                    <div className="flex justify-between items-center text-slate-300 font-bold">
                                        <span>পণ্য</span>
                                        <div className='flex gap-3 items-center text-right justify-end max-w-[200px] sm:max-w-xs'>

                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0 border border-white/10 hidden sm:block">
                                                <img src={resolveImageUrl(activeVariant?.image || product.image || product.images?.[0]?.image)} alt={product.name} className="w-full h-full object-cover" loading="eager" />
                                            </div>
                                            <span className="font-extrabold text-white truncate text-xs sm:text-sm block">
                                                {product.name}
                                                {activeVariant && activeVariant.id !== 'default' ? ` - ${activeVariant.color?.name || ''} ${activeVariant.size?.name || ''}`.trim() : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-300 font-bold">
                                        <span>উপ-মোট (Subtotal)</span>
                                        <span className="font-black text-white">৳ {language === 'bn' ? toBanglaNumber(subtotal) : subtotal}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-300 font-bold">
                                        <span>ডেলিভারি চার্জ</span>
                                        <span className="font-black text-white">
                                            {siteSettings?.enable_district_upazila !== false
                                                ? (formData.district
                                                    ? `+ ৳ ${language === 'bn' ? toBanglaNumber(shippingCost) : shippingCost}`
                                                    : 'ডিস্ট্রিক্ট নির্বাচন করুন')
                                                : (selectedZone
                                                    ? `+ ৳ ${language === 'bn' ? toBanglaNumber(shippingCost) : shippingCost}`
                                                    : 'শিপিং এলাকা নির্বাচন করুন')
                                            }
                                        </span>
                                    </div>
                                    
                                    <div className="h-px bg-white/10 w-full my-3"></div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-base sm:text-lg font-black text-white uppercase">সর্বমোট মূল্য</span>
                                        <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">৳ {language === 'bn' ? toBanglaNumber(finalTotal) : finalTotal}</span>
                                    </div>
                                    <p className="text-sm font-medium text-white/70 text-center mt-3 leading-relaxed">
                                        ক্যাশ অন ডেলিভারি, কোনো প্রকার অগ্রিম পেমেন্টের প্রয়োজন নেই
                                    </p>
                                </div>
                            </div>

                            {/* Main Form Submit Button */}
                            <button
                                ref={submitBtnRef}
                                type="submit"
                                disabled={submitting}
                                className="pulse-btn shimmer-overlay w-full bg-brand hover:bg-brand text-white font-black text-xl sm:text-2xl py-6 rounded-2xl transform transition-all duration-300 active:scale-95 flex justify-center items-center gap-3 disabled:opacity-75 disabled:cursor-not-allowed border-0 outline-0"
                            >
                                <ShoppingCart size={24} className="fill-white" />
                                <span>{submitting ? 'অর্ডার প্রসেস হচ্ছে...' : 'অর্ডার কনফার্ম করুন'}</span>
                                <ArrowRight className="group-hover:translate-x-1.5 transition-transform" size={24} />
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* G. Footer & WhatsApp/Facebook Support */}
            <footer className="bg-[#070b14] text-slate-500 py-4 px-4 text-center border-t border-white/5 relative z-20">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Developer Credits */}
                    <div className="space-y-2 text-xs sm:text-sm">
                        <p className="font-bold text-slate-400">
                            © 2026 Spaceghor. Developed by <a href="https://ctsolutionbd.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Cyber and Tech Solution</a>.
                        </p>
                    </div>
                </div>
            </footer>

            {/* H. Mobile Sticky CTA Bottom Bar */}
            <div className={`fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-3 border-t border-slate-200 sm:hidden z-50 transition-transform duration-300 shadow-2xl flex items-center justify-between gap-3 ${showMobileCTA ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="flex flex-col items-start px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">অফার প্রাইজ</span>
                    <span className="text-xl font-black text-brand">৳ {language === 'bn' ? toBanglaNumber(finalTotal) : finalTotal}</span>
                </div>
                <a
                    href="#pricing-box-container"
                    className="flex-1 max-w-[200px] flex items-center justify-center gap-2 bg-brand text-white font-black py-4 rounded-xl text-sm shadow-lg shadow-[#ff003c]/20 hover:bg-brand active:scale-95 transition-all text-center uppercase tracking-wide"
                >
                    <ShoppingCart size={16} />
                    <span>অর্ডার করুন</span>
                </a>
            </div>
        </div>
    );
};

export default EzyFunnelLayout;
