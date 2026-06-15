import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

interface GTMProps {
    gtmId?: string;
}

const GoogleTagManager = ({ gtmId: customGtmId }: GTMProps) => {
    const { settings } = useSettings();
    const gtmId = customGtmId || settings?.google_tag_manager_id;
    const location = useLocation();

    useEffect(() => {
        if (!gtmId) return;

        const scriptId = 'gtm-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.innerHTML = `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
            `;
            document.head.appendChild(script);
        }
    }, [gtmId]);

    useEffect(() => {
        if (!gtmId) return;

        // Small delay to ensure document.title is updated by react-helmet / SEO components
        const timer = setTimeout(() => {
            const dataLayer = (window as any).dataLayer = (window as any).dataLayer || [];
            dataLayer.push({
                event: 'page_view',
                page_path: location.pathname + location.search,
                page_title: document.title,
                page_location: window.location.href
            });
        }, 100);

        return () => clearTimeout(timer);
    }, [location, gtmId]);

    if (!gtmId) return null;

    return (
        <noscript>
            <iframe 
                src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                height="0" 
                width="0" 
                style={{ display: 'none', visibility: 'hidden' }}
            />
        </noscript>
    );
};

export default GoogleTagManager;
