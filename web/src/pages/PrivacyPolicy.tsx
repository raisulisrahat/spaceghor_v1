import React from 'react';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

const PrivacyPolicy = () => {
  const { siteTitle } = useSettings();
  return (
    <div className="bg-white min-h-screen">
      <SEO title="Privacy Policy" description={`Learn how ${siteTitle} protects your personal data.`} />
      
      <div className="bg-neutral-50 py-20 border-b border-neutral-100">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-neutral-900 tracking-tighter mb-6 uppercase"
          >
            Privacy <span className="text-brand">Policy</span>
          </motion.h1>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto font-medium">
            Your privacy is important to us. Here's how we protect your data.
          </p>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-6 py-20 prose prose-neutral prose-brand">
        <p className="text-neutral-400 text-sm mb-12">Last updated: April 30, 2025</p>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">WHO WE ARE</h2>
          <p className="text-neutral-600 leading-relaxed mb-4">
            Our website address is: {window.location.origin}.
          </p>
          <p className="text-neutral-600 leading-relaxed">
            At {siteTitle}, we are committed to redefining the way you shop online. As one of the most reliable and fast-growing e-commerce platforms in the country, we take pride in offering a seamless, secure, and satisfying shopping experience for all our customers, no matter where you are in Bangladesh.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">DATA COLLECTION</h2>
          <p className="text-neutral-600 leading-relaxed mb-4">
            We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.
          </p>
          <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Information We Collect:</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-600">
              <li className="flex items-center space-x-2"><span>📧</span> <span>Email address</span></li>
              <li className="flex items-center space-x-2"><span>👤</span> <span>Full Name</span></li>
              <li className="flex items-center space-x-2"><span>📞</span> <span>Phone number</span></li>
              <li className="flex items-center space-x-2"><span>📍</span> <span>Address & City</span></li>
            </ul>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">HOW WE USE YOUR DATA</h2>
          <ul className="space-y-4">
            {[
              "To provide and maintain our Service",
              "To manage Your Account registration",
              "For the performance of a purchase contract",
              "To contact You for updates or informative communications",
              "To provide news, special offers and general information"
            ].map((text, i) => (
              <li key={i} className="flex items-start space-x-3 text-neutral-600">
                <span className="text-brand">✔</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">TRACKING & COOKIES</h2>
          <p className="text-neutral-600 leading-relaxed">
            We use Cookies and similar tracking technologies to track the activity on Our Service and store certain information. Tracking technologies used are beacons, tags, and scripts to collect and track information and to improve and analyze Our Service.
          </p>
        </section>

        <section className="bg-neutral-900 text-white p-8 rounded-[32px] shadow-2xl shadow-neutral-900/20">
          <h2 className="text-xl font-black mb-6 uppercase tracking-tight">CONTACT US</h2>
          <p className="text-neutral-400 text-sm mb-6">If you have any questions about this Privacy Policy, You can contact us:</p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm">
              <span className="text-brand">📧</span>
              <span>support@{siteTitle.toLowerCase().replace(/\s+/g, '')}.com</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <span className="text-brand">📞</span>
              <span>01618-320869</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
