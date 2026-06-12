import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Globe, 
  Key, 
  Truck, 
  Shield, 
  Save, 
  Loader2,
  CheckCircle2,
  Settings,
  Mail,
  Facebook,
  Instagram,
  Target,
  Twitter,
  Youtube,
  Phone,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { getSiteSettings, updateSiteSettings } from '../../services/api';
import { motion } from 'framer-motion';

const SiteSettingsAdmin = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => getSiteSettings().then(res => Array.isArray(res.data) ? res.data[0] : res.data)
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateSiteSettings(config.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      setSuccessMsg('Settings updated successfully!');
      setErrorMsg(null);
      setTimeout(() => setSuccessMsg(null), 3500);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Failed to update settings. Please try again.');
      setSuccessMsg(null);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSave = () => {
    if (!config?.id) return;
    updateMutation.mutate(formData);
  };

  const Section = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden mb-8">
      <div className="px-8 py-6 border-b border-neutral-50 flex items-center bg-neutral-50/30">
        <Icon className="w-5 h-5 text-[#5173FB] mr-3" />
        <h3 className="font-bold text-neutral-900 uppercase tracking-widest text-xs">{title}</h3>
      </div>
      <div className="p-8">
        {children}
      </div>
    </div>
  );

  const InputField = ({ label, name, type = 'text', placeholder, value, icon: Icon }: any) => (
    <div className="space-y-2">
      <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
           <Icon className="w-4 h-4" />
        </div>
        <input 
          type={type}
          name={name}
          value={formData[name] ?? ''}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5173FB]/20 focus:border-[#5173FB] transition-all text-neutral-800 font-medium"
        />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#5173FB] animate-spin" />
        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">System Configuration</h1>
          <p className="text-neutral-500 mt-2 font-medium">Manage store identity and courier integrations</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center justify-center space-x-2 px-8 py-4 bg-brand text-white rounded-2xl font-bold shadow-xl shadow-[#5173FB]/20 hover:bg-[#3a5bd9] transition-all disabled:opacity-70 min-w-[200px]"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Configuration</span>
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-6 py-4 rounded-2xl text-sm font-semibold flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 px-6 py-4 rounded-2xl text-sm font-semibold flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        <Section title="Store Identity" icon={Globe}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Store Name" name="site_title" icon={Globe} />
            <InputField label="SEO Description" name="meta_description" icon={Target} />
            <InputField label="SEO Keywords" name="meta_keywords" icon={Target} />
            <InputField label="Support Phone" name="support_phone" icon={Phone} />
          </div>
        </Section>

        <Section title="Social & Communication" icon={MessageCircle}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Facebook Page URL" name="facebook_url" icon={Facebook} />
            <InputField label="Instagram Profile URL" name="instagram_url" icon={Instagram} />
            <InputField label="Twitter Profile URL" name="twitter_url" icon={Twitter} />
            <InputField label="YouTube Channel URL" name="youtube_url" icon={Youtube} />
            <InputField label="WhatsApp Number" name="whatsapp_number" icon={Phone} />
            <InputField label="Messenger URL" name="messenger_url" icon={Mail} />
          </div>
        </Section>

        <Section title="Courier Integration (Steadfast)" icon={Truck}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="API Key" name="steadfast_api_key" icon={Key} type="password" />
            <InputField label="Secret Key" name="steadfast_secret_key" icon={Shield} type="password" />
          </div>
          <p className="mt-4 text-xs text-neutral-400 italic">Required for automated shipment creation in Steadfast portal.</p>
        </Section>

        <Section title="Courier Integration (Carrybee)" icon={Truck}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField label="Client ID" name="carrybee_client_id" icon={Key} type="password" />
            <InputField label="Client Secret" name="carrybee_client_secret" icon={Shield} type="password" />
            <InputField label="Client Context" name="carrybee_client_context" icon={Globe} />
          </div>
          <p className="mt-4 text-xs text-neutral-400 italic">Required for automated shipment creation in Carrybee portal.</p>
        </Section>

        <Section title="Marketing Pixels & Tracking" icon={Target}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <InputField label="Facebook Pixel ID" name="facebook_pixel_id" icon={Target} />
             <InputField label="Google Tag ID (gtag.js)" name="google_tag_id" icon={Target} placeholder="e.g. G-X06QEH8RN6" />
          </div>
        </Section>
      </div>
    </div>
  );
};

export default SiteSettingsAdmin;
