import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
    getFunnelBySlug, 
    getDistricts, 
    getUpazilas, 
    getSiteSettings,
    createOrder,
    getShippingZones,
    createDraftOrder,
    updateDraftOrder,
    deleteDraftOrder
} from '../services/api';
import ClassicFunnelLayout from '../components/funnels/ClassicFunnelLayout';
import ComboFunnelLayout from '../components/funnels/ComboFunnelLayout';
// import ModernFunnelLayout from '../components/funnels/ModernFunnelLayout';
// import BanglaFunnelLayout from '../components/funnels/BanglaFunnelLayout';
import EzyFunnelLayout from '../components/funnels/EzyFunnelLayout';
import EzymartFunnelLayout from '../components/funnels/EzymartFunnelLayout';
// import DarkFunnelLayout from '../components/funnels/DarkFunnelLayout';
import ProfessionalFunnelLayout from '../components/funnels/ProfessionalFunnelLayout';
import GardenFunnelLayout from '../components/funnels/GardenFunnelLayout';
import PremiumFunnelLayout from '../components/funnels/PremiumFunnelLayout';
import StepFunnelLayout from '../components/funnels/StepFunnelLayout';
import FacebookPixel from '../components/FacebookPixel';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import ChatBubble from '../components/ChatBubble';

const OfferPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { isAuthenticated, user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [tempPassword, setTempPassword] = useState('');
    const [draftOrderId, setDraftOrderId] = useState<number | null>(() => {
        const saved = sessionStorage.getItem(`draft_order_id_offerpage_${slug}`);
        return saved ? parseInt(saved, 10) : null;
    });
    const isOrderSubmittedRef = useRef(false);

    useEffect(() => {
        if (draftOrderId) {
            sessionStorage.setItem(`draft_order_id_offerpage_${slug}`, draftOrderId.toString());
        } else {
            sessionStorage.removeItem(`draft_order_id_offerpage_${slug}`);
        }
    }, [draftOrderId, slug]);

    const [ipAddress, setIpAddress] = useState('');
    const [createdOrder, setCreatedOrder] = useState<any>(null);

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
        email: '',
        district: '',
        upazila: '',
        address: '',
        order_note: '',
        shipping_zone: '',
        payment_method: '1', // COD default
    });

    const [selectedVariants, setSelectedVariants] = useState<any[]>([]);
    const [selectedZone, setSelectedZone] = useState<any>(null);
    const [shippingCost, setShippingCost] = useState(0);

    // Pre-fill data if user is authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            setFormData(prev => ({
                ...prev,
                customer_name: user.user?.first_name || user.profile?.full_name || prev.customer_name,
                phone_number: user.user?.username || user.profile?.phone_number || prev.phone_number,
                email: user.user?.email || prev.email,
                address: user.profile?.address || prev.address,
                district: user.profile?.district?.id?.toString() || prev.district,
                upazila: user.profile?.upazila?.id?.toString() || prev.upazila,
            }));
        }
    }, [isAuthenticated, user]);

    // Fetch Funnel Data
    const { data: funnelData, isLoading: isLoadingFunnel, error } = useQuery({
        queryKey: ['funnel', slug],
        queryFn: () => getFunnelBySlug(slug!).then(res => res.data),
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
        if (funnelData?.product_details) {
            const product = funnelData.product_details;
            let priceVal = Math.floor(product.sale_price || product.regular_price);
            if (funnelData.discount_percentage) {
                const discount = parseFloat(funnelData.discount_percentage);
                priceVal = Math.floor(product.regular_price * (1 - discount / 100));
            }
            
            if (!hasPushedGTMRef.current) {
                if (!(window as any).__tracked_gtm_offer) {
                    const eventId = Date.now().toString();
                    
                    const ecommerceData = {
                        value: priceVal,
                        currency: 'BDT',
                        items: [{
                            item_name: product.name,
                            item_id: product.sku || product.id?.toString(),
                            price: priceVal.toString(),
                            quantity: 1
                        }]
                    };

                    if ((window as any).dataLayer) {
                        (window as any).dataLayer.push({
                            event: 'begin_checkout',
                            event_id: eventId,
                            ecommerce: ecommerceData
                        });
                    }

                    const firePixel = () => {
                        if (typeof (window as any).fbq === 'function') {
                            (window as any).fbq('track', 'InitiateCheckout', {
                                value: priceVal,
                                currency: 'BDT',
                                content_ids: [product.sku || product.id?.toString()],
                                content_name: product.name,
                                content_type: 'product',
                                num_items: 1
                            });
                        } else {
                            setTimeout(firePixel, 500);
                        }
                    };
                    firePixel();

                    (window as any).__tracked_gtm_offer = true;
                }
                hasPushedGTMRef.current = true;
            }
        }
    }, [funnelData]);

    const [districts, setDistricts] = useState<any[]>([]);
    const [upazilas, setUpazilas] = useState<any[]>([]);
    const [shippingZones, setShippingZones] = useState<any[]>([]);
    const [siteSettings, setSiteSettings] = useState<any>(null);

    // Initial Data Fetch
    useEffect(() => {
        getDistricts().then(res => setDistricts(res.data.results || res.data));
        getShippingZones().then(res => {
            const zones = res.data.results || res.data;
            setShippingZones(zones);
            // Default to Outside Dhaka on load
            const insideZone = zones.find((z: any) =>
                z.name.toLowerCase().includes('outside dhaka city') ||
                z.name.toLowerCase().includes('outside')
            ) || zones[0];
            if (insideZone) {
                setShippingCost(parseFloat(insideZone.shipping_cost));
                setSelectedZone(insideZone);
                setFormData(prev => ({ ...prev, shipping_zone: insideZone.id.toString() }));
            }
        });
        getSiteSettings().then(res => {
            const data = res.data.results || res.data;
            setSiteSettings(Array.isArray(data) ? data[0] : data);
        });
    }, []);

    // Initialize variants when funnel data is loaded
    useEffect(() => {
        if (funnelData?.product_details) {
            const buildVariants = (product: any, defaultQuantity = 0) => {
                const price = product.sale_price || product.regular_price;
                const variants: any[] = [];
                
                if (product.colors && product.colors.length > 0 && product.sizes && product.sizes.length > 0) {
                    product.colors.forEach((c: any) => {
                        product.sizes.forEach((s: any) => {
                            const colorImg = product.images?.find((img: any) => img.color === c.id || img.color_details?.id === c.id)?.image || product.image;
                            variants.push({
                                id: `${product.id}-${c.id}-${s.id}`,
                                product_id: product.id,
                                color: c,
                                size: s,
                                price: price,
                                image: colorImg,
                                quantity: defaultQuantity
                            });
                        });
                    });
                } else if (product.colors && product.colors.length > 0) {
                    product.colors.forEach((c: any) => {
                        const colorImg = product.images?.find((img: any) => img.color === c.id || img.color_details?.id === c.id)?.image || product.image;
                        variants.push({
                            id: `${product.id}-${c.id}`,
                            product_id: product.id,
                            color: c,
                            price: price,
                            image: colorImg,
                            quantity: defaultQuantity
                        });
                    });
                } else if (product.sizes && product.sizes.length > 0) {
                    product.sizes.forEach((s: any) => {
                        variants.push({
                            id: `${product.id}-${s.id}`,
                            product_id: product.id,
                            size: s,
                            price: price,
                            image: product.image,
                            quantity: defaultQuantity
                        });
                    });
                } else {
                    variants.push({
                        id: `default-${product.id}`,
                        product_id: product.id,
                        price: price,
                        quantity: 1
                    });
                }
                return variants;
            };

            const primaryVars = buildVariants(funnelData.product_details, 0);
            
            // Auto-select the first primary variant
            if (primaryVars.length > 0) {
                primaryVars[0].quantity = 1;
            }

            let combinedVars = [...primaryVars];

            // If it is a combo funnel layout and secondary product is configured, fetch its variants too!
            if (funnelData.layout_type === 'combo' && funnelData.product_two_details) {
                const secondaryVars = buildVariants(funnelData.product_two_details, 0);
                if (secondaryVars.length > 0) {
                    secondaryVars[0].quantity = 1;
                }
                combinedVars = [...primaryVars, ...secondaryVars];
            }

            setSelectedVariants(combinedVars);
        }
    }, [funnelData]);

    const handleVariantSelect = (variantId: any) => {
        setSelectedVariants(prev => prev.map(v => {
            if (v.id === variantId) {
                return { ...v, quantity: v.quantity > 0 ? 0 : 1 };
            }
            return funnelData?.layout_type === 'combo' ? v : { ...v, quantity: 0 };
        }));
    };

    const handleVariantQuantityChange = (variantId: any, delta: number) => {
        setSelectedVariants(prev => prev.map(v => {
            if (v.id === variantId) {
                return { ...v, quantity: Math.max(0, v.quantity + delta) };
            }
            return funnelData?.layout_type === 'combo' ? v : { ...v, quantity: 0 };
        }));
    };

    // Fetch Upazilas when district changes
    useEffect(() => {
        if (formData.district) {
            getUpazilas(formData.district).then(res => setUpazilas(res.data.results || res.data));
        } else {
            setUpazilas([]);
        }
    }, [formData.district]);

    // Calculate Dynamic Price if Flash Sale is active
    const calculatePrice = () => {
        if (!funnelData || !funnelData.product_details) return 0;
        const product = funnelData.product_details;
        // If funnel has a specific discount or if product has sale_price, use it
        if (funnelData.discount_percentage) {
            const discount = parseFloat(funnelData.discount_percentage);
            return Math.floor(product.regular_price * (1 - discount / 100));
        }
        return Math.floor(product.sale_price || product.regular_price);
    };

    const currentPrice = calculatePrice();

    // Calculate Subtotal from variants
    const calculateSubtotal = () => {
        const total = selectedVariants.reduce((sum, v) => sum + (v.price * v.quantity), 0);
        return total || currentPrice;
    };

    const subtotal = calculateSubtotal();

    
    const hasTrackedSuccessRef = useRef(false);
  
    // Track Purchase Event when isSuccess becomes true
    useEffect(() => {
        if (isSuccess && !hasTrackedSuccessRef.current) {
            hasTrackedSuccessRef.current = true;
            window.scrollTo(0, 0);
            
            // Google Tag Manager dataLayer Purchase Event
            if ((window as any).dataLayer) {
                const totalQty = createdOrder.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 
                                 selectedVariants.filter(v => v.quantity > 0).reduce((sum, v) => sum + v.quantity, 0) || 
                                 1;
                const finalAddress = createdOrder.address || (siteSettings?.enable_district_upazila !== false 
                    ? `${formData.address}${formData.upazila ? `, ${upazilas.find(u => u.id == formData.upazila)?.name || formData.upazila}` : ''}${formData.district ? `, ${districts.find(d => d.id == formData.district)?.name || formData.district}` : ''}`
                    : formData.address);
                const finalPhone = createdOrder.phone_number || formData.phone_number;

                (window as any).dataLayer.push({
                    event: 'purchase',
                    customer_name: createdOrder.customer_name || formData.customer_name,
                    customer_phone: finalPhone,
                    customer_address: finalAddress,
                    address: finalAddress,
                    total_amount: parseFloat(createdOrder.total_amount) || (subtotal + shippingCost),
                    event_id: createdOrder.id ? `order_${createdOrder.id}` : Date.now().toString(),
                    order_id: createdOrder.id,
                    quantity: totalQty,
                    ip_address: createdOrder.ip_address || ipAddress,
                    content_ids: createdOrder.items ? createdOrder.items.map((item: any) => item.product_details?.sku || item.product.toString()) : [funnelData.product_details.sku || funnelData.product_details.id.toString()],
                    content_name: funnelData.product_details.name,
                    content_type: 'product',
                    ecommerce: {
                        transaction_id: createdOrder.id ? `order_${createdOrder.id}` : Date.now().toString(),
                        value: parseFloat(createdOrder.total_amount) || (subtotal + shippingCost),
                        currency: 'BDT',
                        items: createdOrder.items?.map((item: any) => ({
                            item_name: item.product_name || item.product_details?.name || funnelData.product_details.name,
                            item_id: item.product_details?.sku || item.product.toString(),
                            price: parseFloat(item.price),
                            quantity: item.quantity,
                            color: item.color_name || '',
                            size: item.size_name || ''
                        })) || [{
                            item_name: funnelData.product_details.name,
                            item_id: funnelData.product_details.sku || funnelData.product_details.id.toString(),
                            price: currentPrice,
                            quantity: 1,
                            color: '',
                            size: ''
                        }]
                    }
                });


            }
        }
    }, [isSuccess, createdOrder, funnelData, currentPrice, selectedVariants, subtotal, shippingCost, formData, upazilas, districts, siteSettings, ipAddress]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        if (name === 'phone_number') {
            const cleaned = value.replace(/\D/g, '').slice(0, 11);
            setFormData(prev => ({ ...prev, phone_number: cleaned }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Shipping Cost Logic
    useEffect(() => {
        if (siteSettings?.enable_district_upazila !== false && shippingZones.length > 0) {
            if (formData.district) {
                const district = districts.find(d => d.id == formData.district);
                if (district?.name.includes('Dhaka')) {
                    const zone = shippingZones.find(z => z.name.toLowerCase().includes('inside'));
                    if (zone) {
                        setShippingCost(parseFloat(zone.shipping_cost));
                        setSelectedZone(zone);
                    } else {
                        setShippingCost(50);
                    }
                } else {
                    const zone = shippingZones.find(z => z.name.toLowerCase().includes('outside'));
                    if (zone) {
                        setShippingCost(parseFloat(zone.shipping_cost));
                        setSelectedZone(zone);
                    } else {
                        setShippingCost(100);
                    }
                }
            }
        }
    }, [formData.district, siteSettings, districts, shippingZones]);

    const getShippingZoneId = () => {
        if (siteSettings?.enable_district_upazila !== false) {
            if (formData.district) {
                const district = districts.find(d => d.id == formData.district);
                if (district?.name.includes('Dhaka')) {
                    const zone = shippingZones.find(z => z.name.toLowerCase().includes('inside'));
                    return zone ? zone.id : 1;
                } else {
                    const zone = shippingZones.find(z => z.name.toLowerCase().includes('outside'));
                    return zone ? zone.id : 2;
                }
            }
            // No district selected — default to inside Dhaka
            const insideZone = shippingZones.find(z => z.name.toLowerCase().includes('inside'));
            return insideZone ? insideZone.id : (shippingZones[0]?.id || 1);
        } else {
            return formData.shipping_zone ? parseInt(formData.shipping_zone) : (shippingZones.find(z => z.name.toLowerCase().includes('inside'))?.id || 1);
        }
    };

    useEffect(() => {
        if (siteSettings?.enable_district_upazila === false && formData.shipping_zone) {
            const zone = shippingZones.find(z => z.id == formData.shipping_zone);
            if (zone) {
                setShippingCost(parseFloat(zone.shipping_cost));
                setSelectedZone(zone);
            }
        }
    }, [formData.shipping_zone, siteSettings, shippingZones]);

    // Debounced draft auto-save
    useEffect(() => {
        if (siteSettings?.enable_draft_orders === false) return;
        const hasContact = formData.phone_number.length >= 3 || formData.customer_name.length >= 3;
        if (!hasContact || !funnelData) return;
        if (!hasReachedFourMinutesRef.current) return;

        const timer = setTimeout(async () => {
            if (isOrderSubmittedRef.current) return;
            const orderData = {
                customer_name: formData.customer_name || 'Incomplete Customer',
                phone_number: formData.phone_number,
                email: formData.email,
                address: siteSettings?.enable_district_upazila !== false 
                    ? `${formData.address}${formData.upazila ? `, ${upazilas.find(u => u.id == formData.upazila)?.name || formData.upazila}` : ''}${formData.district ? `, ${districts.find(d => d.id == formData.district)?.name || formData.district}` : ''}`
                    : formData.address || 'Incomplete Address',
                order_note: formData.order_note,
                funnel: funnelData.id,
                items: selectedVariants.filter(v => v.quantity > 0).map(v => {
                    let colorId = null;
                    let sizeId = null;
                    if (v.id !== 'default') {
                        if (v.color && v.size) {
                            colorId = v.color.id;
                            sizeId = v.size.id;
                        } else if (v.color) {
                            colorId = v.color.id;
                        } else if (v.size) {
                            sizeId = v.size.id;
                        }
                    }
                    return {
                        product: v.product_id || funnelData.product_details.id,
                        color: colorId,
                        size: sizeId,
                        quantity: v.quantity,
                        price: v.price
                    };
                }),
                shipping_zone: getShippingZoneId(),
                shipping_cost: shippingCost,
                total_amount: subtotal + shippingCost,
                payment_method: 1
            };

            if (orderData.items.length === 0) {
                orderData.items.push({
                    product: funnelData.product_details.id,
                    color: null,
                    size: null,
                    quantity: 1,
                    price: currentPrice
                });
                if (funnelData.layout_type === 'combo' && funnelData.product_two_details) {
                    const price2 = funnelData.product_two_details.sale_price || funnelData.product_two_details.regular_price;
                    orderData.items.push({
                        product: funnelData.product_two_details.id,
                        color: null,
                        size: null,
                        quantity: 1,
                        price: price2
                    });
                }
            }

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
                console.error("Draft auto-save failed", err);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [formData, selectedVariants, shippingCost, subtotal, funnelData, draftOrderId, shippingZones, districts, siteSettings, fourMinuteTrigger]);

    // Immediate save on unmount / beforeunload
    const saveDraftImmediatelyRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        saveDraftImmediatelyRef.current = () => {
            if (siteSettings?.enable_draft_orders === false) return;
            if (isOrderSubmittedRef.current) return;
            if (!hasReachedFourMinutesRef.current) return;
            const hasContact = formData.phone_number.length >= 3 || formData.customer_name.length >= 3;
            if (!hasContact || !funnelData) return;

            const orderData = {
                customer_name: formData.customer_name || 'Incomplete Customer',
                phone_number: formData.phone_number,
                email: formData.email,
                address: siteSettings?.enable_district_upazila !== false 
                    ? `${formData.address}${formData.upazila ? `, ${upazilas.find(u => u.id == formData.upazila)?.name || formData.upazila}` : ''}${formData.district ? `, ${districts.find(d => d.id == formData.district)?.name || formData.district}` : ''}`
                    : formData.address || 'Incomplete Address',
                order_note: formData.order_note,
                funnel: funnelData.id,
                items: selectedVariants.filter(v => v.quantity > 0).map(v => {
                    let colorId = null;
                    let sizeId = null;
                    if (v.id !== 'default') {
                        if (v.color && v.size) {
                            colorId = v.color.id;
                            sizeId = v.size.id;
                        } else if (v.color) {
                            colorId = v.color.id;
                        } else if (v.size) {
                            sizeId = v.size.id;
                        }
                    }
                    return {
                        product: v.product_id || funnelData.product_details.id,
                        color: colorId,
                        size: sizeId,
                        quantity: v.quantity,
                        price: v.price
                    };
                }),
                shipping_zone: getShippingZoneId(),
                shipping_cost: shippingCost,
                total_amount: subtotal + shippingCost,
                payment_method: 1
            };

            if (orderData.items.length === 0) {
                orderData.items.push({
                    product: funnelData.product_details.id,
                    color: null,
                    size: null,
                    quantity: 1,
                    price: currentPrice
                });
                if (funnelData.layout_type === 'combo' && funnelData.product_two_details) {
                    const price2 = funnelData.product_two_details.sale_price || funnelData.product_two_details.regular_price;
                    orderData.items.push({
                        product: funnelData.product_two_details.id,
                        color: null,
                        size: null,
                        quantity: 1,
                        price: price2
                    });
                }
            }

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
                        sessionStorage.setItem(`draft_order_id_offerpage_${slug}`, data.id.toString());
                    }
                })
                .catch(err => console.error("Error creating draft beforeunload:", err));
            }
        };
    }, [formData, selectedVariants, shippingCost, subtotal, funnelData, draftOrderId, slug, upazilas, districts, currentPrice, siteSettings, shippingZones]);

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
                email: formData.email,
                address: siteSettings?.enable_district_upazila !== false 
                    ? `${formData.address}${formData.upazila ? `, ${upazilas.find(u => u.id == formData.upazila)?.name || formData.upazila}` : ''}${formData.district ? `, ${districts.find(d => d.id == formData.district)?.name || formData.district}` : ''}`
                    : formData.address,
                order_note: formData.order_note,
                funnel: funnelData.id,
                items: selectedVariants.filter(v => v.quantity > 0).map(v => {
                    let colorId = null;
                    let sizeId = null;
                    if (v.id !== 'default') {
                        if (v.color && v.size) {
                            colorId = v.color.id;
                            sizeId = v.size.id;
                        } else if (v.color) {
                            colorId = v.color.id;
                        } else if (v.size) {
                            sizeId = v.size.id;
                        }
                    }
                    return {
                        product: v.product_id || funnelData.product_details.id,
                        color: colorId,
                        size: sizeId,
                        quantity: v.quantity,
                        price: v.price
                    };
                }),
                shipping_zone: getShippingZoneId(),
                shipping_cost: shippingCost,
                total_amount: subtotal + shippingCost,
                payment_method: 1 // COD default for funnels
            };

            // If no items selected and no variants (default case)
            if (orderData.items.length === 0) {
                orderData.items.push({
                    product: funnelData.product_details.id,
                    color: null,
                    size: null,
                    quantity: 1,
                    price: currentPrice
                });
                if (funnelData.layout_type === 'combo' && funnelData.product_two_details) {
                    const price2 = funnelData.product_two_details.sale_price || funnelData.product_two_details.regular_price;
                    orderData.items.push({
                        product: funnelData.product_two_details.id,
                        color: null,
                        size: null,
                        quantity: 1,
                        price: price2
                    });
                }
            }

            const res = await createOrder(orderData);
            
            // Mark as submitted to prevent any subsequent draft saves/updates
            isOrderSubmittedRef.current = true;
            
            if (res.data?.temp_password || res.data?.password || res.data?.guest_password) {
                setTempPassword(res.data.temp_password || res.data.password || res.data.guest_password);
            }

            // Cleanup the draft order since the purchase is successful!
            if (draftOrderId) {
                try {
                    await deleteDraftOrder(draftOrderId);
                } catch (delErr) {
                    console.error("Failed to delete draft order after success:", delErr);
                }
                setDraftOrderId(null);
            }

            setCreatedOrder(res.data);
            setIsSuccess(true);
        } catch (err) {
            console.error("Order failed", err);
            alert("Failed to place order. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoadingFunnel) {
        return null;
    }

    if (error || !funnelData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Offer Not Found</h1>
                <p className="text-slate-500 mb-6">The special offer you are looking for may have expired or been removed.</p>
                <button onClick={() => navigate('/')} className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold">Back to Home</button>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center relative overflow-hidden">
                <FacebookPixel pixelId={funnelData.pixel_id} />
                
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-10"></div>
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#FF6B00] rounded-full mix-blend-multiply filter blur-[128px] opacity-10"></div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-2xl p-6 md:p-10 max-w-lg w-full relative z-10 border border-slate-100/80 transform scale-100 transition-all duration-500">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner animate-bounce">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">{language === 'bn' ? 'অর্ডার সফল হয়েছে!' : 'Order Successful!'}</h1>
                    <p className="text-slate-500 text-sm md:text-base mb-6 max-w-md mx-auto">
                        {language === 'bn' ? 'আপনার অর্ডারের জন্য ধন্যবাদ। আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।' : 'Thank you for your order. Our representative will contact you soon.'}
                    </p>

                    {/* Guest Account Panel */}
                    {!isAuthenticated && (
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left mb-6 space-y-4 shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-200/60 pb-3">
                                <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                </span>
                                <div>
                                    <h3 className="font-extrabold text-slate-800 text-sm">{language === 'bn' ? 'অ্যাকাউন্ট তৈরি করা হয়েছে!' : 'Account Created Successfully!'}</h3>
                                    <p className="text-[11px] text-slate-400 font-medium">{language === 'bn' ? 'অর্ডার ট্র্যাক করতে ও পরবর্তীতে ব্যবহার করতে অ্যাকাউন্ট তৈরি করা হয়েছে' : 'An account has been created for your phone number.'}</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-1">
                                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                    {language === 'bn' ? 'আপনার মোবাইল নম্বর দিয়ে লগইন করে পাসওয়ার্ড সেট করুন।' : 'Please set up your password by logging in with your phone number.'}
                                </p>
                                <div className="h-[1px] bg-slate-200/60" />
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-bold">{language === 'bn' ? 'ব্যবহারকারীর নাম (ফোন):' : 'Username (Phone):'}</span>
                                    <span className="font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200">{formData.phone_number}</span>
                                </div>
                                {tempPassword && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-bold">{language === 'bn' ? 'অস্থায়ী পাসওয়ার্ড:' : 'Temporary Password:'}</span>
                                        <span className="font-mono font-bold text-emerald-600 bg-white px-3 py-1 rounded-lg border border-slate-200 select-all select-text">{tempPassword}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                                        <button 
                        onClick={() => navigate('/')} 
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-wider text-sm shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                    >
                        {language === 'bn' ? 'হোম পেজে যান' : 'Go to Home Page'}
                    </button>
                </div>
            </div>
        );
    }



    const commonProps = {
        product: funnelData.product_details,
        funnel: funnelData,
        formData,
        handleChange,
        handleSubmit,
        submitting,
        districts,
        upazilas,
        siteSettings,
        shippingZones,
        finalTotal: subtotal + shippingCost,
        subtotal: subtotal,
        shippingCost,
        selectedZone,
        selectedVariants,
        handleVariantQuantityChange,
        handleVariantSelect,
    };

    const renderLayout = () => {
        switch (funnelData.layout_type) {
            case 'combo':
                return <ComboFunnelLayout {...commonProps} />;
            case 'ezymart_v2':
                return <EzymartFunnelLayout {...commonProps} />;
            case 'ezymart':
                return <EzyFunnelLayout {...commonProps} />;
            case 'professional':
                return <ProfessionalFunnelLayout {...commonProps} />;
            case 'garden':
                return <GardenFunnelLayout {...commonProps} />;
            case 'premium':
                return <PremiumFunnelLayout {...commonProps} />;
            case 'step':
                return <StepFunnelLayout {...commonProps} />;
            default:
                return <ClassicFunnelLayout {...commonProps} />;
        }
    };

    return (
        <>
            <SEO 
                title={funnelData.title} 
                description={`Special Offer: ${funnelData.product_details.name}. Get it now at a discounted price!`}
                image={funnelData.product_details.image}
            />
            <FacebookPixel pixelId={funnelData.pixel_id} />
            {renderLayout()}
            <ChatBubble />
        </>
    );
};

export default OfferPage;