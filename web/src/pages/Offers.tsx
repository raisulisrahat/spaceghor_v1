import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getFunnels, BASE_URL } from '../services/api';
import { motion } from 'framer-motion';
import { Tag, Sparkles, ChevronRight, ShoppingBag, Loader2, Percent, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';
import { useSettings } from '../context/SettingsContext';

const Offers = () => {
    const { language } = useLanguage();
    const { siteTitle } = useSettings();

    const { data: funnels, isLoading, error } = useQuery({
        queryKey: ['active-funnels'],
        queryFn: () => getFunnels().then(res => res.data),
    });

    const activeFunnels = funnels?.filter((f: any) => f.is_active) || [];

    const getFunnelPrice = (funnel: any) => {
        const product = funnel.product_details;
        if (!product) return { originalPrice: 0, finalPrice: 0, discount: 0 };

        const regPrice = parseFloat(product.regular_price) || 0;
        let finalPrice = parseFloat(product.sale_price || product.regular_price) || 0;
        let discount = 0;

        if (funnel.discount_percentage) {
            const pct = parseFloat(funnel.discount_percentage);
            finalPrice = Math.floor(regPrice * (1 - pct / 100));
            discount = Math.round(pct);
        } else if (product.sale_price) {
            discount = Math.round((1 - finalPrice / regPrice) * 100);
        }

        return { originalPrice: regPrice, finalPrice, discount };
    };

    if (isLoading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-brand animate-spin" />
                <p className="text-neutral-500 font-bold tracking-wide animate-pulse">
                    {language === 'bn' ? 'অফারগুলো লোড হচ্ছে...' : 'Loading special offers...'}
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-inner">
                    <Tag className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-neutral-900">
                        {language === 'bn' ? 'অফার লোড করতে সমস্যা হয়েছে' : 'Failed to Load Offers'}
                    </h2>
                    <p className="text-neutral-500 mt-2 max-w-sm">
                        {language === 'bn'
                            ? 'অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
                            : 'Please check your connection and try again.'}
                    </p>
                </div>
                <Link to="/" className="inline-flex items-center space-x-2 bg-brand text-white px-6 py-3 rounded-xl font-bold hover:bg-[#3a5bd9] transition-colors shadow-lg">
                    <ArrowLeft className="w-4 h-4" />
                    <span>{language === 'bn' ? 'হোমে ফিরে যান' : 'Back to Home'}</span>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] py-12">
            <SEO
                title={language === 'bn' ? `স্পেশাল অফার সমূহ - ${siteTitle}` : `Special Offers - ${siteTitle}`}
                description="Explore our exclusive discount bundles and high-value promo offers in Bangladesh."
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm text-neutral-500 mb-6">
                    <Link to="/" className="hover:text-neutral-900 transition-colors">
                        {language === 'bn' ? 'হোম' : 'Home'}
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="text-brand font-bold">
                        {language === 'bn' ? 'স্পেশাল অফার' : 'Special Offers'}
                    </span>
                </div>

                {/* Page Header */}
                <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                    <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'সীমিত সময়ের অফার' : 'Limited Time Deals'}</span>
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight leading-tight">
                        {language === 'bn' ? 'আমাদের বিশেষ অফারসমূহ' : 'Our Exclusive Offers'}
                    </h1>
                    <p className="text-neutral-500 text-sm sm:text-base leading-relaxed">
                        {language === 'bn'
                            ? 'সেরা মানের পণ্য কিনুন আকর্ষণীয় ডিসকাউন্টে! সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা।'
                            : 'Grab premium products with special discounted bundles. Enjoy fast cash on delivery across Bangladesh.'}
                    </p>
                </div>

                {/* Empty State */}
                {activeFunnels.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 bg-white rounded-3xl border border-neutral-100 shadow-sm max-w-xl mx-auto space-y-6"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-50 rounded-full text-neutral-400">
                            <ShoppingBag className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-neutral-900">
                                {language === 'bn' ? 'কোনো সক্রিয় অফার পাওয়া যায়নি' : 'No Active Offers'}
                            </h3>
                            <p className="text-neutral-500 mt-2 max-w-xs mx-auto">
                                {language === 'bn'
                                    ? 'বর্তমানে কোনো অফার ক্যাম্পেইন সচল নেই। অনুগ্রহ করে আমাদের প্রোডাক্ট পেইজ ভিজিট করুন।'
                                    : 'There are no active offer campaigns running right now. Check back soon!'}
                            </p>
                        </div>
                        <Link
                            to="/products"
                            className="inline-flex items-center space-x-2 bg-brand text-white px-6 py-3 rounded-xl font-bold hover:bg-[#3a5bd9] transition-colors shadow-lg shadow-brand/15"
                        >
                            <span>{language === 'bn' ? 'পণ্য সমূহ দেখুন' : 'Explore Products'}</span>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                ) : (
                    /* Funnel Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {activeFunnels.map((funnel: any, idx: number) => {
                            const { originalPrice, finalPrice, discount } = getFunnelPrice(funnel);
                            const product = funnel.product_details;
                            if (!product) return null;

                            return (
                                <motion.div
                                    key={funnel.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(idx * 0.1, 0.4), duration: 0.5 }}
                                    className="group bg-white rounded-3xl border border-neutral-100/80 shadow-md shadow-neutral-200/50 hover:shadow-xl hover:shadow-neutral-200/80 transition-all duration-300 flex flex-col overflow-hidden"
                                >
                                    {/* ① Product Image — clean, no overlapping badges */}
                                    <Link
                                        to={`/offer/${funnel.slug}`}
                                        className="aspect-[4/3] bg-neutral-50 border-b border-neutral-100 overflow-hidden block"
                                    >
                                        <img
                                            src={product.image.startsWith('http') ? product.image : `${BASE_URL}${product.image}`}
                                            alt={funnel.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </Link>

                                    {/* ② Card Content — badges first, then title/price/CTA */}
                                    <div className="p-6 flex flex-col flex-grow space-y-4">

                                        {/* Badges row — below image */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {discount > 0 && (
                                                <span className="inline-flex items-center space-x-1 bg-brand text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
                                                    <Percent className="w-3 h-3" />
                                                    <span>{language === 'bn' ? `${discount}% ছাড়` : `${discount}% OFF`}</span>
                                                </span>
                                            )}
                                            <span className="inline-flex items-center bg-neutral-900 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                                                {language === 'bn' ? '🔥 হট ডিল' : '🔥 Hot Deal'}
                                            </span>
                                        </div>

                                        {/* Title & product name */}
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-black text-neutral-900 tracking-tight leading-snug group-hover:text-brand transition-colors line-clamp-1">
                                                {funnel.title}
                                            </h3>
                                            <p className="text-neutral-500 text-xs font-medium line-clamp-1">
                                                {product.name}
                                            </p>
                                        </div>

                                        {/* Price */}
                                        <div className="flex items-baseline space-x-3">
                                            <span className="text-2xl font-black text-neutral-900">
                                                ৳{finalPrice.toLocaleString()}
                                            </span>
                                            {discount > 0 && (
                                                <span className="text-sm text-neutral-400 line-through">
                                                    ৳{originalPrice.toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Meta */}
                                        <div className="flex items-center space-x-4 text-[10px] font-bold text-neutral-400 uppercase tracking-wider pt-2 border-t border-neutral-50">
                                            <span className="flex items-center space-x-1 text-emerald-600">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span>{language === 'bn' ? 'স্টকে আছে' : 'In Stock'}</span>
                                            </span>
                                            <span>•</span>
                                            <span>{language === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'}</span>
                                        </div>

                                        {/* CTA */}
                                        <Link
                                            to={`/offer/${funnel.slug}`}
                                            className="w-full bg-brand hover:bg-neutral-950 text-white py-3.5 rounded-2xl font-black uppercase tracking-wider text-xs shadow-lg shadow-brand/10 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 flex items-center justify-center space-x-2 mt-auto"
                                        >
                                            <span>{language === 'bn' ? 'অফারটি লুফে নিন' : 'Claim Special Offer'}</span>
                                            <ChevronRight className="w-4 h-4 animate-pulse" />
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Offers;
