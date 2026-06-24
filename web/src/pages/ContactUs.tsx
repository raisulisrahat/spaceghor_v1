import React from 'react';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Facebook } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const ContactUs = () => {
  const { settings, siteTitle } = useSettings();

  const formattedSiteTitle = siteTitle.toLowerCase().replace(/\s+/g, '');
  const siteEmail = `support@${formattedSiteTitle}.com`;
  const contactPhone = settings?.support_phone || "01516-542909";
  const whatsappNumber = settings?.whatsapp_number || "01516-542909";
  const facebookLink = settings?.facebook_url || "https://www.facebook.com/timespace24";
  const messengerLink = settings?.messenger_url || "https://m.me/timespace24";

  return (
    <div className="bg-white min-h-screen">
      <SEO title="Contact Us" description={`Get in touch with ${siteTitle} support team.`} />
      
      <div className="bg-neutral-50 py-12 md:py-16 border-b border-neutral-100">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black text-neutral-900 tracking-tighter mb-4 uppercase"
          >
            Get In <span className="text-brand">Touch</span>
          </motion.h1>
          <p className="text-sm text-neutral-500 max-w-xl mx-auto font-medium leading-relaxed opacity-80">
            Have a question or need assistance? Our team is here to help.
          </p>
        </div>
      </div>

      {/* Office Location Map */}
      <div className="max-w-[1200px] mx-auto px-6 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl border border-neutral-100 p-1.5 shadow-xl">
          <div className="rounded-xl overflow-hidden h-[250px] md:h-[350px] bg-neutral-100 relative group">
            <iframe 
              title="Office Location"
              width="100%" 
              height="100%" 
              frameBorder="0" 
              scrolling="no" 
              marginHeight={0} 
              marginWidth={0} 
              src="https://maps.google.com/maps?q=229/A%20Lalmohon%20Shah%20Street,%20Wari,%20Dhaka&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="grayscale group-hover:grayscale-0 transition-all duration-700"
            ></iframe>
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-neutral-100 shadow-xl flex items-center gap-2.5">
              <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center text-brand">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-0.5">Office Location</p>
                <p className="text-[10px] font-bold text-neutral-900 leading-none">229/A Lalmohon Shah Street, Wari, Dhaka</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">
          {/* Contact Info */}
          <div className="space-y-10">
            <div>
              <h2 className="text-xl font-black text-neutral-900 mb-6 uppercase tracking-tight">Our Brand</h2>
              <div className="space-y-4">
                {[
                  { name: siteTitle, desc: "One of the most trusted online shopping platforms in Bangladesh! 🇧🇩", link: facebookLink },
                ].map((brand, i) => (
                  <div key={i} className="bg-neutral-50 p-5 rounded-xl border border-neutral-100 relative group overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                    <a 
                      href={brand.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 mb-1.5 group/header"
                    >
                      <div className="w-6 h-6 bg-[#1877F2] rounded-lg flex items-center justify-center text-white group-hover/header:scale-110 transition-transform">
                        <Facebook className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-brand font-black uppercase text-sm tracking-wider hover:underline underline-offset-4">{brand.name}</h3>
                    </a>
                    <p className="text-neutral-600 text-xs leading-relaxed mb-3 opacity-80">{brand.desc}</p>
                    <div className="flex flex-wrap gap-4 text-xs font-black uppercase tracking-widest text-neutral-400">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-brand/60" /> {contactPhone}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-brand/60" /> {siteEmail}
                      </span>
                      <a href={brand.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-brand transition-all group/link">
                        <Facebook className="w-3 h-3 text-brand/60 group-hover/link:text-brand" /> Facebook
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black text-neutral-900 mb-6 uppercase tracking-tight">📞 যোগাযোগ করুন</h2>
              <p className="text-[13px] text-neutral-500 mb-6 font-medium leading-relaxed opacity-80">যেকোনো তথ্য বা সহযোগিতার জন্য যোগাযোগ করুন আমাদের কাস্টমার সাপোর্ট টিমের সঙ্গে। আমরা সবসময় প্রস্তুত আপনাকে সহায়তা করতে।</p>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Phone", value: contactPhone, icon: "📞" },
                  { label: "WhatsApp", value: whatsappNumber, icon: "💬" },
                  { label: "Messenger", value: siteTitle, icon: "👤" },
                  { label: "Email", value: siteEmail, icon: "📧" }
                ].map((item, i) => (
                  <div key={i} className="border border-neutral-100 p-3.5 rounded-xl hover:border-brand transition-colors cursor-pointer group bg-white shadow-sm">
                    <div className='flex items-center gap-2 mb-2'><span className="text-sm mb-1.5 block">{item.icon}</span>
                    <p className="text-sm font-black uppercase tracking-widest text-neutral-400">{item.label}</p></div>
                    <p className="text-neutral-900 font-bold text-xs truncate group-hover:text-brand">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-3xl border border-neutral-100 p-6 md:p-10 shadow-sm self-start">
            <h2 className="text-xl font-black text-neutral-900 mb-6 uppercase tracking-tight">Send a Message</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Your Name</label>
                  <input type="text" className="w-full bg-neutral-50 border-none rounded-lg px-3 py-3 text-[12px] focus:ring-1 focus:ring-brand font-medium" placeholder="John Doe" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Phone Number</label>
                  <input type="text" className="w-full bg-neutral-50 border-none rounded-lg px-3 py-3 text-[12px] focus:ring-1 focus:ring-brand font-medium" placeholder="01XXX XXXXXX" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Message</label>
                <textarea rows={4} className="w-full bg-neutral-50 border-none rounded-lg px-3 py-3 text-[12px] focus:ring-1 focus:ring-brand font-medium" placeholder="How can we help you?"></textarea>
              </div>
              <button className="w-full bg-neutral-900 text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-brand hover:shadow-xl hover:shadow-brand/20 transition-all active:scale-95">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
