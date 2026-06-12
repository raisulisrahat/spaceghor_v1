import { useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

interface GoogleTagProps {
    tagId?: string;
}

const GoogleTag = ({ tagId: customTagId }: GoogleTagProps) => {
    const { settings } = useSettings();
    const tagId = customTagId || settings?.google_tag_id;

    useEffect(() => {
        if (!tagId) return;

        // Load gtag.js script
        const scriptId = 'google-tag-manager';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
            document.head.appendChild(script);

            const inlineScript = document.createElement('script');
            inlineScript.id = 'google-tag-inline';
            inlineScript.innerHTML = `
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${tagId}');
            `;
            document.head.appendChild(inlineScript);
        }
    }, [tagId]);

    return null;
};

export default GoogleTag;
