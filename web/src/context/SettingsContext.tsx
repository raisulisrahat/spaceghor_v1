import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSiteSettings, BASE_URL } from '../services/api';
import defaultLogo from '../assets/logo.svg';

interface SiteSettings {
  id: number;
  site_title: string;
  site_logo: string | null;
  footer_logo: string | null;
  site_favicon: string | null;
  meta_description: string;
  meta_keywords: string;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  discord_url?: string;
  linkedin_url?: string;
  messenger_url?: string;
  messenger_image?: string;
  whatsapp_number?: string;
  support_phone?: string;
  whatsapp_message?: string;
  show_chat_bubble?: boolean;
  facebook_pixel_id?: string;
  google_tag_id?: string;
  enable_district_upazila?: boolean;
}

interface SettingsContextType {
  settings: SiteSettings | null;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => getSiteSettings().then(res => {
      // Handle array or single object response
      const settingsArray = res.data;
      return Array.isArray(settingsArray) ? settingsArray[0] : settingsArray;
    }),
  });

  useEffect(() => {
    if (data) {
      // Update Favicon
      if (data.site_favicon) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        const faviconUrl = data.site_favicon.startsWith('http') 
          ? data.site_favicon 
          : `${BASE_URL}${data.site_favicon}`;
        link.href = faviconUrl;
      }
    }
  }, [data]);

  return (
    <SettingsContext.Provider value={{ settings: data || null, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  
  const settings = context.settings;
  
  return {
    ...context,
    siteTitle: settings?.site_title || 'QBAMART',
    siteLogo: settings?.site_logo || defaultLogo,
    footerLogo: settings?.footer_logo || settings?.site_logo || defaultLogo,
    favicon: settings?.site_favicon || '/favicon.ico',
  };
};
