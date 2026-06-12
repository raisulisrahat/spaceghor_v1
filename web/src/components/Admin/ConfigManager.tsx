import React, { useState, useEffect } from 'react';
import api, { BASE_URL } from '../../services/api';
import { Settings, Save, AlertCircle, CheckCircle, Upload, Globe, Facebook, Twitter, Instagram, Youtube, MessageSquare, Shield, Link as LinkIcon, Copy, Zap, RefreshCw, PenTool, MessageCircle, CreditCard } from 'lucide-react';

const ConfigManager = () => {
    const [config, setConfig] = useState(null);
    const [originalConfig, setOriginalConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [footerLogoPreview, setFooterLogoPreview] = useState(null);
    const [faviconPreview, setFaviconPreview] = useState(null);
    const [messengerImagePreview, setMessengerImagePreview] = useState(null);
    const [smsBalance, setSmsBalance] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);

    useEffect(() => {
        fetchConfig();
        fetchSmsBalance();
        fetchPaymentMethods();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await api.get('site-settings/');
            const data = Array.isArray(response.data) ? response.data[0] : response.data;
            if (data) {
                setConfig(data);
                setOriginalConfig(data);
                setLogoPreview(data.site_logo);
                setFooterLogoPreview(data.footer_logo);
                setFaviconPreview(data.site_favicon);
                setMessengerImagePreview(data.messenger_image);
            }
            setLoading(false);
        } catch (error: any) {
            console.error('Error fetching config:', error.response?.data || error);
            alert('Failed to fetch configuration.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSmsBalance = async () => {
        try {
            const response = await api.get('site-settings/sms_balance/');
            setSmsBalance(response.data.balance);
        } catch (error) {
            console.error('Error fetching SMS balance:', error);
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            const response = await api.get('payment-methods/', { params: { manage: true } });
            setPaymentMethods(response.data);
        } catch (error) {
            console.error('Error fetching payment methods:', error);
        }
    };

    const handlePaymentMethodToggle = async (methodId, checked) => {
        try {
            await api.patch(`payment-methods/${methodId}/`, { is_active: checked });
            setPaymentMethods(prev => prev.map(m => m.id === methodId ? { ...m, is_active: checked } : m));
        } catch (error) {
            console.error('Failed to update payment method:', error);
            alert('Failed to update payment method status.');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        
        if (type === 'checkbox') {
            setConfig(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'file') {
            if (files && files[0]) {
                setConfig(prev => ({ ...prev, [name]: files[0] }));
                if (name === 'site_logo') {
                    setLogoPreview(URL.createObjectURL(files[0]));
                } else if (name === 'footer_logo') {
                    setFooterLogoPreview(URL.createObjectURL(files[0]));
                } else if (name === 'site_favicon') {
                    setFaviconPreview(URL.createObjectURL(files[0]));
                } else if (name === 'messenger_image') {
                    setMessengerImagePreview(URL.createObjectURL(files[0]));
                }
            }
        } else {
            setConfig(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const formData = new FormData();
            for (const key in config) {
                if (['site_logo', 'footer_logo', 'site_favicon', 'messenger_image'].includes(key)) {
                    if (config[key] instanceof File) {
                        formData.append(key, config[key]);
                    }
                } else if (config[key] !== null && config[key] !== undefined) {
                    formData.append(key, config[key]);
                }
            }

            const response = await api.patch(`site-settings/${config.id || 1}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const data = Array.isArray(response.data) ? response.data[0] : response.data;
            setConfig(data);
            setOriginalConfig(data);
            setLogoPreview(data.site_logo);
            setFooterLogoPreview(data.footer_logo);
            setFaviconPreview(data.site_favicon);
            setMessengerImagePreview(data.messenger_image);
            setMessage({ type: 'success', text: 'Configuration saved successfully!' });
            fetchSmsBalance();
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            alert(`Failed to save configuration: ${err.response?.data?.detail || err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const isDirty = () => {
        if (!config || !originalConfig) return false;
        return JSON.stringify(config) !== JSON.stringify(originalConfig) || 
               config.site_logo instanceof File || 
               config.footer_logo instanceof File || 
               config.site_favicon instanceof File ||
               config.messenger_image instanceof File;
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!config) {
        return (
            <div className="flex flex-col h-64 items-center justify-center gap-4 text-center max-w-md mx-auto">
                <AlertCircle className="w-8 h-8 text-rose-500 animate-bounce" />
                <div>
                    <h3 className="text-lg font-semibold text-zinc-900">Failed to Load Settings</h3>
                    <p className="text-sm text-zinc-500 mt-1">Please ensure the backend API server is running and try again.</p>
                </div>
                <button 
                    type="button"
                    onClick={() => { setLoading(true); fetchConfig(); fetchSmsBalance(); }} 
                    className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-[#3a5bd9] transition-all"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Settings</h2>
                    <p className="text-sm text-zinc-500 mt-1 font-medium">Configure global platform behavior, SEO, and integrations.</p>
                </div>
                
                {message && (
                    <div className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider animate-in slide-in-from-right-4 duration-300 ${message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                        {message.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                        {message.text}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 pb-24">
                {/* Brand Identity */}
                <div className="next-panel p-8">
                    <div className="flex items-center gap-3 mb-8 border-b border-zinc-100 pb-4">
                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900"><Zap size={18} /></div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900">Site Settings</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Site Title</label>
                                <input
                                    type="text"
                                    name="site_title"
                                    value={config.site_title || ''}
                                    onChange={handleChange}
                                    className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm"
                                    placeholder="Your Company Name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <AssetUpload 
                                    label="Site Logo" 
                                    preview={logoPreview} 
                                    name="site_logo" 
                                    onChange={handleChange} 
                                    hint="200x50px recommended" 
                                    isFavicon={false}
                                />
                                <AssetUpload 
                                    label="Favicon" 
                                    preview={faviconPreview} 
                                    name="site_favicon" 
                                    onChange={handleChange} 
                                    hint="32x32px .ico/.png" 
                                    isFavicon={true} 
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">SEO Meta Description</label>
                                <textarea
                                    name="meta_description"
                                    value={config.meta_description || ''}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm resize-none"
                                    placeholder="Brief description for search engines..."
                                />
                                <p className="text-[9px] text-zinc-400 font-bold uppercase text-right">{config.meta_description?.length || 0} / 160</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social & Connections */}
                <div className="next-panel p-8">
                    <div className="flex items-center gap-3 mb-8 border-b border-zinc-100 pb-4">
                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900"><Globe size={18} /></div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900">Social Media Integration</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SocialInput icon={<Facebook size={14} />} label="Facebook" name="facebook_url" value={config.facebook_url} onChange={handleChange} />
                        <SocialInput icon={<Twitter size={14} />} label="Twitter" name="twitter_url" value={config.twitter_url} onChange={handleChange} />
                        <SocialInput icon={<Instagram size={14} />} label="Instagram" name="instagram_url" value={config.instagram_url} onChange={handleChange} />
                        <SocialInput icon={<Youtube size={14} />} label="YouTube" name="youtube_url" value={config.youtube_url} onChange={handleChange} />
                        <SocialInput icon={<MessageSquare size={14} />} label="Discord" name="discord_url" value={config.discord_url} onChange={handleChange} />
                    </div>
                </div>

                {/* Chat Support */}
                <div className="next-panel p-8">
                    <div className="flex items-center gap-3 mb-8 border-b border-zinc-100 pb-4">
                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900"><MessageCircle size={18} /></div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900">Chat Support Bubble</h3>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                            <div>
                                <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest block">Show Chat Bubble</span>
                                <span className="text-[9px] font-medium text-emerald-600 block mt-0.5">Toggle floating support bubble site-wide</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="show_chat_bubble"
                                    checked={config.show_chat_bubble || false}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">WhatsApp Number</label>
                                    <input
                                        type="text"
                                        name="whatsapp_number"
                                        value={config.whatsapp_number || ''}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm"
                                        placeholder="+8801700000000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Support Phone (Quick Call)</label>
                                    <input
                                        type="text"
                                        name="support_phone"
                                        value={config.support_phone || ''}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm"
                                        placeholder="+8801516542909"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">WhatsApp Default Message</label>
                                    <textarea
                                        name="whatsapp_message"
                                        value={config.whatsapp_message || ''}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm resize-none"
                                        placeholder="Hello! I'm interested in your products."
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Messenger URL</label>
                                    <input
                                        type="url"
                                        name="messenger_url"
                                        value={config.messenger_url || ''}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm"
                                        placeholder="https://m.me/yourpage"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Messenger Bubble Image (Optional)</label>
                                    <AssetUpload 
                                        label="Messenger Avatar" 
                                        preview={messengerImagePreview} 
                                        name="messenger_image" 
                                        onChange={handleChange} 
                                        hint="Square image recommended" 
                                        isFavicon={true}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="next-panel p-8">
                    <div className="flex items-center gap-3 mb-8 border-b border-zinc-100 pb-4">
                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900"><PenTool size={18} /></div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900">Marketing & Tracking</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Facebook Pixel ID</label>
                            <input
                                type="text"
                                name="facebook_pixel_id"
                                value={config.facebook_pixel_id || ''}
                                onChange={handleChange}
                                className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm"
                                placeholder="2717976234992377"
                            />
                            <p className="text-[10px] text-zinc-400 font-medium mt-1">Site-wide Facebook Pixel ID. This will automatically enable PageView tracking.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Google Tag ID (gtag.js)</label>
                            <input
                                type="text"
                                name="google_tag_id"
                                value={config.google_tag_id || ''}
                                onChange={handleChange}
                                className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm"
                                placeholder="G-X06QEH8RN6"
                            />
                            <p className="text-[10px] text-zinc-400 font-medium mt-1">Google Tag ID for tracking and Google Analytics integration.</p>
                        </div>
                    </div>
                </div>
                
                {/* Checkout Configuration */}
                <div className="next-panel p-8">
                    <div className="flex items-center gap-3 mb-8 border-b border-zinc-100 pb-4">
                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900"><PenTool size={18} /></div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900">Checkout Configuration</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                            <div>
                                <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest block">Enable District & Upazila</span>
                                <span className="text-[9px] font-medium text-zinc-400 block mt-0.5">Toggle between District/Upazila selection and manual Shipping Zones</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="enable_district_upazila"
                                    checked={config.enable_district_upazila || false}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Integration Stack */}
                <div className="next-panel p-8">
                    <div className="flex items-center gap-3 mb-8 border-b border-zinc-100 pb-4">
                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900"><Shield size={18} /></div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900">Delivery API Integration</h3>
                    </div>

                    <div className="space-y-12">
                        {/* Courier: Steadfast */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Steadfast Courier
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">API Key</label>
                                    <input 
                                        type="text" 
                                        name="steadfast_api_key" 
                                        value={config.steadfast_api_key || ''} 
                                        onChange={handleChange} 
                                        placeholder="Enter Steadfast API Key" 
                                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Secret Key</label>
                                    <input 
                                        type="password" 
                                        name="steadfast_secret_key" 
                                        value={config.steadfast_secret_key || ''} 
                                        onChange={handleChange} 
                                        placeholder="Enter Steadfast Secret Key" 
                                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Courier: Carrybee */}
                        <div className="space-y-6 pt-6 border-t border-zinc-100">
                            <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Carrybee Courier
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Base URL</label>
                                    <input 
                                        type="text" 
                                        name="carrybee_base_url" 
                                        value={config.carrybee_base_url || ''} 
                                        onChange={handleChange} 
                                        placeholder="https://developers.carrybee.com" 
                                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Client ID</label>
                                    <input 
                                        type="text" 
                                        name="carrybee_client_id" 
                                        value={config.carrybee_client_id || ''} 
                                        onChange={handleChange} 
                                        placeholder="Enter Carrybee Client ID" 
                                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Client Secret</label>
                                    <input 
                                        type="password" 
                                        name="carrybee_client_secret" 
                                        value={config.carrybee_client_secret || ''} 
                                        onChange={handleChange} 
                                        placeholder="Enter Carrybee Client Secret" 
                                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Client Context</label>
                                    <input 
                                        type="text" 
                                        name="carrybee_client_context" 
                                        value={config.carrybee_client_context || ''} 
                                        onChange={handleChange} 
                                        placeholder="Enter Carrybee Client Context" 
                                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm" 
                                    />
                                </div>
                            </div>
                        </div>


                        {/* Webhooks */}
                        <div className="space-y-6 pt-6 border-t border-zinc-100">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em]">External Webhooks</h4>
                                <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-bold border border-emerald-100 uppercase">
                                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Listening
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Callback Endpoint</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={`${window.location.origin}/api/webhooks/courier/`}
                                            className="flex-1 bg-zinc-100 border border-zinc-200 p-3 rounded-xl font-mono text-[10px] text-zinc-500 outline-none"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/courier/`);
                                                alert('URL copied');
                                            }}
                                            className="p-3 bg-brand text-white rounded-xl hover:bg-black transition-all active:scale-95"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Secure Auth Token</label>
                                    <input
                                        type="text"
                                        name="webhook_auth_token"
                                        value={config.webhook_auth_token || ''}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-mono text-zinc-900 text-xs"
                                        placeholder="Secret bearer token..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SMS Gateway Integration */}
                <div className="next-panel p-8">
                    <div className="flex items-center gap-3 mb-8 border-b border-zinc-100 pb-4">
                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900"><MessageCircle size={18} /></div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900">SMS Gateway Integration</h3>
                        </div>
                        {smsBalance !== null && (
                            <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-2">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Balance:</span>
                                <span className="text-[10px] font-black text-emerald-700 font-mono">৳{smsBalance}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center justify-between p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                            <div>
                                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-widest block">Order Confirmation SMS</span>
                                <span className="text-[9px] font-medium text-amber-600 block mt-0.5">Send automated SMS to customers when they place an order</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="enable_order_confirmation_sms"
                                    checked={config.enable_order_confirmation_sms || false}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">BulkSMSBD API Key</label>
                                    <input
                                        type="text"
                                        name="sms_api_key"
                                        value={config.sms_api_key || ''}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm"
                                        placeholder="Enter your API Key"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Sender ID / Masking</label>
                                    <input
                                        type="text"
                                        name="sms_sender_id"
                                        value={config.sms_sender_id || ''}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm"
                                        placeholder="8809617626322"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">OTP Message Format</label>
                                    <textarea
                                        name="otp_format"
                                        value={config.otp_format || ''}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm resize-none"
                                        placeholder="Your {site_title} OTP is {otp}"
                                    />
                                    <p className="text-[10px] text-zinc-400 font-medium">Use {"{site_title}"} and {"{otp}"} as placeholders.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Methods Control */}
                <div className="next-panel p-8">
                    <div className="flex items-center gap-3 mb-8 border-b border-zinc-100 pb-4">
                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900"><CreditCard size={18} /></div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900">Payment Methods</h3>
                    </div>

                    <div className="space-y-4">
                        {paymentMethods.map((method: any) => (
                            <div key={method.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                                <div>
                                    <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest block">{method.name}</span>
                                    <span className="text-[9px] font-medium text-zinc-400 block mt-0.5">
                                        Provider: {method.provider} | {method.is_active ? 'Active on Checkout' : 'Disabled'}
                                    </span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={method.is_active || false}
                                        onChange={(e) => handlePaymentMethodToggle(method.id, e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                                </label>
                            </div>
                        ))}
                        {paymentMethods.length === 0 && (
                            <p className="text-xs text-zinc-400 italic">No payment methods found.</p>
                        )}
                    </div>
                </div>

                {/* bKash Payment Gateway Integration */}
                <div className="next-panel p-8">
                    <div className="flex items-center gap-3 mb-8 border-b border-zinc-100 pb-4">
                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900"><Shield size={18} /></div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900">bKash Payment Gateway</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">bKash API URL</label>
                                <input 
                                    type="text" 
                                    name="bkash_base_url" 
                                    value={config.bkash_base_url || ''} 
                                    onChange={handleChange} 
                                    placeholder="https://checkout.sandbox.bhash.com/v1.2.0-beta" 
                                    className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">bKash App Key</label>
                                <input 
                                    type="text" 
                                    name="bkash_app_key" 
                                    value={config.bkash_app_key || ''} 
                                    onChange={handleChange} 
                                    placeholder="Enter bKash App Key" 
                                    className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">bKash App Secret</label>
                                <input 
                                    type="password" 
                                    name="bkash_app_secret" 
                                    value={config.bkash_app_secret || ''} 
                                    onChange={handleChange} 
                                    placeholder="Enter bKash App Secret" 
                                    className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">bKash Username</label>
                                <input 
                                    type="text" 
                                    name="bkash_username" 
                                    value={config.bkash_username || ''} 
                                    onChange={handleChange} 
                                    placeholder="Enter bKash Username" 
                                    className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">bKash Password</label>
                                <input 
                                    type="password" 
                                    name="bkash_password" 
                                    value={config.bkash_password || ''} 
                                    onChange={handleChange} 
                                    placeholder="Enter bKash Password" 
                                    className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-sm" 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Action Bar */}
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[50] flex items-center justify-between bg-white/90 backdrop-blur-xl border border-zinc-200 p-4 rounded-2xl shadow-2xl transition-all duration-300 w-[90%] max-w-xl ${isDirty() ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
                    <div className="flex items-center gap-3 ml-2">
                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Configuration Modified</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setConfig({...originalConfig});
                                setLogoPreview(originalConfig.site_logo);
                                setFaviconPreview(originalConfig.site_favicon);
                                setMessengerImagePreview(originalConfig.messenger_image);
                            }}
                            className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                            disabled={saving}
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-brand text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-zinc-900/10 active:scale-95 transition-all flex items-center gap-2"
                        >
                            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            {saving ? 'Saving...' : 'Persist Changes'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

const AssetUpload = ({ label, preview, name, onChange, hint, isFavicon }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">{label}</label>
        <div className="flex items-center gap-4">
            <div className={`bg-white border border-zinc-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm ${isFavicon ? 'w-12 h-12' : 'w-20 h-12'}`}>
                {preview ? (
                    <img 
                        src={typeof preview === 'string' && (preview.startsWith('http') || preview.startsWith('blob')) ? preview : `${BASE_URL}${preview}`} 
                        alt={label} 
                        className="max-w-full max-h-full object-contain p-1" 
                    />
                ) : (
                    <div className="text-zinc-300"><Upload size={isFavicon ? 14 : 18} /></div>
                )}
            </div>
            <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center justify-center w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-all text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                    Change
                    <input type="file" name={name} accept="image/*" onChange={onChange} className="hidden" />
                </label>
            </div>
        </div>
        <p className="text-[8px] font-medium text-zinc-400 uppercase tracking-tight ml-1">{hint}</p>
    </div>
);

const SocialInput = ({ icon, label, name, value, onChange }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors">
                {icon}
            </div>
            <input
                type="url"
                name={name}
                value={value || ''}
                onChange={onChange}
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#5173FB]/5 outline-none transition-all font-semibold text-zinc-900 text-xs"
                placeholder={`https://${label.toLowerCase()}.com/...`}
            />
        </div>
    </div>
);

export default ConfigManager;
