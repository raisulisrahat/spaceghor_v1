import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowLeft, CreditCard, ShieldCheck, Mail, Phone, User, MapPin, Lock, ChevronRight, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createOrder, getDistricts, getUpazilas, getPaymentMethods, getShippingZones, createDraftOrder, updateDraftOrder, deleteDraftOrder } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Breadcrumbs from '../components/Breadcrumbs';
import SEO from '../components/SEO';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cart, cartTotal, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { settings, siteTitle } = useSettings();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [draftOrderId, setDraftOrderId] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('draft_order_id_checkout');
    return saved ? parseInt(saved, 10) : null;
  });
  const isOrderSubmittedRef = useRef(false);
  const hasSentBeginCheckoutRef = useRef(false);

  useEffect(() => {
    if (draftOrderId) {
      sessionStorage.setItem('draft_order_id_checkout', draftOrderId.toString());
    } else {
      sessionStorage.removeItem('draft_order_id_checkout');
    }
  }, [draftOrderId]);
  
  const [ipAddress, setIpAddress] = useState('');

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(err => console.error("Error fetching IP:", err));
  }, []);

  useEffect(() => {
    if (cart.length > 0 && !hasSentBeginCheckoutRef.current && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'begin_checkout',
        ecommerce: {
          value: cartTotal,
          currency: 'BDT',
          items: cart.map(item => {
            const itemData: any = {
              item_name: item.name,
              item_id: item.id,
              price: parseFloat(item.price.toString().replace(/[^0-9.]/g, '')) || 0,
              quantity: item.quantity,
              color: item.color?.name || '',
              size: item.size?.name || ''
            };
            if (item.color) {
              itemData.item_variant = item.color.name;
            }
            if (item.size) {
              if (itemData.item_variant) {
                itemData.item_variant += ` / ${item.size.name}`;
              } else {
                itemData.item_variant = item.size.name;
              }
            }
            return itemData;
          })
        }
      });
      hasSentBeginCheckoutRef.current = true;
    }
  }, [cart, cartTotal]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    district: '',
    upazila: '',
  });

  const [districts, setDistricts] = useState<{id: number, name: string}[]>([]);
  const [upazilas, setUpazilas] = useState<{id: number, name: string}[]>([]);
  const [shippingZones, setShippingZones] = useState<{id: number, name: string, shipping_cost: string}[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{id: number, name: string, provider: string}[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [shippingZoneId, setShippingZoneId] = useState<number | null>(null); // Default to null

  const [shippingCost, setShippingCost] = useState(0);

  // Set initial default shipping zone to Outside Dhaka when zones load
  useEffect(() => {
    if (shippingZones.length > 0 && shippingZoneId === null) {
      const insideZone = shippingZones.find(z =>
        z.name.toLowerCase().includes('outside dhaka city') ||
        z.name.toLowerCase().includes('outside')
      ) || shippingZones[0];
      if (insideZone) {
        setShippingCost(parseFloat(insideZone.shipping_cost));
        setShippingZoneId(insideZone.id);
      }
    }
  }, [shippingZones]);

  // Dhaka City upazilas (only used when district is "Dhaka" without "City" suffix)
  const DHAKA_CITY_UPAZILAS = [
    'Dhaka Sadar', 'Demra', 'Dhanmondi', 'Gulshan', 'Jatrabari',
    'Khilgaon', 'Khilkhet', 'Kotwali', 'Lalbagh', 'Mirpur',
    'Mohammadpur', 'Motijheel', 'Pallabi', 'Ramna', 'Rayer Bazar',
    'Sabujbagh', 'Shah Ali', 'Sher-e-Bangla Nagar', 'Sutrapur',
    'Tejgaon', 'Turag', 'Uttara', 'Badda', 'Cantonment',
    'Dakshinkhan', 'Uttarkhan', 'Vatara', 'Darus Salam',
    'Adabor', 'Bangshal', 'Chawk Bazar', 'Gandaria', 'Hazaribag',
    'Kafrul', 'Kalabagan', 'Kamrangirchar', 'Mugda', 'Nawabganj',
    'Wari',
  ];

  // Update shipping cost and zone when district/upazila changes
  useEffect(() => {
    if (settings?.enable_district_upazila !== false && shippingZones.length > 0) {
        const districtLower = formData.district.toLowerCase();
        const isDhakaDistrict = districtLower.includes('dhaka');

        // If district is explicitly "Dhaka City" (contains 'city'), every upazila under it
        // belongs to the city corporation → always 50 TK, no upazila check needed.
        // If district is plain "Dhaka" (no 'city'), check the upazila list.
        const isDhakaCity = isDhakaDistrict && (
          districtLower.includes('city') ||
          (!!formData.upazila &&
            DHAKA_CITY_UPAZILAS.some(u => formData.upazila.toLowerCase().includes(u.toLowerCase())))
        );

        if (isDhakaCity) {
            // Inside Dhaka City Corporation - ৳50
            // Must match 'inside dhaka city' specifically, NOT 'outside dhaka city'
            const zone = shippingZones.find(z => z.name.toLowerCase().includes('inside dhaka city'))
                      ?? shippingZones.find(z => z.name.toLowerCase().includes('inside'));
            if (zone) {
                setShippingCost(parseFloat(zone.shipping_cost));
                setShippingZoneId(zone.id);
            } else {
                setShippingCost(50);
                setShippingZoneId(shippingZones[0]?.id || 1);
            }
        } else if (formData.district) {
            // Outside Dhaka City: other districts, OR Dhaka district non-city upazilas - ৳100
            // Must match 'outside dhaka city' specifically, NOT 'inside dhaka city'
            const zone = shippingZones.find(z => z.name.toLowerCase().includes('outside dhaka city'))
                      ?? shippingZones.find(z => z.name.toLowerCase().includes('outside'));
            if (zone) {
                setShippingCost(parseFloat(zone.shipping_cost));
                setShippingZoneId(zone.id);
            } else {
                setShippingCost(100);
                setShippingZoneId(shippingZones[1]?.id || 2);
            }
        } else {
            // No district selected — default to Outside/100 TK zone
            const zone = shippingZones.find(z => z.name.toLowerCase().includes('outside dhaka city'))
                      ?? shippingZones.find(z => z.name.toLowerCase().includes('outside'));
            if (zone) {
                setShippingCost(parseFloat(zone.shipping_cost));
                setShippingZoneId(zone.id);
            } else {
                setShippingCost(50);
                setShippingZoneId(shippingZones[0]?.id || 1);
            }

        }
    }
  }, [formData.district, formData.upazila, settings?.enable_district_upazila, shippingZones]);

  // Fetch Districts on mount
  useEffect(() => {
    const fetchDistricts = async () => {
        try {
            const response = await getDistricts();
            setDistricts(response.data);
        } catch (err) {
            console.error('Failed to fetch districts:', err);
        }
    };
    fetchDistricts();

    const fetchShippingZones = async () => {
        try {
            const response = await getShippingZones();
            setShippingZones(response.data.results || response.data);
        } catch (err) {
            console.error('Failed to fetch shipping zones:', err);
        }
    };
    fetchShippingZones();
    
    const fetchPaymentMethods = async () => {
        try {
            const response = await getPaymentMethods();
            setPaymentMethods(response.data);
            if (response.data.length > 0) {
                setSelectedPaymentMethod(response.data[0].id);
            }
        } catch (err) {
            console.error('Failed to fetch payment methods:', err);
        }
    };
    fetchPaymentMethods();
  }, []);

  // Fetch Upazilas when district changes
  useEffect(() => {
    const fetchUpazilas = async () => {
        if (!formData.district) {
            setUpazilas([]);
            return;
        }

        const selectedDistrict = districts.find(d => d.name === formData.district);
        if (selectedDistrict) {
            setIsLoadingLocations(true);
            try {
                const response = await getUpazilas(selectedDistrict.id.toString());
                setUpazilas(response.data);
            } catch (err) {
                console.error('Failed to fetch upazilas:', err);
            } finally {
                setIsLoadingLocations(false);
            }
        }
    };
    fetchUpazilas();
  }, [formData.district, districts]);

  // Pre-fill data if user is authenticated or has saved form data
  useEffect(() => {
    const savedForm = sessionStorage.getItem('checkout_form_data');
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm);
        setFormData(parsed);
        // Clear it after parsing so it doesn't linger forever
        sessionStorage.removeItem('checkout_form_data');
      } catch (e) {
        console.error("Failed to parse saved checkout form:", e);
      }
    } else if (isAuthenticated && user) {
      setFormData({
        name: user.user?.first_name || '',
        phone: user.user?.username || '', // Backend uses phone as username
        address: user.profile?.address || '',
        district: user.profile?.district?.name || '',
        upazila: user.profile?.upazila?.name || '',
      });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isSuccess) {
      window.scrollTo(0, 0);
    }
  }, [isSuccess]);

  useEffect(() => {
    const status = searchParams.get('status');
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');
    const message = searchParams.get('message');

    if (status === 'success') {
      // Google Tag Manager dataLayer Purchase Event
      if ((window as any).dataLayer && cart.length > 0) {
        const orderId = searchParams.get('order_id') || `checkout_${Date.now()}`;
        const finalName = name || formData.name;
        const finalPhone = phone || formData.phone;
        const finalAddress = formData.district ? `${formData.address}, ${formData.upazila}, ${formData.district}` : formData.address;
        const totalAmountVal = cartTotal + shippingCost;
        const totalQuantityVal = cart.reduce((total, item) => total + item.quantity, 0);

        (window as any).dataLayer.push({
          event: 'purchase',
          customer_name: finalName,
          customer_phone: finalPhone,
          customer_address: finalAddress,
          total_amount: totalAmountVal,
          order_id: orderId,
          quantity: totalQuantityVal,
          ip_address: ipAddress,
          ecommerce: {
            transaction_id: orderId,
            value: totalAmountVal,
            currency: 'BDT',
            items: cart.map(item => {
              const itemData: any = {
                item_name: item.name,
                item_id: item.id,
                price: parseFloat(item.price.toString().replace(/[^0-9.]/g, '')) || 0,
                quantity: item.quantity,
                color: item.color?.name || '',
                size: item.size?.name || ''
              };
              if (item.color) {
                itemData.item_variant = item.color.name;
              }
              if (item.size) {
                if (itemData.item_variant) {
                  itemData.item_variant += ` / ${item.size.name}`;
                } else {
                  itemData.item_variant = item.size.name;
                }
              }
              return itemData;
            })
          }
        });
      }
      setIsSuccess(true);
      clearCart();
      if (name) setFormData(prev => ({ ...prev, name }));
      if (phone) setFormData(prev => ({ ...prev, phone }));
      sessionStorage.removeItem('draft_order_id_checkout');
    } else if (status === 'cancel') {
      setPaymentError('bKash payment was cancelled. Please select a payment method and try again.');
    } else if (status === 'failure') {
      setPaymentError(message || 'bKash payment failed. Please try again.');
    }
  }, [searchParams, clearCart]);

  // Debounced draft auto-save
  useEffect(() => {
    const hasContact = formData.phone.length >= 3 || formData.name.length >= 3;
    if (!hasContact || cart.length === 0) return;

    const timer = setTimeout(async () => {
      if (isOrderSubmittedRef.current) return;
      const orderData = {
        customer_name: formData.name || 'Incomplete Customer',
        phone_number: formData.phone,
        address: formData.district ? `${formData.address}, ${formData.upazila}, ${formData.district}` : formData.address || 'Incomplete Address',
        items: cart.map(item => ({
          product: item.id,
          quantity: item.quantity,
          price: item.price,
          color: item.color?.id,
          size: item.size?.id
        })),
        shipping_zone: shippingZoneId,
        payment_method: selectedPaymentMethod || 1,
        shipping_cost: shippingCost,
        total_amount: cartTotal + shippingCost
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
        console.error('Draft auto-save failed:', err);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData, cart, shippingZoneId, selectedPaymentMethod, shippingCost, cartTotal, draftOrderId]);

  // Immediate save on unmount / beforeunload
  const saveDraftImmediatelyRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    saveDraftImmediatelyRef.current = () => {
      if (isOrderSubmittedRef.current) return;
      const hasContact = formData.phone.length >= 3 || formData.name.length >= 3;
      if (!hasContact || cart.length === 0) return;

      const orderData = {
        customer_name: formData.name || 'Incomplete Customer',
        phone_number: formData.phone,
        address: formData.district ? `${formData.address}, ${formData.upazila}, ${formData.district}` : formData.address || 'Incomplete Address',
        items: cart.map(item => ({
          product: item.id,
          quantity: item.quantity,
          price: item.price,
          color: item.color?.id,
          size: item.size?.id
        })),
        shipping_zone: shippingZoneId,
        payment_method: selectedPaymentMethod || 1,
        shipping_cost: shippingCost,
        total_amount: cartTotal + shippingCost
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
            sessionStorage.setItem('draft_order_id_checkout', data.id.toString());
          }
        })
        .catch(err => console.error("Error creating draft beforeunload:", err));
      }
    };
  }, [formData, cart, shippingZoneId, selectedPaymentMethod, shippingCost, cartTotal, draftOrderId]);

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
    
    if (cart.some(item => item.stock !== undefined && item.stock <= 0)) {
      alert('Your cart contains out of stock items. Please remove them before proceeding.');
      return;
    }
    
    const phone = formData.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      alert('Please enter a valid 11-digit contact number starting with 01 (e.g. 017XXXXXXXX).');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Create order in backend
      const orderData = {
        customer_name: formData.name,
        phone_number: formData.phone,
        address: formData.district ? `${formData.address}, ${formData.upazila}, ${formData.district}` : formData.address,
        items: cart.map(item => ({
          product: item.id,
          quantity: item.quantity,
          price: item.price,
          color: item.color?.id,
          size: item.size?.id
        })),
        shipping_zone: shippingZoneId,
        payment_method: selectedPaymentMethod,
        shipping_cost: shippingCost,
        total_amount: cartTotal + shippingCost
      };
      
      const res = await createOrder(orderData);
      
      // Mark as submitted to prevent any subsequent draft saves/updates
      isOrderSubmittedRef.current = true;
      
      // Cleanup the draft order since the purchase is initiated/successful!
      if (draftOrderId) {
        try {
          await deleteDraftOrder(draftOrderId);
        } catch (delErr) {
          console.error("Failed to delete draft order:", delErr);
        }
        setDraftOrderId(null);
      }

      if (res.data?.bkash_url) {
        // Save form data to session storage before redirecting to bkash
        sessionStorage.setItem('checkout_form_data', JSON.stringify(formData));
        window.location.href = res.data.bkash_url;
        return;
      }

      if (res.data?.temp_password || res.data?.password || res.data?.guest_password) {
        setTempPassword(res.data.temp_password || res.data.password || res.data.guest_password);
      }

      // Google Tag Manager dataLayer Purchase Event
      if ((window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'purchase',
          customer_name: res.data?.customer_name || formData.name,
          customer_phone: res.data?.phone_number || formData.phone,
          customer_address: res.data?.address || (formData.district ? `${formData.address}, ${formData.upazila}, ${formData.district}` : formData.address),
          total_amount: parseFloat(res.data?.total_amount) || (cartTotal + shippingCost),
          order_id: res.data?.id || `checkout_${Date.now()}`,
          quantity: cart.reduce((total, item) => total + item.quantity, 0),
          ip_address: res.data?.ip_address || ipAddress,
          ecommerce: {
            transaction_id: res.data?.id || `checkout_${Date.now()}`,
            value: parseFloat(res.data?.total_amount) || (cartTotal + shippingCost),
            currency: 'BDT',
            items: cart.map(item => {
              const itemData: any = {
                item_name: item.name,
                item_id: item.id,
                price: parseFloat(item.price.toString().replace(/[^0-9.]/g, '')) || 0,
                quantity: item.quantity,
                color: item.color?.name || '',
                size: item.size?.name || ''
              };
              if (item.color) {
                itemData.item_variant = item.color.name;
              }
              if (item.size) {
                if (itemData.item_variant) {
                  itemData.item_variant += ` / ${item.size.name}`;
                } else {
                  itemData.item_variant = item.size.name;
                }
              }
              return itemData;
            })
          }
        });
      }

      setIsSuccess(true);
      clearCart();
    } catch (err: any) {
      console.error('Checkout failed:', err);
      alert(err.response?.data?.message || 'Failed to complete checkout. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-neutral-50 px-4">
        <SEO title="Order Confirmed!" />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl w-full bg-white rounded-[2.5rem] p-12 text-center shadow-xl space-y-8 border border-neutral-100"
        >
          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-12 h-12" />
          </div>
          <div className="space-y-4">
             <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Order Placed!</h2>
             <p className="text-neutral-500 text-lg">
               Thank you, <span className="font-bold text-neutral-900">{formData.name}</span>. 
               We've sent a confirmation to <span className="text-brand font-medium">{formData.phone}</span>.
             </p>
          </div>

          {/* Guest Account Panel */}
          {!isAuthenticated && (
            <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100 text-left space-y-4 shadow-sm max-w-md mx-auto">
              <div className="flex items-center gap-3 border-b border-neutral-200/60 pb-3">
                <span className="p-2.5 bg-brand/10 text-brand rounded-xl"><User className="w-5 h-5" /></span>
                <div>
                  <h3 className="font-extrabold text-neutral-800 text-sm">Account Created Successfully!</h3>
                  <p className="text-[11px] text-neutral-400 font-medium">An account has been created for your phone number.</p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <p className="text-xs text-neutral-600 leading-relaxed font-semibold">
                  আপনার মোবাইল নম্বর দিয়ে লগইন করে পাসওয়ার্ড সেট করুন এবং আপনার অর্ডার ট্র্যাক করুন।
                </p>
                <div className="h-[1px] bg-neutral-200/60" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500 font-bold">Username (Phone):</span>
                  <span className="font-bold text-neutral-800 bg-white px-3 py-1 rounded-lg border border-neutral-200">{formData.phone}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col space-y-3 pt-4">
            <Link 
              to="/" 
              className="bg-neutral-900 text-white font-black py-5 px-10 rounded-2xl hover:bg-neutral-800 transition-all shadow-lg active:scale-95"
            >
              Back to Shopping
            </Link>
            <Link 
                to="/account/orders" 
                className="text-neutral-500 font-bold hover:text-neutral-900 transition-colors py-2 flex items-center justify-center space-x-2"
            >
                <span>Track your order</span>
                <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-40 text-center space-y-8">
        <SEO title="Checkout - Empty Cart" />
        <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-300">
            <CreditCard className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-neutral-900 uppercase">Your cart is empty</h2>
        <Link 
            to="/products" 
            className="inline-block bg-brand text-white font-black py-4 px-10 rounded-xl shadow-lg shadow-brand/20 active:scale-95 transition-all"
        >
            Explore our Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#fafafa] min-h-screen">
      <SEO title="Checkout" description={`Complete your order at ${siteTitle}. Secure checkout with multiple payment options.`} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div className="space-y-1">
                <div className="flex items-center space-x-2 text-neutral-400 text-[11px] font-bold uppercase tracking-wider">
                    <Link to="/cart" className="hover:text-neutral-900 transition-colors">Cart</Link>
                    <ChevronRight className="w-3 h-3 opacity-50" />
                    <span className="text-neutral-900">Checkout</span>
                </div>
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Checkout</h1>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Main Form */}
          <div className="lg:col-span-7 space-y-8">
            <form id="checkout-form" noValidate onSubmit={handleSubmit} className="space-y-8">
              
              {paymentError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm font-semibold flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Delivery Section */}
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm space-y-8"
              >
                <div className="flex items-center justify-between border-b border-neutral-50 pb-4">
                    <h3 className="text-lg font-bold text-neutral-900 tracking-tight">ডেলিভারি তথ্য</h3>
                    <div className="w-8 h-8 bg-neutral-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">১</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 ml-1">আপনার নাম</label>
                    <input 
                      required
                      type="text" 
                      placeholder="আপনার নাম" 
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm transition-all focus:bg-white focus:border-brand focus:ring-2 focus:ring-red-100/50 outline-none placeholder:text-neutral-400"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 ml-1">মোবাইল নম্বর</label>
                    <input 
                      required
                      type="tel" 
                      placeholder="আপনার মোবাইল নাম্বার" 
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm transition-all focus:bg-white focus:border-brand focus:ring-2 focus:ring-red-100/50 outline-none placeholder:text-neutral-400"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 11)})}
                    />
                  </div>

                  {settings?.enable_district_upazila !== false ? (
                    <>
                      {/* District & Upazila Combined Row */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 ml-1">জেলা</label>
                        <div className="relative">
                            <select 
                                required
                                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm transition-all focus:bg-white focus:border-brand outline-none appearance-none cursor-pointer"
                                value={formData.district}
                                onChange={e => setFormData({...formData, district: e.target.value, upazila: ''})}
                            >
                                <option value="">জেলা সিলেক্ট করুন</option>
                                {districts.map(d => (
                                    <option key={d.id} value={d.name}>{d.name}</option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none rotate-90" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 ml-1">থানা / উপজেলা</label>
                        <div className="relative">
                            <select 
                                required
                                disabled={!formData.district || isLoadingLocations}
                                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm transition-all focus:bg-white focus:border-brand outline-none appearance-none cursor-pointer disabled:opacity-50"
                                value={formData.upazila}
                                onChange={e => setFormData({...formData, upazila: e.target.value})}
                            >
                                <option value="">{isLoadingLocations ? 'লোড হচ্ছে...' : 'থানা / উপজেলা সিলেক্ট করুন'}</option>
                                {upazilas.map(u => (
                                    <option key={u.id} value={u.name}>{u.name}</option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none rotate-90" />
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Manual Shipping Zone Selection */
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 ml-1">শিপিং এলাকা</label>
                      <div className="relative">
                        <select 
                            required
                            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm transition-all focus:bg-white focus:border-brand outline-none appearance-none cursor-pointer"
                            value={shippingZoneId || ''}
                            onChange={e => {
                                const zoneId = parseInt(e.target.value);
                                setShippingZoneId(zoneId);
                                const zone = shippingZones.find(z => z.id === zoneId);
                                if (zone) {
                                    setShippingCost(parseFloat(zone.shipping_cost));
                                }
                            }}
                        >
                            <option value="">শিপিং এলাকা সিলেক্ট করুন</option>
                            {shippingZones.map(z => {
                                const displayName = z.name.toLowerCase().includes('inside dhaka city')
                                    ? 'ঢাকা সিটির ভেতরে'
                                    : z.name.toLowerCase().includes('outside dhaka city')
                                        ? 'ঢাকা সিটির বাইরে'
                                        : z.name;
                                return (
                                    <option key={z.id} value={z.id}>{displayName} - ৳{parseFloat(z.shipping_cost).toLocaleString()}</option>
                                );
                            })}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none rotate-90" />
                      </div>
                    </div>
                  )}

                  {/* Full Address */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 ml-1">বিস্তারিত ঠিকানা</label>
                    <textarea 
                      required
                      rows={2}
                      placeholder="আপনার ঠিকানা, জেলা এবং থানাসহ বিস্তারিত লিখুন" 
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm transition-all focus:bg-white focus:border-brand outline-none resize-none placeholder:text-neutral-400"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                  </div>

                </div>
              </motion.section>

              {/* Payment Section */}
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm space-y-8"
              >
                 <div className="flex items-center justify-between border-b border-neutral-50 pb-4">
                    <h3 className="text-lg font-bold text-neutral-900 tracking-tight">পেমেন্ট পদ্ধতি</h3>
                    <div className="w-8 h-8 bg-neutral-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">২</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <div 
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`relative border-2 p-5 rounded-xl flex items-center justify-between cursor-pointer group transition-all ${
                        selectedPaymentMethod === method.id 
                        ? 'border-brand bg-brand/5/20' 
                        : 'border-neutral-100 bg-neutral-50/50 hover:border-neutral-200'
                      }`}
                    >
                        <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm transition-colors ${
                                selectedPaymentMethod === method.id ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-400'
                            }`}>
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                                <span className={`block font-bold text-base transition-colors ${
                                    selectedPaymentMethod === method.id ? 'text-neutral-900' : 'text-neutral-500'
                                }`}>{method.name.toLowerCase().includes('cash') ? 'ক্যাশ অন ডেলিভারি' : method.name}</span>
                                <span className="text-[10px] font-bold text-brand uppercase tracking-wider">
                                    {method.name.toLowerCase().includes('cash') ? 'পণ্য হাতে পেয়ে পেমেন্ট' : 'অগ্রিম পেমেন্ট'}
                                </span>
                            </div>
                        </div>
                        {selectedPaymentMethod === method.id && (
                          <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center border-2 border-white shadow-sm">
                             <CheckCircle className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                    </div>
                  ))}

                  {paymentMethods.length === 0 && !isSubmitting && (
                    <p className="text-xs text-neutral-400 italic">পেমেন্ট পদ্ধতি লোড হচ্ছে...</p>
                  )}
                </div>
              </motion.section>
            </form>
          </div>

          {/* Right Column: Order Receipt */}
          <div className="lg:col-span-5 sticky top-10">
            <div className="bg-white rounded-2xl p-8 border border-neutral-100 shadow-sm space-y-8">
              <div className="border-b border-neutral-50 pb-4">
                <h3 className="text-lg font-bold text-neutral-900">অর্ডার সামারি</h3>
                <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">অর্ডার কনফার্ম করার পূর্বে শেষ রিভিউ</p>
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.cartKey} className="flex space-x-4 items-center group/item">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-50 border border-neutral-100 flex-shrink-0 p-1">
                      <img src={item.image} className="w-full h-full object-cover rounded-lg" alt={item.name} />
                    </div>
                    <div className="flex-grow min-w-0 space-y-1">
                      <h4 className="text-[13px] font-bold text-neutral-900 leading-tight line-clamp-1">{item.name}</h4>
                      
                      {/* Color & Size Info */}
                      {(item.color || item.size) && (
                        <div className="flex flex-wrap gap-2 py-0.5">
                          {item.color && (
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tight">কালার: {item.color.name}</span>
                          )}
                          {item.size && (
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tight">সাইজ: {item.size.code}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-neutral-400 font-bold">পরিমাণ: {item.quantity}</span>
                        <span className="text-xs font-bold text-neutral-700">৳{(parseFloat(item.price.toString().replace(/[^0-9.]/g, '')) * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-neutral-50">
                <div className="flex justify-between items-center text-xs font-medium text-neutral-500">
                  <span>সাবটোটাল</span>
                  <span className="text-neutral-900 font-bold">৳{cartTotal.toLocaleString()}</span>
                </div>
                  <div className="flex justify-between items-center text-xs font-medium text-neutral-500">
                  <span>ডেলিভারি চার্জ ({
                      shippingZones.find(z => z.id === shippingZoneId)?.name
                  })</span>
                  <span className="text-brand font-bold">৳{shippingCost}</span>
                </div>
                
                <div className="pt-4 flex items-center justify-between">
                  <h4 className="text-lg font-bold text-neutral-900">সর্বমোট পরিশোধযোগ্য</h4>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-brand">৳{(cartTotal + shippingCost).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {cart.some(item => item.stock !== undefined && item.stock <= 0) && (
                <div className="bg-red-50 text-red-700 text-xs font-bold p-3 rounded-xl border border-red-100 leading-relaxed">
                  আপনার কার্টে কিছু আউট অফ স্টক প্রোডাক্ট রয়েছে। দয়া করে অর্ডার সম্পন্ন করার আগে কার্ট থেকে সেগুলো বাদ দিন।
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit" 
                  form="checkout-form"
                  disabled={isSubmitting || cart.some(item => item.stock !== undefined && item.stock <= 0)}
                  className="w-full bg-brand hover:bg-[#3a5bd9] disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-bold py-3.5 rounded-xl shadow-md transition-all text-base flex items-center justify-center space-x-2 active:scale-[0.98] disabled:cursor-not-allowed group"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>অর্ডার সম্পন্ন করুন</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Trust Footer */}
            <p className="mt-6 text-[10px] text-neutral-400 text-center font-medium leading-relaxed px-8 opacity-70">
                আপনার পেমেন্ট ও পার্সোনাল ডাটা সম্পূর্ণ নিরাপদ। স্পেসঘর সিকিউরিটি লেয়ার দ্বারা সুরক্ষিত।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
