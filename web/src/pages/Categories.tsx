import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, BASE_URL } from '../services/api';
import { LayoutGrid, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { useSettings } from '../context/SettingsContext';

const Categories = () => {
    const { siteTitle } = useSettings();
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getCategories();
                const data = response.data.results || response.data;
                // Only show parent categories for a cleaner landing page
                setCategories(data.filter((c: any) => !c.parent));
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <SEO title="Categories" />
                <Loader2 className="w-10 h-10 text-brand animate-spin" />
                <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Organizing Collections...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <SEO 
                title="Shop by Category" 
                description={`Browse our curated collections of premium gadgets, accessories, and more. Find exactly what you need at ${siteTitle}.`}
            />
            {/* Header Section */}
            <div className="max-w-2xl mb-12 sm:mb-20">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-[1px] bg-brand" />
                    <span className="text-[9px] font-bold text-brand uppercase tracking-[0.3em]">Shop Architecture</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight leading-none">
                    Browse <span className="text-brand">Collections</span>
                </h1>
                <p className="mt-4 text-[12px] text-neutral-500 font-medium leading-relaxed max-w-md opacity-80">
                    Our platform is organized into intuitive, high-quality collections to help you find exactly what you need with precision and style.
                </p>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {categories.map((category, index) => (
                    <motion.div
                        key={category.id}
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.6 }}
                    >
                        <Link 
                            to={`/products?category=${category.slug}`}
                            className="group block relative overflow-hidden rounded-2xl bg-white border border-neutral-100 p-2 hover:border-brand/20 transition-all duration-300 hover:shadow-xl"
                        >
                            <div className="aspect-square relative overflow-hidden rounded-xl bg-neutral-50">
                                {category.image ? (
                                    <img 
                                        src={category.image.startsWith('http') ? category.image : `${BASE_URL}${category.image}`} 
                                        alt={category.name} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-200">
                                        <LayoutGrid size={32} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-4">
                                    <span className="text-white font-bold uppercase tracking-[0.2em] text-[8px] flex items-center gap-1.5">
                                        <Sparkles size={10} /> Browse
                                    </span>
                                </div>
                            </div>

                            <div className="px-3 py-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-neutral-900 group-hover:text-brand transition-colors tracking-tight">{category.name}</h3>
                                    <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-neutral-200 group-hover:bg-brand transition-colors" />
                                        {category.product_count || 0} Items
                                    </p>
                                </div>
                                <div className="w-7 h-7 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-brand group-hover:text-white transition-all duration-300">
                                    <ArrowRight size={12} />
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Categories;
