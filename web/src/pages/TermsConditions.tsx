import React from 'react';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

const TermsConditions = () => {
  const { siteTitle } = useSettings();
  return (
    <div className="bg-white min-h-screen">
      <SEO title="Terms & Conditions" description={`Read ${siteTitle}'s terms and conditions of use.`} />
      
      <div className="bg-neutral-50 py-20 border-b border-neutral-100">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-neutral-900 tracking-tighter mb-6 uppercase"
          >
            Terms & <span className="text-brand">Conditions</span>
          </motion.h1>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto font-medium">
            Please read these terms carefully before using our services.
          </p>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-6 py-20 prose prose-neutral prose-brand">
        <p className="text-neutral-400 text-sm mb-12">Last updated April 30, 2025</p>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">1. AGREEMENT TO OUR LEGAL TERMS</h2>
          <p className="text-neutral-600 leading-relaxed mb-4">
            We are {siteTitle} ("Company," "we," "us," "our"), a company registered in Bangladesh at Mirpur-1, Dhaka 1206. We operate the website {window.location.origin} (the "Site"), as well as any other related products and services that refer or link to these legal terms.
          </p>
          <p className="text-neutral-600 leading-relaxed">
            These Legal Terms constitute a legally binding agreement made between you and {siteTitle}, concerning your access to and use of the Services. You agree that by accessing the Services, you have read, understood, and agreed to be bound by all of these Legal Terms.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">2. OUR SERVICES</h2>
          <p className="text-neutral-600 leading-relaxed">
            The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">3. PRODUCTS</h2>
          <p className="text-neutral-600 leading-relaxed">
            We make every effort to display as accurately as possible the colors, features, specifications, and details of the products available on the Services. However, we do not guarantee that the colors, features, specifications, and details of the products will be accurate, complete, reliable, current, or free of other errors.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">4. PURCHASES AND PAYMENT</h2>
          <p className="text-neutral-600 leading-relaxed mb-4">
            We accept the following forms of payment: Visa, Mastercard, American Express, bKash, Nagad, and Rocket.
          </p>
          <p className="text-neutral-600 leading-relaxed">
            You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services. Sales tax will be added to the price of purchases as deemed required by us. All payments shall be in BDT.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">5. GOVERNING LAW</h2>
          <p className="text-neutral-600 leading-relaxed">
            These Legal Terms shall be governed by and defined following the laws of Bangladesh. {siteTitle} and yourself irrevocably consent that the courts of Bangladesh shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these Legal Terms.
          </p>
        </section>

        <section className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100">
          <h2 className="text-xl font-black text-neutral-900 mb-4 uppercase tracking-tight">CONTACT US</h2>
          <p className="text-neutral-600 text-sm leading-relaxed mb-2">
            In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at:
          </p>
          <div className="text-neutral-900 font-bold text-sm">
            {siteTitle}<br />
            229/A Lalmohon Shah Street, Wari, Dhaka.<br />
            Bangladesh<br />
            Phone: 01618-320869
          </div>
        </section>
      </div>
    </div>
  );
};

export default TermsConditions;
