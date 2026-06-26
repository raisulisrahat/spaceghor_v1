import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
    getProductBySlug, 
    getDistricts, 
    getUpazilas, 
    getSiteSettings,
    createOrder,
    getShippingZones,
    createDraftOrder,
    updateDraftOrder,
    deleteDraftOrder
} from '../services/api';
import { 
    ShieldCheck, 
    Truck, 
    Star, 
    CheckCircle, 
    ArrowRight, 
    Phone, 
    MapPin, 
    Zap, 
    Award,
    Clock,
    ShoppingCart,
    Package,
    ChevronRight,
    Check,
    RefreshCcw,
    CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveImageUrl } from '../utils/image';
import SEO from '../components/SEO';
import FacebookPixel from '../components/FacebookPixel';
import ChatBubble from '../components/ChatBubble';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const StepFunnel = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    
    const [submitting, setSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [draftOrderId, setDraftOrderId] = useState<number | null>(() => {
        const saved = sessionStorage.getItem(`draft_order_id_stepfunnel_${slug}`);
        return saved ? parseInt(saved, 10) : null;
    });
    const isOrderSubmittedRef = useRef(false);

    useEffect(() => {
        if (draftOrderId) {
            sessionStorage.setItem(`draft_order_id_stepfunnel_${slug}`, draftOrderId.toString());
        } else {
            sessionStorage.removeItem(`draft_order_id_stepfunnel_${slug}`);
        }
    }, [draftOrderId, slug]);
    const [showMobileCTA, setShowMobileCTA] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);
    const submitBtnRef = useRef<HTMLButtonElement>(null);

    const [ipAddress, setIpAddress] = useState('');

    useEffect(() => {
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => setIpAddress(data.ip))
            .catch(err => console.error("Error fetching IP:", err));
    }, []);

    // Form State
    const [formData, setFormData] = useState({
        customer_name: '',
        phone_number: '',
        district: '',
        upazila: '',
        address: '',
        shipping_zone: '',
        payment_method: '1', // COD
    });

    // Fetch Product Data
    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', slug],
        queryFn: () => getProductBySlug(slug!).then(res => res.data),
        enabled: !!slug
    });

    const hasPushedGTMRef = useRef(false);
    const hasPushedFBRef = useRef(false);
    const checkoutStartTimeRef = useRef(Date.now());
    const hasReachedFourMinutesRef = useRef(false);
    const [fourMinuteTrigger, setFourMinuteTrigger] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            hasReachedFourMinutesRef.current = true;
            setFourMinuteTrigger(true);
        }, 2 * 60 * 1000); // 2 minutes
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (product) {
            const currentPrice = Math.floor(product.sale_price || product.regular_price);
            
            if (!hasPushedGTMRef.current) {
                if (!(window as any).__tracked_gtm_step) {
                    const eventId = `checkout_${Date.now()}`;
                    
                    const ecommerceData = {
                        value: currentPrice,
                        currency: 'BDT',
                        items: [{
                            item_name: product.name,
                            item_id: product.sku || product.id?.toString(),
                            price: currentPrice.toString(),
                            quantity: 1
                        }]
                    };

                    if ((window as any).dataLayer) {
                        (window as any).dataLayer.push({
                            event: 'custom_begin_checkout',
                            event_id: eventId,
                            ecommerce: ecommerceData
                        });
                    }

                    if (typeof (window as any).gtag === 'function') {
                        (window as any).gtag('event', 'begin_checkout', ecommerceData);
                    }



                    (window as any).__tracked_gtm_step = true;
                }
                hasPushedGTMRef.current = true;
            }
        }
    }, [product]);

    const [districts, setDistricts] = useState<any[]>([]);
    const [upazilas, setUpazilas] = useState<any[]>([]);
    const [shippingZones, setShippingZones] = useState<any[]>([]);
    const [siteSettings, setSiteSettings] = useState<any>(null);
    const [shippingCost, setShippingCost] = useState(0);
    const [selectedZone, setSelectedZone] = useState<any>(null);

    // Initial Data Fetch
    useEffect(() => {
        getDistricts().then(res => setDistricts(res.data.results || res.data));
        getShippingZones().then(res => setShippingZones(res.data.results || res.data));
        getSiteSettings().then(res => {
            const data = res.data.results || res.data;
            setSiteSettings(Array.isArray(data) ? data[0] : data);
        });
    }, []);

    // Fetch Upazilas when district changes
    useEffect(() => {
        if (formData.district) {
            getUpazilas(formData.district).then(res => setUpazilas(res.data.results || res.data));
            
            // Auto shipping cost for Dhaka/Outside
            const district = districts.find(d => d.id == formData.district);
            if (district) {
                const isDhaka = district.name.toLowerCase().includes('dhaka');
                setShippingCost(isDhaka ? 60 : 120);
                
                // Try to find matching zone in backend shipping zones
                const zone = shippingZones.find(z => 
                    isDhaka ? z.name.toLowerCase().includes('inside') : z.name.toLowerCase().includes('outside')
                );
                if (zone) setSelectedZone(zone);
            }
        }
    }, [formData.district, districts, shippingZones]);

    // Handle Input Change
    const handleChange = (e: any) => {
        const { name, value } = e.target;
        if (name === 'phone_number') {
            const cleaned = value.replace(/\D/g, '').slice(0, 11);
            setFormData(prev => ({ ...prev, phone_number: cleaned }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const currentPrice = product ? Math.floor(product.sale_price || product.regular_price) : 0;
    const finalTotal = currentPrice + shippingCost;

    // Debounced draft auto-save
    useEffect(() => {
        if (siteSettings?.enable_draft_orders === false) return;
        const hasContact = formData.phone_number.length >= 3 || formData.customer_name.length >= 3;
        if (!hasContact || !product) return;
        if (!hasReachedFourMinutesRef.current) return;

        const timer = setTimeout(async () => {
            if (isOrderSubmittedRef.current) return;
            const orderData = {
                customer_name: formData.customer_name || 'Incomplete Customer',
                phone_number: formData.phone_number,
                address: formData.district ? `${formData.address}${formData.upazila ? `, ${upazilas.find(u => u.id == formData.upazila)?.name || formData.upazila}` : ''}${formData.district ? `, ${districts.find(d => d.id == formData.district)?.name || formData.district}` : ''}` : formData.address || 'Incomplete Address',
                items: [{
                    product: product.id,
                    quantity: 1,
                    price: currentPrice
                }],
                shipping_zone: selectedZone?.id || (formData.district && districts.find(d => d.id == formData.district)?.name.toLowerCase().includes('dhaka') ? 2 : 1),
                shipping_cost: shippingCost,
                total_amount: finalTotal,
                payment_method: 1
            };

            try {
                if (draftOrderId) {
                    await updateDraftOrder(draftOrderId, orderData);
                } else {
                    const res = await createDraftOrder(orderData);
                    if (res.data?.id) {
                        setDraftOrderId(res.data.id);
                    }
                }
            } catch (err) {
                console.error("Draft auto-save failed:", err);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [formData, product, selectedZone, shippingCost, finalTotal, draftOrderId, fourMinuteTrigger, siteSettings?.enable_draft_orders]);

    // Immediate save on unmount / beforeunload
    const saveDraftImmediatelyRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        saveDraftImmediatelyRef.current = () => {
            if (siteSettings?.enable_draft_orders === false) return;
            if (isOrderSubmittedRef.current) return;
            if (!hasReachedFourMinutesRef.current) return;
            const hasContact = formData.phone_number.length >= 3 || formData.customer_name.length >= 3;
            if (!hasContact || !product) return;

            const orderData = {
                customer_name: formData.customer_name || 'Incomplete Customer',
                phone_number: formData.phone_number,
                address: formData.district ? `${formData.address}${formData.upazila ? `, ${upazilas.find(u => u.id == formData.upazila)?.name || formData.upazila}` : ''}${formData.district ? `, ${districts.find(d => d.id == formData.district)?.name || formData.district}` : ''}` : formData.address || 'Incomplete Address',
                items: [{
                    product: product.id,
                    quantity: 1,
                    price: currentPrice
                }],
                shipping_zone: selectedZone?.id || (formData.district && districts.find(d => d.id == formData.district)?.name.toLowerCase().includes('dhaka') ? 2 : 1),
                shipping_cost: shippingCost,
                total_amount: finalTotal,
                payment_method: 1
            };

            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Token ${token}`;
            }

            const baseUrl = import.meta.env.VITE_API_URL || '';
            const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

            if (draftOrderId) {
                fetch(`${cleanBaseUrl}api/incomplete-orders/${draftOrderId}/`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(orderData),
                    keepalive: true
                }).catch(err => console.error("Error saving draft beforeunload:", err));
            } else {
                fetch(`${cleanBaseUrl}api/incomplete-orders/`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(orderData),
                    keepalive: true
                })
                .then(res => res.json())
                .then(data => {
                    if (data?.id) {
                        sessionStorage.setItem(`draft_order_id_stepfunnel_${slug}`, data.id.toString());
                    }
                })
                .catch(err => console.error("Error creating draft beforeunload:", err));
            }
        };
    }, [formData, product, selectedZone, shippingCost, finalTotal, draftOrderId, slug, upazilas, districts, currentPrice, siteSettings?.enable_draft_orders]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (saveDraftImmediatelyRef.current) {
                saveDraftImmediatelyRef.current();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (saveDraftImmediatelyRef.current) {
                saveDraftImmediatelyRef.current();
            }
        };
    }, []);

    // Handle Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        const phone = formData.phone_number || '';
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
            alert(language === 'bn' 
                ? 'দয়া করে একটি সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।' 
                : 'Please enter a valid 11-digit mobile number starting with 01 (e.g. 017XXXXXXXX).'
            );
            return;
        }

        setSubmitting(true);

        try {
            const orderData = {
                customer_name: formData.customer_name,
                phone_number: formData.phone_number,
                address: `${formData.address}${formData.upazila ? `, ${upazilas.find(u => u.id == formData.upazila)?.name || formData.upazila}` : ''}${formData.district ? `, ${districts.find(d => d.id == formData.district)?.name || formData.district}` : ''}`,
                items: [{
                    product: product.id,
                    quantity: 1,
                    price: currentPrice
                }],
                shipping_zone: selectedZone?.id || (formData.district && districts.find(d => d.id == formData.district)?.name.toLowerCase().includes('dhaka') ? 2 : 1),
                shipping_cost: shippingCost,
                total_amount: finalTotal,
                payment_method: 1
            };

            const res = await createOrder(orderData);

            // Mark as submitted to prevent any subsequent draft saves/updates
            isOrderSubmittedRef.current = true;

            if (draftOrderId) {
                try {
                    await deleteDraftOrder(draftOrderId);
                } catch (delErr) {
                    console.error("Failed to delete draft order after success:", delErr);
                }
                setDraftOrderId(null);
            }

            setIsSuccess(true);
            
            // Google Tag Manager dataLayer Purchase Event
            if ((window as any).dataLayer) {
                const finalAddress = res.data?.address || `${formData.address}${formData.upazila ? `, ${upazilas.find(u => u.id == formData.upazila)?.name || formData.upazila}` : ''}${formData.district ? `, ${districts.find(d => d.id == formData.district)?.name || formData.district}` : ''}`;
                const finalPhone = res.data?.phone_number || formData.phone_number;

                (window as any).dataLayer.push({
                    event: 'purchase',
                    customer_name: res.data?.customer_name || formData.customer_name,
                    customer_phone: finalPhone,
                    customer_address: finalAddress,
                    order_id: res.data?.id || `stepfunnel_${Date.now()}`,
                    district: formData.district,
                    upazila: formData.upazila,
                    shipping_cost: shippingCost,
                    total_amount: parseFloat(res.data?.total_amount) || finalTotal,
                    ip_address: res.data?.ip_address || ipAddress,
                    content_ids: [product.sku || product.id.toString()],
                    content_name: product.name,
                    content_type: 'product',
                    ecommerce: {
                        transaction_id: res.data?.id || `stepfunnel_${Date.now()}`,
                        value: parseFloat(res.data?.total_amount) || finalTotal,
                        currency: 'BDT',
                        items: [{
                            item_name: product.name,
                            item_id: product.id,
                            price: currentPrice,
                            quantity: 1,
                            color: '',
                            size: '',
                        }]
                    }
                });


            }
        } catch (err) {
            console.error("Order failed", err);
            alert("Failed to place order. Please check your information.");
        } finally {
            setSubmitting(false);
        }
    };

    // Mobile CTA Visibility Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setShowMobileCTA(!entry.isIntersecting),
            { threshold: 0.1 }
        );
        if (submitBtnRef.current) observer.observe(submitBtnRef.current);
        return () => observer.disconnect();
    }, []);

    if (isLoading) return null;

    if (error || !product) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <button onClick={() => navigate('/')} className="bg-slate-900 text-white px-6 py-2 rounded-full">Back to Home</button>
        </div>
    );

    if (isSuccess) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
            <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mb-8 shadow-xl"
            >
                <Check size={48} strokeWidth={4} />
            </motion.div>
            <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">অর্ডার সফল হয়েছে!</h1>
            <p className="text-slate-600 text-xl mb-10 max-w-lg">আপনার অর্ডারটি আমরা পেয়েছি। আমাদের প্রতিনিধি শীঘ্রই কল করে আপনার অর্ডারটি কনফার্ম করবেন। আমাদের সাথে থাকার জন্য ধন্যবাদ।</p>
            <button 
                onClick={() => navigate('/')} 
                className="bg-brand text-white px-12 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-brand/20 hover:scale-105 transition-transform"
            >
                আরো কেনাকাটা করুন
            </button>
        </div>
    );

    const allImages = [
        product.image,
        ...(product.images?.map((img: any) => img.image) || [])
    ].filter(Boolean);

    return (
        <div className="bg-white min-h-screen font-sans selection:bg-brand selection:text-white">
            <SEO title={`${product.name} - Special Offer`} description={product.short_description} image={product.image} />
            
            {/* Promo Top Bar */}
            <div className="bg-brand text-white py-2.5 text-center font-bold text-xs md:text-sm uppercase tracking-widest px-4">
                🔥 আজই অর্ডার করলে পাচ্ছেন বিশেষ ছাড় এবং দ্রুত ডেলিভারি!
            </div>

            {/* Main Header */}
            <header className="py-6 border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-40">
                <div className="container mx-auto px-4 flex justify-between items-center max-w-6xl">
                    <div className="text-2xl font-black tracking-tighter text-brand">{siteSettings?.site_title || 'Qbamart'}</div>
                    <div className="flex gap-4 md:gap-8 items-center text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-brand" /> 100% Secure</span>
                        <span className="flex items-center gap-1.5"><Truck size={14} className="text-brand" /> Cash on Delivery</span>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 md:px-6 pt-8 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                    
                    {/* Left: Visuals */}
                    <div className="space-y-8">
                        <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-50 bg-slate-50 relative group">
                            <Swiper
                                modules={[Navigation, Pagination, Autoplay, EffectFade]}
                                effect="fade"
                                navigation
                                pagination={{ clickable: true }}
                                autoplay={{ delay: 3500 }}
                                loop={true}
                                className="aspect-square"
                            >
                                {allImages.map((img, idx) => (
                                    <SwiperSlide key={idx}>
                                        <img src={resolveImageUrl(img)} alt={product.name} className="w-full h-full object-cover" />
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                            
                            {/* Offer Badge */}
                            {product.sale_price && (
                                <div className="absolute top-6 left-6 bg-red-600 text-white px-5 py-2 rounded-2xl font-black text-lg z-10 shadow-xl rotate-[-5deg] animate-pulse">
                                    SAVE {Math.round((1 - product.sale_price / product.regular_price) * 100)}%
                                </div>
                            )}
                        </div>

                        {/* Trust Factors Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-50 p-4 rounded-3xl text-center border border-slate-100 hover:border-brand/30 transition-colors">
                                <Award className="mx-auto text-brand mb-2" size={24} />
                                <p className="text-[10px] font-black uppercase text-slate-800">Premium Quality</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-3xl text-center border border-slate-100 hover:border-brand/30 transition-colors">
                                <Package className="mx-auto text-brand mb-2" size={24} />
                                <p className="text-[10px] font-black uppercase text-slate-800">Safe Packing</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-3xl text-center border border-slate-100 hover:border-brand/30 transition-colors">
                                <RefreshCcw className="mx-auto text-brand mb-2" size={24} />
                                <p className="text-[10px] font-black uppercase text-slate-800">Easy Return</p>
                            </div>
                        </div>

                        {/* Sales Copy/Description */}
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/50">
                            <h2 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                <div className="w-2 h-8 bg-brand rounded-full" /> পণ্যের বিবরণ
                            </h2>
                            <div className="prose prose-slate prose-lg max-w-none font-medium leading-relaxed product-description-content" dangerouslySetInnerHTML={{ __html: product.description || product.short_description }} />
                        </div>
                    </div>

                    {/* Right: Pricing & Order Form */}
                    <div className="lg:sticky lg:top-32 h-fit">
                        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white shadow-3xl shadow-slate-900/40 relative overflow-hidden">
                            {/* Decorative Blur */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand opacity-20 rounded-full blur-[80px]" />
                            
                            <div className="relative z-10">
                                <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight leading-tight">{product.name}</h1>
                                
                                <div className="flex items-baseline gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/10 w-fit">
                                    <span className="text-4xl font-black text-brand">৳{currentPrice}</span>
                                    {product.sale_price && <span className="text-xl text-white/30 line-through font-bold">৳{Math.floor(product.regular_price)}</span>}
                                </div>

                                <div className="space-y-4 mb-10">
                                    <div className="flex items-center gap-3 text-sm font-bold text-white/80">
                                        <CheckCircle2 size={18} className="text-brand" /> স্টক সীমিত, দ্রুত অর্ডার করুন!
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-bold text-white/80">
                                        <CheckCircle2 size={18} className="text-brand" /> সারা বাংলাদেশে ক্যাশ অন ডেলিভারি
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-bold text-white/80">
                                        <CheckCircle2 size={18} className="text-brand" /> পন্য দেখে টাকা পরিশোধের সুযোগ
                                    </div>
                                </div>

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
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:border-brand outline-none transition-all font-bold placeholder-white/30"
                                                placeholder={t('full_name')}
                                                value={formData.customer_name}
                                                onChange={handleChange}
                                            />
                                            <input
                                                type="tel"
                                                name="phone_number"
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:border-brand outline-none transition-all font-bold placeholder-white/30"
                                                placeholder={t('phone_number')}
                                                value={formData.phone_number}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <select
                                                name="district"
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:border-brand outline-none transition-all font-bold text-white"
                                                value={formData.district}
                                                onChange={handleChange}
                                            >
                                                <option value="" className="bg-slate-900">{t('select_district')}</option>
                                                {districts.map(d => (
                                                    <option key={d.id} value={d.id} className="bg-slate-900">{d.name.split('|')[language === 'bn' ? 0 : 1] || d.name}</option>
                                                ))}
                                            </select>
                                            <select
                                                name="upazila"
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:border-brand outline-none transition-all font-bold text-white disabled:opacity-50"
                                                value={formData.upazila}
                                                onChange={handleChange}
                                                disabled={!formData.district}
                                            >
                                                <option value="" className="bg-slate-900">{t('select_area')}</option>
                                                {upazilas.map(u => (
                                                    <option key={u.id} value={u.id} className="bg-slate-900">{u.name.split('|')[language === 'bn' ? 0 : 1] || u.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <textarea
                                            name="address"
                                            required
                                            rows={2}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:border-brand outline-none transition-all font-bold placeholder-white/30 resize-none"
                                            placeholder="আপনার ঠিকানা, জেলা এবং থানাসহ বিস্তারিত লিখুন"
                                            value={formData.address}
                                            onChange={handleChange}
                                        />

                                        {/* Order Summary Summary */}
                                        <div className="bg-white/5 rounded-2xl p-6 space-y-3 font-bold text-sm">
                                            <div className="flex justify-between text-white/50">
                                                <span>পণ্যের মূল্য</span>
                                                <span className="text-white">৳{currentPrice}</span>
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
                                            ref={submitBtnRef}
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full bg-brand hover:bg-[#3a5bd9] text-white font-black text-2xl py-6 rounded-2xl shadow-2xl shadow-brand/20 transform transition-all active:scale-95 flex items-center justify-center gap-3 group disabled:opacity-70"
                                        >
                                            {submitting ? 'অর্ডার হচ্ছে...' : (
                                                <>অর্ডার কনফার্ম করুন <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" /></>
                                            )}
                                        </button>
                                        
                                        <p className="text-center text-[10px] uppercase tracking-widest text-white/30 font-black">
                                            100% Secure Checkout | Verified by {siteSettings?.site_title || 'Qbamart'}
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

            {/* Footer */}
            <footer className="py-12 bg-slate-50 border-t border-slate-100 text-center">
                <div className="container mx-auto px-4">
                    <div className="text-xl font-black text-slate-300 mb-4 tracking-tighter uppercase">{siteSettings?.site_title || 'Qbamart'}</div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">&copy; {new Date().getFullYear()} {siteSettings?.site_title || 'Qbamart'} | All Rights Reserved</p>
                </div>
            </footer>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .swiper-pagination-bullet-active { background: #C0561F !important; }
                .swiper-button-next, .swiper-button-prev { color: #C0561F !important; }
            `}} />
            <ChatBubble />
        </div>
    );
};

export default StepFunnel;
