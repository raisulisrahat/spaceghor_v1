import React from 'react';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

const ShippingPolicy = () => {
  const { siteTitle } = useSettings();
  return (
    <div className="bg-white min-h-screen">
      <SEO title="Shipping Policy" description={`Read about ${siteTitle}'s shipping and delivery policies.`} />
      
      <div className="bg-neutral-50 py-20 border-b border-neutral-100">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-neutral-900 tracking-tighter mb-6 uppercase"
          >
            Shipping <span className="text-brand">Policy</span>
          </motion.h1>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto font-medium">
            Fast, reliable, and transparent delivery across Bangladesh.
          </p>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-6 py-20 prose prose-neutral prose-brand">
        <section className="mb-12">
          <p className="text-neutral-600 leading-relaxed mb-6 font-medium text-lg">
            প্রিয় ক্রেতা, {siteTitle}-এ আমরা প্রতিটি অর্ডার অত্যন্ত যত্ন ও গুরুত্বের সঙ্গে প্রক্রিয়াজাত করি যেন আপনি পান দ্রুত, নিরাপদ এবং নির্ভরযোগ্য সার্ভিস।
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {[
              "১. অর্ডার করুন এবং ডেলিভারি মেথড সিলেক্ট করুন",
              "২. অর্ডার কনফার্মেশন মেসেজ পাবেন",
              "৩. আপনার অর্ডারের জন্য অপেক্ষা করুন",
              "৪. চেকআউট এরিয়া থেকে অর্ডার বুঝে নিন"
            ].map((step, i) => (
              <div key={i} className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex items-center space-x-3">
                <span className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center font-bold shrink-0">{i+1}</span>
                <span className="text-neutral-900 font-bold text-sm">{step}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">✅ অর্ডার প্রসেসিং</h2>
          <p className="text-neutral-600 leading-relaxed mb-4">
            প্রতিটি পণ্য ডেলিভারির আগে আমাদের টিম দ্বারা ভালোভাবে পরীক্ষা করা হয়। ফাইনাল কোয়ালিটি চেকের পর, পণ্যগুলো নিরাপদ প্যাকেজিংয়ের মাধ্যমে ডেলিভারি পার্টনারের হাতে হস্তান্তর করা হয়।
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">📞 অর্ডার কনফার্মেশন</h2>
          <p className="text-neutral-600 leading-relaxed">
            প্রতিটি অর্ডার ফোন কলে কনফার্ম করে পাঠানো হয়। অর্ডার কনফার্মেশনের জন্য সর্বোচ্চ ৩ দিন পর্যন্ত হোল্ড করে রাখা হয়।
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">📦 প্যাকেজিং প্রক্রিয়া</h2>
          <p className="text-neutral-600 leading-relaxed mb-4">
            প্রতিটি পণ্য ইনভয়েসসহ শক্ত কার্ডবোর্ড বক্সে প্যাক করা হয়। ভাঙার সম্ভাবনা থাকলে বাবল র‍্যাপ দিয়ে বিশেষভাবে সুরক্ষিত করা হয়। প্রতিটি প্যাকেজের আলাদা ছবি তোলা হয় এবং প্যাকিং প্রক্রিয়া CCTV ক্যামেরার মাধ্যমে মনিটর করা হয়।
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">🚚 ডেলিভারি পার্টনার</h2>
          <p className="text-neutral-600 leading-relaxed mb-4">
            আমরা নির্ভরযোগ্য কুরিয়ার সার্ভিসের সঙ্গে কাজ করি: Pathao, Steadfast, Sundarban Courier.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">💰 ডেলিভারি চার্জ</h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="w-2 h-2 bg-brand rounded-full mr-3 mt-2 shrink-0"></div>
              <p className="text-neutral-600"><span className="font-bold text-neutral-900">ঢাকার ভিতরে:</span> ৫০ টাকা</p>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-brand rounded-full mr-3 mt-2 shrink-0"></div>
              <p className="text-neutral-600"><span className="font-bold text-neutral-900">ঢাকার বাইরে:</span> ১০০ টাকা</p>
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">⏱️ ডেলিভারি সময়</h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="w-2 h-2 bg-brand rounded-full mr-3 mt-2 shrink-0"></div>
              <p className="text-neutral-600"><span className="font-bold text-neutral-900">ঢাকার ভিতরে:</span> ১ - ৩ কার্যদিবস</p>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-brand rounded-full mr-3 mt-2 shrink-0"></div>
              <p className="text-neutral-600"><span className="font-bold text-neutral-900">ঢাকার বাইরে:</span> ২ - ৫ কার্যদিবস</p>
            </li>
          </ul>
        </section>

        <section className="bg-brand/5 p-8 rounded-3xl border border-brand/10">
          <h2 className="text-xl font-black text-neutral-900 mb-4 uppercase tracking-tight">❗ গুরুত্বপূর্ণ তথ্য</h2>
          <p className="text-neutral-600 text-sm leading-relaxed mb-4">
            পণ্য হাতে পেলে ডেলিভারি ম্যানের সামনে প্যাকেট খুলে পরীক্ষা করুন। যদি সামনে খোলা সম্ভব না হয়, তাহলে আনবক্সিং ভিডিও রেকর্ড করুন যাতে সমস্যা স্পষ্টভাবে দেখা যায়। প্রমাণ ছাড়া কোনো ড্যামেজ ক্লেইম গ্রহণযোগ্য নয়।
          </p>
          <p className="text-neutral-400 text-[10px] uppercase font-bold tracking-widest">
            বিঃদ্রঃ: প্রাকৃতিক দুর্যোগ, রাজনৈতিক অস্থিরতা বা যানবাহন সমস্যার কারণে ডেলিভারিতে দেরি হতে পারে।
          </p>
        </section>
      </div>
    </div>
  );
};

export default ShippingPolicy;
