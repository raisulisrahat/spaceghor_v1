import { useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

interface PixelProps {
    pixelId?: string;
}

const FacebookPixel = ({ pixelId: customPixelId }: PixelProps) => {
    const { settings } = useSettings();
    const pixelId = customPixelId || settings?.facebook_pixel_id;

    useEffect(() => {
        if (!pixelId) return;

        // Initialize Facebook Pixel
        const fbScript = () => {
            const f = window as any;
            const b = document;
            const e = 'script';
            const v = 'https://connect.facebook.net/en_US/fbevents.js';
            let n: any, t: any, s: any;

            if (f.fbq) return;
            n = f.fbq = function() {
                n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
            };
            if (!f._fbq) f._fbq = n;
            n.push = n;
            n.loaded = !0;
            n.version = '2.0';
            n.queue = [];
            t = b.createElement(e);
            t.async = !0;
            t.src = v;
            s = b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t, s);
        };

        fbScript();
        (window as any).fbq('set', 'autoConfig', false, pixelId);
        (window as any).fbq('init', pixelId);
        (window as any).fbq('track', 'PageView');

        // MONKEY PATCH fbq to enforce strict single-fire for e-commerce events
        // Use Object.defineProperty to prevent fbevents.js from completely overwriting our patch
        let currentFbq = (window as any).fbq;
        
        const createPatchedFbq = (original: any) => {
            const patched = function(...args: any[]) {
                const command = args[0];
                const eventName = args[0] === 'trackSingle' ? args[2] : args[1];
                
                if ((command === 'track' || command === 'trackSingle') && eventName === 'InitiateCheckout') {
                    if ((window as any).__blocked_duplicate_fb_initiate_checkout) {
                        console.log('Blocked duplicate InitiateCheckout from external source');
                        return;
                    }
                    (window as any).__blocked_duplicate_fb_initiate_checkout = true;
                }
                
                if ((command === 'track' || command === 'trackSingle') && eventName === 'Purchase') {
                    if ((window as any).__blocked_duplicate_fb_purchase) {
                        console.log('Blocked duplicate Purchase from external source');
                        return;
                    }
                    (window as any).__blocked_duplicate_fb_purchase = true;
                }
                
                if (original.callMethod) {
                    original.callMethod.apply(original, args);
                } else if (original.queue) {
                    original.queue.push(args);
                } else {
                    original.apply(null, args);
                }
            };
            
            // Preserve properties
            Object.assign(patched, original);
            return patched;
        };

        let activeFbq = createPatchedFbq(currentFbq);

        Object.defineProperty(window, 'fbq', {
            get: () => activeFbq,
            set: (newVal) => {
                // When fbevents.js loads, it sets window.fbq to a new function.
                // We wrap the new function to keep our patch intact!
                activeFbq = createPatchedFbq(newVal);
            },
            configurable: true
        });

    }, [pixelId]);

    return (
        <noscript>
            <img 
                height="1" 
                width="1" 
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                alt=""
            />
        </noscript>
    );
};

export default FacebookPixel;
