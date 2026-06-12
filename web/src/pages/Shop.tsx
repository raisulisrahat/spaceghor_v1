import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, ChevronDown, LayoutGrid, List, SlidersHorizontal, ChevronRight, ShoppingCart, Plus, Minus, Star, Heart, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProducts, getCategories, getBrands } from '../services/api';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import Breadcrumbs from '../components/Breadcrumbs';
import { resolveImageUrl } from '../utils/image';
import { useCart } from '../context/CartContext';
import SEO from '../components/SEO';

const Shop = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [sortBy, setSortBy] = useState('newest');
    const [expandedParents, setExpandedParents] = useState<number[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(25000); // Higher limit for BDT
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const ITEMS_PER_PAGE = 16;
    const { addToCart, setIsCartOpen } = useCart();

    const selectedCategory = searchParams.get('category');
    const selectedBrand = searchParams.get('brand');
    const searchQuery = searchParams.get('q') || searchParams.get('search');

    const { data: products, isLoading } = useQuery({
        queryKey: ['products', selectedCategory, selectedBrand, searchQuery, sortBy],
        queryFn: () => getProducts().then(res => res.data)
    });

    const { data: brands } = useQuery({
        queryKey: ['brands'],
        queryFn: () => getBrands().then(res => res.data)
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => getCategories().then(res => res.data)
    });

    const parentCategories = categories?.filter((c: any) => !c.parent) || [];
    const subCategoriesMap = categories?.reduce((acc: any, cat: any) => {
        if (cat.parent) {
            if (!acc[cat.parent]) acc[cat.parent] = [];
            acc[cat.parent].push(cat);
        }
        return acc;
    }, {}) || {};

    const toggleParent = (parentId: number) => {
        setExpandedParents(prev =>
            prev.includes(parentId) ? prev.filter(id => id !== parentId) : [...prev, parentId]
        );
    };

    // Auto-expand selected parent category on load or when selected category changes
    useEffect(() => {
        if (selectedCategory && categories) {
            const activeCat = categories.find((c: any) => c.slug === selectedCategory);
            if (activeCat) {
                const parentId = activeCat.parent || activeCat.id;
                if (parentId) {
                    setExpandedParents(prev => {
                        if (!prev.includes(parentId)) {
                            return [...prev, parentId];
                        }
                        return prev;
                    });
                }
            }
        }
    }, [selectedCategory, categories]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, selectedBrand, searchQuery, sortBy, minPrice, maxPrice]);

    // Get all descendant category slugs recursively for filtering
    const getCategorySlugs = (parentSlug: string | null): string[] => {
        if (!parentSlug || !categories) return [];

        // Find the starting category
        const startCat = categories.find((c: any) => c.slug === parentSlug);
        if (!startCat) return [parentSlug];

        const allSlugs: string[] = [parentSlug];

        // Recursive function to gather all children
        const addChildren = (parentId: number) => {
            const children = categories.filter((c: any) => c.parent === parentId);
            children.forEach((child: any) => {
                allSlugs.push(child.slug);
                addChildren(child.id);
            });
        };

        addChildren(startCat.id);
        return allSlugs;
    };

    const activeCategorySlugs = getCategorySlugs(selectedCategory);

    const filteredProducts = products?.filter((p: any) => {
        const price = parseFloat(p.sale_price || p.regular_price);

        // Check if product belongs to the selected category or any of its sub-categories
        if (selectedCategory) {
            const hasCategoryMatch = p.categories.some((c: any) => activeCategorySlugs.includes(c.slug));
            if (!hasCategoryMatch) return false;
        }
        if (selectedBrand && p.brand?.slug !== selectedBrand) return false;
        if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (price < minPrice || price > maxPrice) return false;
        return true;
    }) || [];

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        const stockA = a.stock && a.stock > 0 ? 1 : 0;
        const stockB = b.stock && b.stock > 0 ? 1 : 0;
        if (stockA !== stockB) {
            return stockB - stockA; // In stock items first
        }
        const priceA = parseFloat(a.sale_price || a.regular_price);
        const priceB = parseFloat(b.sale_price || b.regular_price);
        if (sortBy === 'low') return priceA - priceB;
        if (sortBy === 'high') return priceB - priceA;
        if (sortBy === 'newest') return b.id - a.id;
        return 0;
    });

    const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = sortedProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const activeBrands = brands?.filter((brand: any) => {
        if (!selectedCategory) return true;
        const relatedCategories = categories?.filter((c: any) => activeCategorySlugs.includes(c.slug));
        return relatedCategories?.some((c: any) => c.brands?.includes(brand.id));
    }) || [];

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 4) {
                pages.push(1, 2, 3, 4, 5, '...', totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <SEO
                title={
                    searchQuery ? `Search results for "${searchQuery}"` :
                        selectedCategory ? selectedCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) :
                            selectedBrand ? brands?.find((b: any) => b.slug === selectedBrand)?.name || 'Brand' :
                                'Premium Collection'
                }
                description={`Explore our exclusive collection of ${selectedCategory || 'premium products'}. Fast delivery across Bangladesh.`}
            />
            <div className="flex flex-col md:flex-row gap-10">


                {/* Desktop Sidebar Filters */}
                <aside className="hidden md:block w-72 space-y-10">
                    <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
                        <h3 className="text-base font-bold text-neutral-900 mb-6 flex items-center">
                            <Filter className="w-4 h-4 mr-2 text-brand" />
                            Categories
                        </h3>
                        <div className="space-y-1">

                            {parentCategories.map((cat: any) => {
                                const isSelected = selectedCategory === cat.slug;
                                const hasSubs = subCategoriesMap[cat.id]?.length > 0;
                                const isExpanded = expandedParents.includes(cat.id);

                                return (
                                    <div key={cat.id} className="space-y-1">
                                        <div className="flex items-center group px-1">
                                            {hasSubs && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleParent(cat.id);
                                                    }}
                                                    className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'text-brand bg-brand/5' : 'text-neutral-300 hover:text-neutral-400'}`}
                                                >
                                                    {isExpanded ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                                </button>
                                            )}
                                            {!hasSubs && <div className="w-[30px]" />}

                                            <button
                                                onClick={() => {
                                                    searchParams.set('category', cat.slug);
                                                    setSearchParams(searchParams);
                                                }}
                                                className={`flex-grow text-left px-2 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap ${isSelected ? 'text-brand font-bold' : 'text-neutral-500 hover:text-neutral-900'}`}
                                            >
                                                {cat.name}
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {hasSubs && isExpanded && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden pl-4 space-y-1"
                                                >
                                                    <div className="border-l-2 border-neutral-100 pl-3 py-1 space-y-1">
                                                        {subCategoriesMap[cat.id].map((sub: any) => (
                                                            <button
                                                                key={sub.id}
                                                                onClick={() => {
                                                                    searchParams.set('category', sub.slug);
                                                                    setSearchParams(searchParams);
                                                                }}
                                                                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all whitespace-nowrap ${selectedCategory === sub.slug ? 'text-brand font-bold bg-brand/5' : 'text-neutral-500 hover:text-brand hover:bg-neutral-50'}`}
                                                            >
                                                                {sub.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>

                        {activeBrands.length > 0 && (
                            <div className="pt-8 border-t border-neutral-100">
                                <h3 className="text-base font-bold text-neutral-900 mb-6 flex items-center">
                                    <Filter className="w-4 h-4 mr-2 text-[#5173FB]" />
                                    Brands
                                </h3>
                                <div className="grid grid-cols-1 gap-1">
                                    {activeBrands.map((brand: any) => (
                                        <button
                                            key={brand.id}
                                            onClick={() => {
                                                searchParams.set('brand', brand.slug);
                                                setSearchParams(searchParams);
                                            }}
                                            className={`w-full text-left px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap ${selectedBrand === brand.slug ? 'bg-brand/10 text-[#5173FB] font-bold' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'}`}
                                        >
                                            {brand.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-8 border-t border-neutral-100">
                            <div className="flex justify-between items-center mb-6 gap-4">
                                <h3 className="text-base font-bold text-neutral-900 whitespace-nowrap">Price Range</h3>
                                <span className="text-xs font-bold text-brand px-2 py-1 bg-brand/10 rounded-lg whitespace-nowrap">৳{minPrice} - ৳{maxPrice}</span>
                            </div>
                            <div className="space-y-6">
                                <input
                                    type="range"
                                    min="0"
                                    max={Math.max(25000, maxPrice)}
                                    step="100"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-brand"
                                />
                                <div className="flex justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                                    <span>৳0</span>
                                    <span>৳{Math.max(25000, maxPrice)}</span>
                                </div>

                                {/* Custom Min/Max Inputs */}
                                <div className="flex items-center space-x-2 pt-2">
                                    <div className="relative flex-grow">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">৳</span>
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={minPrice === 0 ? '' : minPrice}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setMinPrice(isNaN(val) ? 0 : val);
                                            }}
                                            className="w-full pl-7 pr-2 py-2.5 text-xs font-semibold bg-neutral-50 border border-neutral-100 rounded-xl focus:outline-none focus:border-[#5173FB] focus:bg-white transition-all text-neutral-800"
                                        />
                                    </div>
                                    <span className="text-neutral-400 text-xs font-bold">—</span>
                                    <div className="relative flex-grow">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">৳</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={maxPrice === 0 ? '' : maxPrice}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setMaxPrice(isNaN(val) ? 0 : val);
                                            }}
                                            className="w-full pl-7 pr-2 py-2.5 text-xs font-semibold bg-neutral-50 border border-neutral-100 rounded-xl focus:outline-none focus:border-[#5173FB] focus:bg-white transition-all text-neutral-800"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-grow space-y-8 min-h-[800px]">
                    <Breadcrumbs items={[
                        { label: 'Products', path: '/products' },
                        ...(searchQuery ? [{ label: `Search Results for "${searchQuery}"` }] : [
                            { label: selectedCategory ? selectedCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All Products', path: selectedCategory ? `/products?category=${selectedCategory}` : '/products' },
                            ...(selectedBrand ? [{ label: brands?.find((b: any) => b.slug === selectedBrand)?.name || 'Brand' }] : [])
                        ])
                    ]} />

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 lg:p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm">
                        <div className="text-sm text-neutral-500 hidden sm:block">
                            Showing <span className="text-neutral-900 font-bold">{filteredProducts?.length || 0}</span> products
                        </div>

                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-2 sm:space-x-4">
                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className="md:hidden flex items-center justify-center bg-neutral-50 px-4 py-2.5 rounded-xl border border-neutral-100 text-neutral-700 hover:bg-neutral-100 transition-colors"
                            >
                                <Filter className="w-4 h-4" />
                            </button>

                            <div className="relative flex-grow sm:flex-grow-0">
                                <button
                                    onClick={() => setIsSortOpen(!isSortOpen)}
                                    className="w-full flex items-center justify-between sm:justify-start space-x-3 text-xs sm:text-sm font-bold text-neutral-700 bg-neutral-50 px-4 sm:px-5 py-2.5 rounded-xl border border-neutral-100 hover:bg-neutral-100 transition-colors"
                                >
                                    <span className="truncate">Sort: {sortBy === 'newest' ? 'Newest' : sortBy === 'low' ? 'Price Low' : 'Price High'}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${isSortOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {isSortOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-neutral-100 shadow-2xl z-50 p-2 overflow-hidden"
                                        >
                                            {[
                                                { id: 'newest', label: 'Newest Arrivals' },
                                                { id: 'low', label: 'Price: Low to High' },
                                                { id: 'high', label: 'Price: High to Low' },
                                            ].map((option) => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => {
                                                        setSortBy(option.id);
                                                        setIsSortOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${sortBy === option.id ? 'bg-brand/10 text-[#5173FB]' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'}`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex border border-neutral-200 rounded-xl overflow-hidden shadow-sm bg-white p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-brand text-white shadow-lg' : 'text-neutral-400 hover:bg-neutral-50'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-brand text-white shadow-lg' : 'text-neutral-400 hover:bg-neutral-50'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <ProductSkeleton key={i} />
                            ))}
                        </div>
                    ) : filteredProducts?.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <SlidersHorizontal className="w-12 h-12 text-neutral-200 mx-auto" />
                            <h3 className="text-xl font-bold text-neutral-900">No products found</h3>
                            <p className="text-neutral-500">Try adjusting your filters or search query.</p>
                            <button
                                onClick={() => {
                                    setSearchParams({});
                                    setMinPrice(0);
                                    setMaxPrice(25000);
                                }}
                                className="text-[#5173FB] font-bold hover:underline"
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4" : "space-y-4"}>
                            {paginatedProducts?.map((product: any) => (
                                <div key={product.id}>
                                    {viewMode === 'grid' ? (
                                        <ProductCard product={product} />
                                    ) : (
                                        <div className={`group bg-white rounded-2xl border border-neutral-100 p-4 flex flex-col sm:flex-row gap-6 hover:shadow-xl transition-all duration-300 relative ${!(product.stock && product.stock > 0) ? 'opacity-75' : ''}`}>
                                            {/* Image Section */}
                                            <Link to={`/product/${product.slug}`} className="w-full sm:w-64 h-64 flex-shrink-0 relative overflow-hidden rounded-xl bg-neutral-50 border border-neutral-50">
                                                <img
                                                    src={resolveImageUrl(product.image)}
                                                    className={`w-full h-full object-cover transition-transform duration-700 ${product.stock && product.stock > 0 ? 'group-hover:scale-110' : 'grayscale'}`}
                                                    alt={product.name}
                                                />
                                                {product.sale_price && product.stock && product.stock > 0 && (
                                                    <div className="absolute top-4 left-4 bg-brand text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                                        -{Math.round((1 - parseFloat(product.sale_price) / parseFloat(product.regular_price)) * 100)}%
                                                    </div>
                                                )}
                                            </Link>

                                            {/* Content Section */}
                                            <div className="flex-grow flex flex-col justify-between py-1">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{product.brand_name}</span>
                                                            <Link to={`/product/${product.slug}`}>
                                                                <h3 className="text-xl font-bold text-neutral-900 hover:text-[#5173FB] transition-colors">{product.name}</h3>
                                                            </Link>
                                                            <div className="flex items-center space-x-2 pt-1">
                                                                <div className="flex text-amber-400">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star key={i} className="w-3.5 h-3.5 text-neutral-200" />
                                                                    ))}
                                                                </div>
                                                                <span className="text-[10px] text-neutral-400 font-medium">(0)</span>
                                                            </div>
                                                            {product.stock && product.stock > 0 ? (
                                                                <div className="flex items-center space-x-1.5 text-emerald-500 pt-1">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider">In Stock</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center space-x-1.5 text-rose-500 pt-1">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Out Of Stock</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Wishlist Button */}
                                                        <button className="p-2.5 rounded-full bg-white border border-neutral-100 text-neutral-300 hover:text-[#5173FB] transition-all shadow-sm">
                                                            <Heart className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    {product.stock && product.stock > 0 ? (
                                                        <div className="flex items-baseline space-x-3">
                                                            <span className="text-3xl font-black text-neutral-900">৳{Math.round(product.sale_price || product.regular_price).toLocaleString()}</span>
                                                            {product.sale_price && (
                                                                <span className="text-sm text-neutral-400 line-through">৳{Math.round(product.regular_price).toLocaleString()}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-baseline space-x-3">
                                                            <span className="text-3xl font-black text-neutral-500">To be announced</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-end space-x-3 pt-6 sm:pt-0">
                                                    <Link
                                                        to={`/product/${product.slug}`}
                                                        className="flex items-center space-x-2 text-neutral-500 hover:text-neutral-900 text-xs font-bold px-4 py-2.5 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-all"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        <span>Details</span>
                                                    </Link>
                                                    {product.stock && product.stock > 0 ? (
                                                        <button
                                                            onClick={() => {
                                                                addToCart(product, 1);
                                                                setIsCartOpen(true);
                                                            }}
                                                            className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-brand/10 flex items-center space-x-2 active:scale-95"
                                                        >
                                                            <ShoppingCart className="w-4 h-4" />
                                                            <span>Add to Cart</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            disabled
                                                            className="bg-neutral-200 text-neutral-400 cursor-not-allowed text-xs font-bold px-6 py-3 rounded-xl transition-all flex items-center space-x-2"
                                                        >
                                                            <ShoppingCart className="w-4 h-4" />
                                                            <span>Out Of Stock</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2 pt-10">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-xl border border-neutral-100 text-sm font-bold text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>

                            {getPageNumbers().map((page, index) => (
                                page === '...' ? (
                                    <span key={`ellipsis-${index}`} className="w-10 h-10 flex items-center justify-center text-neutral-500 font-bold">
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page as number)}
                                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === page ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-neutral-500 hover:bg-neutral-50'}`}
                                    >
                                        {page}
                                    </button>
                                )
                            ))}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-xl border border-neutral-100 text-sm font-bold text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </main>
            </div>


            {/* Mobile Filter Drawer */}
            <AnimatePresence>
                {isFilterOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFilterOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] md:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-full max-w-[320px] bg-white z-[101] md:hidden shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                                <h3 className="text-xl font-black text-neutral-900">Filters</h3>
                                <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-neutral-50 rounded-lg">
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-6 space-y-10">
                                {/* Categories */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400">Categories</h4>
                                    <div className="space-y-1">
                                        {parentCategories.map((cat: any) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => {
                                                    searchParams.set('category', cat.slug);
                                                    setSearchParams(searchParams);
                                                    setIsFilterOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat.slug ? 'bg-brand/10 text-[#5173FB]' : 'text-neutral-500'}`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Brands */}
                                {activeBrands.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400">Brands</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {activeBrands.map((brand: any) => (
                                                <button
                                                    key={brand.id}
                                                    onClick={() => {
                                                        searchParams.set('brand', brand.slug);
                                                        setSearchParams(searchParams);
                                                        setIsFilterOpen(false);
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedBrand === brand.slug ? 'border-[#5173FB] bg-brand/10 text-[#5173FB]' : 'border-neutral-100 text-neutral-500'}`}
                                                >
                                                    {brand.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Price */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400">Price Range</h4>
                                    <div className="space-y-6">
                                        <input
                                            type="range"
                                            min="0"
                                            max={Math.max(25000, maxPrice)}
                                            step="100"
                                            value={maxPrice}
                                            onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-brand"
                                        />
                                        <div className="flex justify-between text-xs font-bold text-neutral-900">
                                            <span>৳0</span>
                                            <span className="text-[#5173FB]">৳{maxPrice}</span>
                                        </div>

                                        {/* Custom Min/Max Inputs */}
                                        <div className="flex items-center space-x-2">
                                            <div className="relative flex-grow">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">৳</span>
                                                <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={minPrice === 0 ? '' : minPrice}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        setMinPrice(isNaN(val) ? 0 : val);
                                                    }}
                                                    className="w-full pl-7 pr-2 py-2.5 text-xs font-semibold bg-neutral-50 border border-neutral-100 rounded-xl focus:outline-none focus:border-[#5173FB] focus:bg-white transition-all text-neutral-800"
                                                />
                                            </div>
                                            <span className="text-neutral-400 text-xs font-bold">—</span>
                                            <div className="relative flex-grow">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">৳</span>
                                                <input
                                                    type="number"
                                                    placeholder="Max"
                                                    value={maxPrice === 0 ? '' : maxPrice}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        setMaxPrice(isNaN(val) ? 0 : val);
                                                    }}
                                                    className="w-full pl-7 pr-2 py-2.5 text-xs font-semibold bg-neutral-50 border border-neutral-100 rounded-xl focus:outline-none focus:border-[#5173FB] focus:bg-white transition-all text-neutral-800"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-neutral-100 grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setSearchParams({});
                                        setMinPrice(0);
                                        setMaxPrice(25000);
                                        setIsFilterOpen(false);
                                    }}
                                    className="py-4 rounded-2xl border-2 border-neutral-100 font-bold text-sm text-neutral-500"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="py-4 rounded-2xl bg-brand text-white font-bold text-sm shadow-xl shadow-red-700/20"
                                >
                                    Show Results
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Shop;
