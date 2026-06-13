import React, { useState } from 'react';
import { MessageCircle, X, MessageSquare, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import { BASE_URL } from '../services/api';

const ChatBubble: React.FC = () => {
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);

  if (!settings?.show_chat_bubble) return null;

  const whatsappUrl = settings.whatsapp_number 
    ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}${settings.whatsapp_message ? `?text=${encodeURIComponent(settings.whatsapp_message)}` : ''}`
    : null;
  
  const messengerUrl = settings.messenger_url || null;

  if (!whatsappUrl && !messengerUrl) return null;

  return (
    <div className="fixed bottom-[120px] right-6 md:bottom-6 md:right-6 z-[99] flex flex-col items-end gap-4 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col gap-3 mb-2 pointer-events-auto"
          >
            {settings?.support_phone && (
              <a
                href={`tel:${settings.support_phone}`}
                className="flex items-center gap-3 px-3 py-2 bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-full group hover:bg-brand transition-all duration-300 transform hover:-translate-x-1"
              >
                <div className="w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-brand transition-colors shadow-sm">
                  <Phone size={20} fill="currentColor" />
                </div>
                <div className="flex flex-col pr-2">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold group-hover:text-white/80 transition-colors">Quick Call</span>
                  <span className="text-sm font-bold text-neutral-800 group-hover:text-white transition-colors">{settings.support_phone}</span>
                </div>
              </a>
            )}

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-full group hover:bg-[#25D366] transition-all duration-300 transform hover:-translate-x-1"
              >
                <div className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-[#25D366] transition-colors shadow-sm">
                  <Phone size={20} fill="currentColor" />
                </div>
                <div className="flex flex-col pr-2">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold group-hover:text-white/80 transition-colors">Chat on</span>
                  <span className="text-sm font-bold text-neutral-800 group-hover:text-white transition-colors">WhatsApp</span>
                </div>
              </a>
            )}

            {messengerUrl && (
              <a
                href={messengerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-full group hover:bg-[#0084FF] transition-all duration-300 transform hover:-translate-x-1"
              >
                <div className="w-10 h-10 bg-[#0084FF] text-white rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-[#0084FF] transition-colors shadow-sm overflow-hidden">
                    <MessageSquare size={20} fill="currentColor" />
                </div>
                <div className="flex flex-col pr-2">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold group-hover:text-white/80 transition-colors">Chat on</span>
                  <span className="text-sm font-bold text-neutral-800 group-hover:text-white transition-colors">Messenger</span>
                </div>
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1, rotate: isOpen ? 0 : 10 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-15 h-15 rounded-full flex items-center justify-center shadow-2xl cursor-pointer pointer-events-auto relative overflow-hidden group transition-colors duration-500 ${
          isOpen ? 'bg-neutral-800 text-white' : 'bg-brand text-white'
        }`}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
        
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={28} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle size={28} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification Badge */}
        {!isOpen && (
          <span className="absolute top-3 right-3 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
        )}
      </motion.button>
    </div>
  );
};

export default ChatBubble;
