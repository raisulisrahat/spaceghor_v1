import React from 'react';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

const AboutUs = () => {
  const { siteTitle } = useSettings();
  return (
    <div className="bg-white min-h-screen">
      <SEO title="আমাদের সম্পর্কে" description={`বাংলাদেশে আপনার বিশ্বস্ত ই-কমার্স গন্তব্য - ${siteTitle} সম্পর্কে আরও জানুন।`} />
      
      {/* Hero Section */}
      <div className="bg-neutral-50 py-20 border-b border-neutral-100">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-neutral-900 tracking-tighter mb-6 uppercase"
          >
            আমাদের <span className="text-brand">{siteTitle}</span>
          </motion.h1>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto font-medium">
            বাংলাদেশে সবচেয়ে নির্ভরযোগ্য এবং বিশ্বস্ত ই-কমার্স গন্তব্য তৈরি করা।
          </p>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-6 py-20 prose prose-neutral prose-brand">
        <section className="mb-12">
          <p className="text-neutral-600 leading-relaxed mb-6 font-medium text-lg">
            {siteTitle}-এ আপনাকে স্বাগতম – বাংলাদেশের অন্যতম বিশ্বস্ত অনলাইন শপিং প্ল্যাটফর্ম! 🇧🇩 আমরা একটি শীর্ষস্থানীয় ই-কমার্স গন্তব্য হতে পেরে গর্বিত, যা দেশজুড়ে গ্রাহকদের একটি মসৃণ, নিরাপদ এবং নির্ভরযোগ্য কেনাকাটার অভিজ্ঞতা প্রদান করে।
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[
              { icon: "🚚", title: "সারা দেশে ডেলিভারি", desc: "বাংলাদেশের প্রতিটি কোণায় দ্রুত এবং নির্ভরযোগ্য ডেলিভারি সেবা।" },
              { icon: "💵", title: "ক্যাশ অন ডেলিভারি", desc: "পণ্য পৌঁছানোর পর পেমেন্ট করুন—কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই!" },
              { icon: "✅", title: "১০০% আসল পণ্য", desc: "আপনি যা দেখছেন ঠিক তাই পাবেন—সর্বদা খাঁটি এবং আসল পণ্য।" },
              { icon: "🔄", title: "সহজ রিটার্ন পলিসি", desc: "আপনার সন্তুষ্টি নিশ্চিত করতে ঝামেলা-মুক্ত রিটার্ন এবং রিপ্লেসমেন্ট সুবিধা।" },
              { icon: "💰", title: "সেরা অফার ও ডিল", desc: "প্রতিদিন দারুণ অফার এবং সাশ্রয়ী মূল্যে কেনাকাটা উপভোগ করুন।" },
              { icon: "🔐", title: "নিরাপদ কেনাকাটা", desc: "আমাদের নিরাপদ এবং বিশ্বস্ত পেমেন্ট পদ্ধতির মাধ্যমে আত্মবিশ্বাসের সাথে কেনাকাটা করুন।" }
            ].map((item, i) => (
              <div key={i} className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                <span className="text-2xl mb-3 block">{item.icon}</span>
                <h3 className="text-neutral-900 font-bold mb-2">{item.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-neutral-600 leading-relaxed mb-12">
            {siteTitle}-এ, আমরা আপনার অনলাইন কেনাকাটার যাত্রাকে সহজ, সাশ্রয়ী এবং আনন্দদায়ক করতে এখানে আছি। আমাদের বেছে নেওয়ার জন্য আপনাকে ধন্যবাদ—আপনাকে সেবা করতে পেরে আমরা সম্মানিত। 🌟
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">আমাদের লক্ষ্য (Vision)</h2>
          <p className="text-neutral-600 leading-relaxed">
            আমাদের সম্মানিত গ্রাহকদের বিভিন্ন চাহিদা পূরণের জন্য মানসম্পন্ন পণ্যের সমাহার, চমৎকার কাস্টমার সার্ভিস এবং একটি নিরাপদ ও সহজ শপিং প্ল্যাটফর্ম প্রদানের মাধ্যমে বাংলাদেশের অনলাইন শপিং ব্যবস্থায় বিপ্লব ঘটানো।
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">আমাদের উদ্দেশ্য (Mission)</h2>
          <p className="text-neutral-600 leading-relaxed">
            বাংলাদেশে সবার জন্য অনলাইন কেনাকাটাকে সহজলভ্য, নির্ভরযোগ্য এবং আনন্দদায়ক করে তোলা, যার জন্য আমরা নিশ্চিত করি:
          </p>
          <ul className="space-y-2 mt-4">
            <li className="flex items-center text-neutral-600">✔️ উচ্চ মানের পণ্য</li>
            <li className="flex items-center text-neutral-600">✔️ মসৃণ এবং দ্রুত ডেলিভারি</li>
            <li className="flex items-center text-neutral-600">✔️ বন্ধুসুলভ এবং আন্তরিক কাস্টমার সাপোর্ট</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-black text-neutral-900 mb-6 uppercase tracking-tight">মানের প্রতি প্রতিশ্রুতি</h2>
          <p className="text-neutral-600 leading-relaxed">
            {siteTitle}-এ, মান আমাদের প্রথম অগ্রাধিকার। নিত্যপ্রয়োজনীয় জিনিস থেকে শুরু করে আধুনিক গ্যাজেট পর্যন্ত, প্রতিটি পণ্য অত্যন্ত যত্ন সহকারে বাছাই করা হয়, যা নিশ্চিত করে:
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            {["✨ টেকসই গুণমান", "✨ কার্যকারিতা", "✨ স্টাইল ও ডিজাইন"].map((tag, i) => (
              <span key={i} className="bg-brand/5 text-brand px-4 py-2 rounded-full text-sm font-bold">{tag}</span>
            ))}
          </div>
          <p className="text-neutral-600 mt-6">
            আমরা আপনাকে কেবল পণ্যই নয়, প্রতিটি অর্ডারের সাথে বিশ্বাস এবং সন্তুষ্টি দিতে প্রতিশ্রুতিবদ্ধ।
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
