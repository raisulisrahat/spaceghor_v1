import { useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Assuming you use react-router
import { useSettings } from '../context/SettingsContext';

interface PixelProps {
    pixelId?: string;
}

const FacebookPixel = ({ pixelId: customPixelId }: PixelProps) => {
    const { settings } = useSettings();
    const pixelId = customPixelId || settings?.facebook_pixel_id;
    const location = useLocation(); // Hook into route changes

    // 1. Reset blocking flags on route change
    useEffect(() => {
        (window as any).__blocked_duplicate_fb_initiate_checkout = false;
        (window as any).__blocked_duplicate_fb_purchase = false;
        
        // Optional: Fire PageView on every route change, since SPAs don't hard reload
        if (typeof (window as any).fbq === 'function') {
             (window as any).fbq('track', 'PageView');
        }
    }, [location.pathname]); 

    // 2. Initialize and Patch Pixel
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

        // MONKEY PATCH fbq to enforce strict single-fire per page view
        let currentFbq = (window as any).fbq;
        
        const createPatchedFbq = (original: any) => {
            const patched = function(...args: any[]) {
                const command = args[0];
                const eventName = args[0] === 'trackSingle' ? args[2] : args[1];
                
                if ((command === 'track' || command === 'trackSingle') && eventName === 'InitiateCheckout') {
                    if ((window as any).__blocked_duplicate_fb_initiate_checkout) {
                        console.log('Blocked duplicate InitiateCheckout');
                        return;
                    }
                    (window as any).__blocked_duplicate_fb_initiate_checkout = true;
                }
                
                if ((command === 'track' || command === 'trackSingle') && eventName === 'Purchase') {
                    if ((window as any).__blocked_duplicate_fb_purchase) {
                        console.log('Blocked duplicate Purchase');
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
            
            Object.assign(patched, original);
            return patched;
        };

        let activeFbq = createPatchedFbq(currentFbq);

        Object.defineProperty(window, 'fbq', {
            get: () => activeFbq,
            set: (newVal) => {
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