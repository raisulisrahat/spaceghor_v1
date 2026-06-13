import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getBrands, getCategories, BASE_URL } from '../services/api';
import { Zap, ArrowRight, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { useSettings } from '../context/SettingsContext';

const BrandCarousel = ({ brands }: { brands: any[] }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    const updateArrows = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeft(scrollLeft > 5);
            setShowRight(scrollLeft < scrollWidth - clientWidth - 5);
        }
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (el) {
            el.addEventListener('scroll', updateArrows);
            // Initial check
            updateArrows();
            window.addEventListener('resize', updateArrows);
        }
        return () => {
            if (el) {
                el.removeEventListener('scroll', updateArrows);
            }
            window.removeEventListener('resize', updateArrows);
        };
    }, [brands]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <div className="relative group">
            {showLeft && (
                <button 
                    onClick={() => scroll('left')}
                    className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-neutral-100 flex items-center justify-center shadow-lg hover:bg-neutral-50 hover:scale-105 active:scale-95 transition-all text-neutral-600 hover:text-brand"
                >
                    <ChevronLeft size={18} />
                </button>
            )}
            
            <div 
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scroll-smooth no-scrollbar py-2 px-1 snap-x snap-mandatory"
            >
                {brands.map((brand) => (
                    <div 
                        key={brand.id} 
                        className="w-[140px] sm:w-[160px] md:w-[180px] flex-shrink-0 snap-start"
                    >
                        <Link 
                            to={`/products?brand=${brand.id}`}
                            className="group block bg-white border border-neutral-100 rounded-2xl p-4 hover:border-brand/20 hover:shadow-lg transition-all duration-300 text-center relative overflow-hidden h-full flex flex-col items-center justify-center"
                        >
                            <div className="w-full aspect-square flex items-center justify-center mb-3 p-4 bg-neutral-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all duration-300">
                                {brand.logo ? (
                                    <img 
                                        src={brand.logo.startsWith('http') ? brand.logo : `${BASE_URL}${brand.logo}`} 
                                        alt={brand.name} 
                                        className="max-h-full max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 scale-90 group-hover:scale-100"
                                    />
                                ) : (
                                    <Zap className="w-6 h-6 text-neutral-200" />
                                )}
                            </div>
                            <h3 className="text-[11px] font-bold text-neutral-900 group-hover:text-brand transition-colors tracking-tight truncate w-full">{brand.name}</h3>
                            <div className="mt-2 flex items-center justify-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-neutral-400 group-hover:text-brand transition-all opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0">
                                <span>Browse</span>
                                <ArrowRight size={8} />
                            </div>
                        </Link>
                    </div>
                ))}
            </div>

            {showRight && (
                <button 
                    onClick={() => scroll('right')}
                    className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-neutral-100 flex items-center justify-center shadow-lg hover:bg-neutral-50 hover:scale-105 active:scale-95 transition-all text-neutral-600 hover:text-brand"
                >
                    <ChevronRight size={18} />
                </button>
            )}
        </div>
    );
};

const Brands = () => {
    const { siteTitle } = useSettings();
    const [brands, setBrands] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [brandsRes, categoriesRes] = await Promise.all([getBrands(), getCategories()]);
                setBrands(brandsRes.data.results || brandsRes.data);
                setCategories(categoriesRes.data.results || categoriesRes.data);
            } catch (error) {
                console.error('Error fetching brand/category data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const categorizedGroups = useMemo(() => {
        // Filter out subcategories, keeping only root/parent categories (those with no parent)
        const parentCategories = categories.filter((cat: any) => !cat.parent);

        const groups = parentCategories
            .map((parentCategory: any) => {
                // Find all subcategories belonging to this parent category
                const subCats = categories.filter((cat: any) => {
                    const pId = cat.parent && (typeof cat.parent === 'object' ? cat.parent.id : cat.parent);
                    return pId === parentCategory.id;
                });

                // Collect brand IDs from the parent category and its subcategories
                const allBrandIds = new Set<number>();
                
                if (Array.isArray(parentCategory.brands)) {
                    parentCategory.brands.forEach((id: number) => allBrandIds.add(id));
                }
                
                subCats.forEach((subCat: any) => {
                    if (Array.isArray(subCat.brands)) {
                        subCat.brands.forEach((id: number) => allBrandIds.add(id));
                    }
                });

                // Get brands matching these IDs and filter by search term
                const categoryBrands = brands.filter((brand: any) => 
                    allBrandIds.has(brand.id) &&
                    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
                );

                return {
                    id: parentCategory.id,
                    name: parentCategory.name,
                    brands: categoryBrands
                };
            })
            .filter(group => group.brands.length > 0);

        // Find uncategorized brands: those that do not belong to any category
        const categorizedBrandIds = new Set<number>();
        categories.forEach((cat: any) => {
            if (Array.isArray(cat.brands)) {
                cat.brands.forEach((id: number) => categorizedBrandIds.add(id));
            }
        });

        const uncategorizedBrands = brands.filter((brand: any) => {
            const isCategorized = categorizedBrandIds.has(brand.id);
            return !isCategorized && brand.name.toLowerCase().includes(searchTerm.toLowerCase());
        });

        if (uncategorizedBrands.length > 0) {
            groups.push({
                id: 'other',
                name: 'Other Brands',
                brands: uncategorizedBrands
            });
        }

        return groups;
    }, [brands, categories, searchTerm]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <SEO title="Our Brands" />
                <Loader2 className="w-10 h-10 text-brand animate-spin" />
                <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Discovering Brands...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <SEO 
                title="Official Brands Directory" 
                description={`Explore our world-class manufacturing partners and premium brands. Discover high-quality gadgets and accessories at ${siteTitle}.`}
            />
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="max-w-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-[1px] bg-brand" />
                        <span className="text-[9px] font-bold text-brand uppercase tracking-[0.3em]">Official Partners</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight leading-none">
                        Shop by <span className="text-brand">Brand</span>
                    </h1>
                    <p className="mt-4 text-[12px] text-neutral-500 font-medium leading-relaxed max-w-md opacity-80">
                        Explore curated collections from our world-class manufacturing partners. Every brand we host meets our signature quality standards.
                    </p>
                </div>

                <div className="relative w-full md:w-64 group">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-brand transition-colors">
                        <Search size={14} />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search directory..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-brand/5 focus:border-brand outline-none transition-all font-medium text-[12px] text-neutral-900 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Categorized Brands */}
            <div className="space-y-12">
                {categorizedGroups.map((group) => (
                    <div key={group.id} className="border-b border-neutral-100/50 pb-8 last:border-b-0">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-1.5 h-6 bg-brand rounded-full" />
                            <h2 className="text-lg font-black text-neutral-800 uppercase tracking-wider">
                                {group.name}
                            </h2>
                            <span className="text-xs font-bold text-neutral-400 bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-100">
                                {group.brands.length} {group.brands.length === 1 ? 'Brand' : 'Brands'}
                            </span>
                        </div>
                        
                        <BrandCarousel brands={group.brands} />
                    </div>
                ))}
            </div>

            {categorizedGroups.length === 0 && (
                <div className="py-24 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-neutral-50 rounded-full mb-4">
                        <Search className="w-4 h-4 text-neutral-300" />
                    </div>
                    <p className="text-[12px] font-bold text-neutral-400 tracking-tight">No results for "{searchTerm}"</p>
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="mt-4 text-brand font-bold uppercase tracking-[0.2em] text-[9px] hover:underline"
                    >
                        Reset Directory
                    </button>
                </div>
            )}
        </div>
    );
};

export default Brands;
