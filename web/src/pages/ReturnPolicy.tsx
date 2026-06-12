import React from 'react';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

const ReturnPolicy = () => {
  const { siteTitle } = useSettings();
  return (
    <div className="bg-white min-h-screen">
      <SEO title="Return & Replacement Policy" description={`Read about ${siteTitle}'s return and replacement policies.`} />
      
      <div className="bg-neutral-50 py-20 border-b border-neutral-100">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-neutral-900 tracking-tighter mb-6 uppercase"
          >
            Return & <span className="text-brand">Replacement</span>
          </motion.h1>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto font-medium">
            Your satisfaction is our priority. Easy returns and replacements.
          </p>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-6 py-20 prose prose-neutral prose-brand">
        <section className="mb-12 text-center md:text-left">
          <p className="text-neutral-600 leading-relaxed mb-6 font-medium text-lg">
            আপনার সন্তুষ্টিই আমাদের অগ্রাধিকার। তাই রিটার্ন ও রিপ্লেসমেন্ট প্রক্রিয়াটি আমরা রেখেছি সহজ, স্বচ্ছ ও নির্ভরযোগ্য।
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">✅ ডেলিভারির সময় চেক করুন</h2>
          <p className="text-neutral-600 leading-relaxed mb-4">
            ডেলিভারি বয়ের সামনে পার্সেল খুলে পণ্যটি ভালোভাবে পরীক্ষা করুন। যদি ভুল, ত্রুটিপূর্ণ বা ক্ষতিগ্রস্ত পণ্য পান, সঙ্গে সঙ্গেই পণ্যটি ফেরত দিন।
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">🚫 ডেলিভারির পর রিটার্ন</h2>
          <p className="text-neutral-600 leading-relaxed mb-4">
            সাধারণভাবে, ডেলিভারির পরে রিটার্ন সম্ভব নয়। তবে বিশেষ ক্ষেত্রে, আপনি স্টেড-ফাস্ট, পাঠাও এবং সুন্দরবন কুরিয়ার এর মাধ্যমে জিরো কস্টে আমাদের ঠিকানায় পণ্যটি পাঠিয়ে রিটার্ন করতে পারবেন।
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">💸 রিফান্ড পদ্ধতি</h2>
          <p className="text-neutral-600 leading-relaxed">
            রিটার্ন প্রক্রিয়া সফলভাবে সম্পন্ন হলে আপনার পেমেন্ট ফেরত দেওয়া হবে।
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">⏳ সময়সীমা</h2>
          <p className="text-neutral-600 leading-relaxed">
            পণ্যের ধরন অনুযায়ী ৩ / ৫ / ৭ দিনের মধ্যে রিপ্লেসমেন্টের জন্য আবেদন করতে হবে।
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">📦 শর্তাবলী</h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="w-2 h-2 bg-brand rounded-full mr-3 mt-2 shrink-0"></div>
              <p className="text-neutral-600">পণ্যটি অব্যবহৃত, অরিজিনাল প্যাকেজিংয়ে, এবং সমস্ত আনুষঙ্গিক জিনিসপত্রসহ থাকতে হবে।</p>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-brand rounded-full mr-3 mt-2 shrink-0"></div>
              <p className="text-neutral-600">শুধুমাত্র ত্রুটিপূর্ণ, ভুল, অথবা ক্ষতিগ্রস্ত পণ্যের ক্ষেত্রে রিপ্লেসমেন্ট প্রযোজ্য।</p>
            </li>
          </ul>
        </section>

        <div className="bg-neutral-50 p-8 rounded-[32px] border border-neutral-100">
          <h2 className="text-2xl font-black text-neutral-900 mb-8 uppercase tracking-tight">রিটার্ন করার ধাপগুলো:</h2>
          <div className="space-y-8">
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-brand text-white rounded-2xl flex items-center justify-center font-black shrink-0">1</div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">যোগাযোগ করুন</h3>
                <p className="text-neutral-500 text-sm">📱 WhatsApp: 01618-320869</p>
              </div>
            </div>
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-brand text-white rounded-2xl flex items-center justify-center font-black shrink-0">2</div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">তথ্য দিন</h3>
                <p className="text-neutral-500 text-sm">অর্ডার নম্বর, পণ্যের নাম এবং সমস্যার বিস্তারিত বিবরণ দিন।</p>
              </div>
            </div>
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-brand text-white rounded-2xl flex items-center justify-center font-black shrink-0">3</div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">পণ্য পাঠান</h3>
                <p className="text-neutral-500 text-sm">আমাদের ঠিকানায় পণ্যটি কুরিয়ার করুন। আমরা যাচাই করে রিপ্লেসমেন্ট বা রিফান্ড প্রক্রিয়া শুরু করব।</p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-12 p-8 bg-brand/5 rounded-3xl border border-brand/10">
          <h2 className="text-xl font-black text-neutral-900 mb-4 uppercase tracking-tight">গুরুত্বপূর্ণ তথ্য</h2>
          <p className="text-neutral-600 text-sm leading-relaxed">
            রিটার্ন বা রিপ্লেসমেন্টের ক্ষেত্রে শিপিং খরচের ৫০% আপনাকে বহন করতে হবে। আমরা যেকোনো সময় নীতিমালা পরিবর্তনের অধিকার রাখি।
          </p>
        </section>
      </div>
    </div>
  );
};

export default ReturnPolicy;
