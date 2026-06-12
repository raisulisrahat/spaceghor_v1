import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Bell, Zap, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import { BASE_URL } from '../services/api';

interface Notice {
    id: number;
    text: string;
    title: string | null;
    description: string | null;
    image: string | null;
    button_text: string | null;
    button_link: string | null;
    display_type: 'ticker' | 'popup' | 'both';
    is_active: boolean;
}

const NoticeDisplay = () => {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [activePopup, setActivePopup] = useState<Notice | null>(null);
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        const fetchNotices = async () => {
            try {
                const response = await api.get('notice/');
                const data = response.data.results || response.data;
                const activeNotices = Array.isArray(data) ? data.filter((n: Notice) => n.is_active) : [];
                setNotices(activeNotices);

                // Handle Popup logic
                const popupNotices = activeNotices.filter((n: Notice) => n.display_type === 'popup' || n.display_type === 'both');
                if (popupNotices.length > 0) {
                    const latestPopup = popupNotices[0]; // Get the most recent
                    const closedPopupId = localStorage.getItem(`closed_notice_${latestPopup.id}`);
                    
                    if (closedPopupId !== latestPopup.id.toString()) {
                        setActivePopup(latestPopup);
                        // Delay popup for better UX
                        setTimeout(() => setShowPopup(true), 2000);
                    }
                }
            } catch (error) {
                console.error("Error fetching notices:", error);
            }
        };

        fetchNotices();
    }, []);

    const closePopup = () => {
        setShowPopup(false);
        if (activePopup) {
            localStorage.setItem(`closed_notice_${activePopup.id}`, activePopup.id.toString());
        }
    };

    const tickerNotices = notices.filter(n => n.display_type === 'ticker' || n.display_type === 'both');

    return (
        <>
            {/* Ticker Section */}
            {tickerNotices.length > 0 && (
                <div className="bg-brand text-white py-2 overflow-hidden relative z-50">
                    <div className="flex whitespace-nowrap animate-marquee">
                        <div className="flex items-center gap-10 px-4">
                            {tickerNotices.map((notice, idx) => (
                                <div key={`notice-1-${idx}`} className="flex items-center gap-2">
                                    <Bell size={14} className="fill-white/20" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{notice.text}</span>
                                </div>
                            ))}
                        </div>
                        {/* Repeat for seamless loop */}
                        <div className="flex items-center gap-10 px-4">
                            {tickerNotices.map((notice, idx) => (
                                <div key={`notice-2-${idx}`} className="flex items-center gap-2">
                                    <Bell size={14} className="fill-white/20" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{notice.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Popup Modal */}
            <AnimatePresence>
                {showPopup && activePopup && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closePopup}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col sm:flex-row"
                        >
                            {/* Close Button */}
                            <button 
                                onClick={closePopup}
                                className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full text-zinc-500 hover:text-black transition-all shadow-lg active:scale-95"
                            >
                                <X size={20} />
                            </button>

                            {/* Image Section */}
                            {activePopup.image && (
                                <div className="w-full sm:w-1/2 aspect-square sm:aspect-auto sm:h-full bg-zinc-100 relative">
                                    <img 
                                        src={activePopup.image.startsWith('http') ? activePopup.image : `${BASE_URL}${activePopup.image}`} 
                                        alt={activePopup.title || "Offer"} 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                </div>
                            )}

                            {/* Content Section */}
                            <div className={`flex-1 p-8 flex flex-col justify-center ${!activePopup.image ? 'items-center text-center' : ''}`}>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 text-[#5173FB] rounded-full mb-4">
                                    <Zap size={14} className="fill-[#5173FB]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Special Announcement</span>
                                </div>
                                
                                {activePopup.title && (
                                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight leading-tight mb-3">
                                        {activePopup.title}
                                    </h2>
                                )}
                                
                                {activePopup.description && (
                                    <p className="text-sm text-zinc-500 font-medium leading-relaxed mb-8">
                                        {activePopup.description}
                                    </p>
                                )}

                                {activePopup.button_link && (
                                    <a 
                                        href={activePopup.button_link}
                                        onClick={closePopup}
                                        className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand hover:shadow-xl hover:shadow-[#5173FB]/20 transition-all active:scale-95 group"
                                    >
                                        {activePopup.button_text || "View Offer"}
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </a>
                                )}

                                <button 
                                    onClick={closePopup}
                                    className="mt-6 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-900 transition-colors"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}} />
        </>
    );
};

export default NoticeDisplay;
