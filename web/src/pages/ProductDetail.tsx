import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Heart, Share2, ShieldCheck, Truck, RefreshCcw, Star, ChevronLeft, ChevronRight, Zap, CheckCircle2, ZoomIn, ZoomOut, X, Play } from 'lucide-react';
import { getProductBySlug, getProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import ReviewSection from '../components/ReviewSection';
import Breadcrumbs from '../components/Breadcrumbs';
import { resolveImageUrl } from '../utils/image';
import VideoPlayer from '../components/VideoPlayer';
import SEO from '../components/SEO';

const ProductDetail = () => {
    const { addToCart, setIsCartOpen } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist, wishlist } = useWishlist();
    const { isAuthenticated } = useAuth();
    const { siteTitle } = useSettings();
    const navigate = useNavigate();

    const { slug } = useParams<{ slug: string }>();
    const [quantity, setQuantity] = useState(1);
    const inlineActionsRef = useRef<HTMLDivElement>(null);
    const [showStickyBar, setShowStickyBar] = useState(true);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowStickyBar(!entry.isIntersecting);
            },
            { threshold: 0 }
        );

        if (inlineActionsRef.current) {
            observer.observe(inlineActionsRef.current);
        }

        return () => {
            if (inlineActionsRef.current) {
                observer.unobserve(inlineActionsRef.current);
            }
        };
    }, []);
    const [activeImage, setActiveImage] = useState(0);
    const [activeTab, setActiveTab] = useState('description');
    const [selectedColor, setSelectedColor] = useState<any>(null);
    const [selectedSize, setSelectedSize] = useState<any>(null);
    const [isDescExpanded, setIsDescExpanded] = useState(true);
    const [isSpecsExpanded, setIsSpecsExpanded] = useState(false);
    const [isAdditionalExpanded, setIsAdditionalExpanded] = useState(false);

    // States for Image Zoom and Lightbox
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxScale, setLightboxScale] = useState(1);
    const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center' });
    const [isHovered, setIsHovered] = useState(false);

    // Lock body scroll when lightbox is open
    useEffect(() => {
        if (isLightboxOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isLightboxOpen]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomStyle({ transformOrigin: `${x}% ${y}%` });
    };

    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', slug],
        queryFn: () => getProductBySlug(slug!).then(res => res.data),
        enabled: !!slug
    });

    const availableColors = useMemo(() => {
        if (!product) return [];
        const colors = [...(product.colors || [])];
        product.images?.forEach((img: any) => {
            if (img.color_details && !colors.find(c => c.id === img.color_details.id)) {
                colors.push(img.color_details);
            }
        });
        return colors;
    }, [product]);

    useEffect(() => {
        if (product) {
            if (!selectedColor && availableColors.length > 0) {
                setSelectedColor(availableColors[0]);
            }
            if (!selectedSize && product.sizes?.length > 0) {
                setSelectedSize(product.sizes[0]);
            }
        }
    }, [product, availableColors]);
    const { data: relatedProducts } = useQuery({
        queryKey: ['related-products', product?.categories?.[0]?.id],
        queryFn: () => getProducts({ categories: product?.categories?.[0]?.id }).then(res => res.data),
        enabled: !!product?.categories?.[0]?.id
    });

    const isCarousel = (relatedProducts?.length || 0) >= 5;

    useEffect(() => {
        const scrollContainer = document.getElementById('related-products-scroll');
        if (!scrollContainer || !relatedProducts?.length || !isCarousel) return;

        const interval = setInterval(() => {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
            if (scrollLeft + clientWidth >= scrollWidth - 10) {
                scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                scrollContainer.scrollBy({ left: 240, behavior: 'smooth' });
            }
        }, 3500);

        return () => clearInterval(interval);
    }, [relatedProducts, isCarousel]);

    const gallery = useMemo(() => {
        if (!product) return [];
        const items: any[] = [];

        // Add images
        if (product.images?.length > 0) {
            product.images.forEach((img: any) => items.push({ ...img, type: 'image' }));
        } else if (product.image) {
            items.push({ image: product.image, type: 'image' });
        }

        // Add videos
        if (product.videos?.length > 0) {
            product.videos.forEach((vid: any) => items.push({ ...vid, type: 'video' }));
        }

        return items;
    }, [product]);

    const videoOptions = useMemo(() => {
        const activeItem = gallery[activeImage];
        if (activeItem?.type === 'video') {
            return {
                autoplay: true,
                controls: true,
                fill: true,
                loop: true,
                muted: false,
                sources: [{
                    src: resolveImageUrl(activeItem.video),
                    type: 'video/mp4'
                }]
            };
        }
        return null;
    }, [gallery, activeImage]);



    if (isLoading) {
        return (
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-pulse">
                {/* Breadcrumbs skeleton */}
                <div className="h-4 bg-neutral-100 rounded w-1/4" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Left: Media gallery skeleton */}
                    <div className="space-y-4">
                        <div className="aspect-square bg-neutral-100 rounded-2xl relative overflow-hidden">
                            <div className="w-full h-full animate-shimmer" />
                        </div>
                        <div className="flex gap-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-20 h-20 bg-neutral-100 rounded-lg relative overflow-hidden">
                                    <div className="w-full h-full animate-shimmer" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Info skeleton */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="h-4 bg-neutral-100 rounded w-1/6 relative overflow-hidden">
                                <div className="w-full h-full animate-shimmer" />
                            </div>
                            <div className="h-8 bg-neutral-100 rounded w-3/4 relative overflow-hidden">
                                <div className="w-full h-full animate-shimmer" />
                            </div>
                            <div className="h-6 bg-neutral-100 rounded w-1/2 relative overflow-hidden">
                                <div className="w-full h-full animate-shimmer" />
                            </div>
                        </div>

                        {/* Price & Stock status */}
                        <div className="flex items-center space-x-4">
                            <div className="h-8 bg-neutral-100 rounded w-1/4 relative overflow-hidden">
                                <div className="w-full h-full animate-shimmer" />
                            </div>
                            <div className="h-5 bg-neutral-100 rounded w-20 relative overflow-hidden">
                                <div className="w-full h-full animate-shimmer" />
                            </div>
                        </div>

                        {/* Options: Color & Size */}
                        <div className="space-y-4 border-t border-neutral-100 pt-6">
                            <div className="space-y-2">
                                <div className="h-4 bg-neutral-100 rounded w-20 relative overflow-hidden">
                                    <div className="w-full h-full animate-shimmer" />
                                </div>
                                <div className="flex gap-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-neutral-100 relative overflow-hidden">
                                            <div className="w-full h-full animate-shimmer" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 bg-neutral-100 rounded w-20 relative overflow-hidden">
                                    <div className="w-full h-full animate-shimmer" />
                                </div>
                                <div className="flex gap-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-12 h-8 rounded-lg bg-neutral-100 relative overflow-hidden">
                                            <div className="w-full h-full animate-shimmer" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-3 pt-6 border-t border-neutral-100">
                            <div className="flex gap-4">
                                <div className="h-12 bg-neutral-100 rounded-xl flex-grow relative overflow-hidden">
                                    <div className="w-full h-full animate-shimmer" />
                                </div>
                                <div className="h-12 bg-neutral-100 rounded-xl w-32 relative overflow-hidden">
                                    <div className="w-full h-full animate-shimmer" />
                                </div>
                            </div>
                            <div className="h-12 bg-neutral-100 rounded-xl w-full relative overflow-hidden">
                                <div className="w-full h-full animate-shimmer" />
                            </div>
                        </div>

                        {/* Accordion / Specs */}
                        <div className="space-y-3 pt-6 border-t border-neutral-100">
                            {[1, 2].map(i => (
                                <div key={i} className="h-14 bg-neutral-100 rounded-xl w-full relative overflow-hidden">
                                    <div className="w-full h-full animate-shimmer" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (error || !product) return <div className="p-20 text-center">Product not found. <Link to="/products" className="text-brand font-bold">Return to shop</Link></div>;

    const handleAddToCart = () => {
        addToCart(product, quantity, selectedColor, selectedSize);
    };

    return (
        <div className="pb-20">
            <SEO
                title={product.name}
                description={product.short_description || product.description_html?.replace(/<[^>]*>?/gm, '').slice(0, 160)}
                image={product.image}
                type="product"
                schema={{
                    "@context": "https://schema.org/",
                    "@type": "Product",
                    "name": product.name,
                    "image": resolveImageUrl(product.image),
                    "description": product.short_description || product.description_html?.replace(/<[^>]*>?/gm, '').slice(0, 160),
                    "brand": {
                        "@type": "Brand",
                        "name": product.brand?.name || siteTitle
                    },
                    "offers": {
                        "@type": "Offer",
                        "url": window.location.href,
                        "priceCurrency": "BDT",
                        "price": product.stock && product.stock > 0 ? (product.sale_price || product.regular_price) : "0",
                        "availability": product.stock && product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                    },
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": product.average_rating || "0",
                        "reviewCount": product.rating_count || "0"
                    }
                }}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Breadcrumbs items={[
                    { label: 'Products', path: '/products' },
                    { label: product.categories?.[0]?.name || 'Products', path: product.categories?.[0] ? `/products?category=${product.categories[0].slug}` : '/products' },
                    { label: product.name }
                ]} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20">
                    {/* Gallery */}
                    <div className="lg:col-span-5 space-y-4 lg:space-y-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="aspect-square rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden bg-neutral-50 border border-neutral-100 relative group sm:mx-0 shadow-lg"
                        >
                            {gallery.length > 0 && gallery[activeImage] && (
                                gallery[activeImage].type === 'video' ? (
                                    <div className="w-full h-full bg-black relative group/video cursor-pointer overflow-hidden">
                                        {videoOptions && (
                                            <VideoPlayer
                                                options={videoOptions}
                                                className="w-full h-full"
                                            />
                                        )}

                                        {/* Corner Badges */}
                                        <div className="absolute top-4 left-4 flex items-center gap-2 z-10 pointer-events-none">
                                            <span className="px-3 py-1 bg-red-700 text-white text-[10px] font-black rounded-full shadow-lg shadow-red-700/20 tracking-widest uppercase">Live Demo</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="w-full h-full relative cursor-zoom-in overflow-hidden"
                                        onMouseEnter={() => setIsHovered(true)}
                                        onMouseLeave={() => { setIsHovered(false); setZoomStyle({ transformOrigin: 'center' }); }}
                                        onMouseMove={handleMouseMove}
                                        onClick={() => {
                                            setLightboxScale(1);
                                            setIsLightboxOpen(true);
                                        }}
                                    >
                                        <img
                                            key={activeImage}
                                            src={resolveImageUrl(gallery[activeImage].image)}
                                            className={`w-full h-full object-fill transition-transform duration-200 ${isHovered ? 'scale-150' : 'scale-100'}`}
                                            style={isHovered ? zoomStyle : undefined}
                                            alt={product.name}
                                        />

                                        {/* Zoom Icon Overlay */}
                                        <div className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 z-10">
                                            <ZoomIn className="w-5 h-5 text-neutral-800" />
                                        </div>
                                    </div>
                                )
                            )}

                            {/* Image Navigation Dots (Mobile) */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 lg:hidden">
                                {gallery.map((_: any, i: number) => (
                                    <div
                                        key={i}
                                        className={`h-1.5 rounded-full transition-all ${activeImage === i ? 'w-4 bg-brand' : 'w-1.5 bg-white/50'}`}
                                    />
                                ))}
                            </div>

                            {gallery.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev > 0 ? prev - 1 : gallery.length - 1)); }}
                                        className="absolute top-1/2 left-4 -translate-y-1/2 p-3 bg-white/90 backdrop-blur rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 z-10"
                                    >
                                        <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 text-neutral-900" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev < gallery.length - 1 ? prev + 1 : 0)); }}
                                        className="absolute top-1/2 right-4 -translate-y-1/2 p-3 bg-white/90 backdrop-blur rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 z-10"
                                    >
                                        <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-neutral-900" />
                                    </button>
                                </>
                            )}
                        </motion.div>

                        <div className="relative group/thumbs px-2">
                            <div
                                id="thumb-container"
                                className="flex space-x-3 lg:space-x-4 overflow-x-auto pb-2 scrollbar-hide px-0 snap-x"
                            >
                                {gallery.map((item: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`flex-shrink-0 w-16 h-16 lg:w-24 lg:h-24 rounded-xl lg:rounded-2xl overflow-hidden border-2 transition-all snap-start relative ${activeImage === idx ? 'border-brand scale-95 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    >
                                        {item.type === 'video' ? (
                                            <div className="w-full h-full bg-neutral-900 flex items-center justify-center relative">
                                                {(product.image || product.images?.[0]?.image) && (
                                                    <img
                                                        src={resolveImageUrl(product.image || product.images[0].image)}
                                                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                                                        alt=""
                                                    />
                                                )}
                                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                                                <div className="relative w-8 h-8 rounded-full bg-white/95 text-neutral-900 flex items-center justify-center shadow-lg transition-transform group-hover/thumbs:scale-110">
                                                    <Play className="w-4 h-4 fill-current ml-0.5" />
                                                </div>
                                                <span className="absolute bottom-1 right-1 text-[8px] font-black bg-red-700 text-white px-1.5 py-0.5 rounded shadow">VIDEO</span>
                                            </div>
                                        ) : (
                                            <img src={resolveImageUrl(item.image)} className="w-full h-full object-cover" alt="" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {gallery.length > 4 && (
                                <>
                                    <button
                                        onClick={() => document.getElementById('thumb-container')?.scrollBy({ left: -100, behavior: 'smooth' })}
                                        className="absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white shadow-xl border border-neutral-100 rounded-full flex items-center justify-center opacity-0 group-hover/thumbs:opacity-100 transition-all hover:scale-110 z-10"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => document.getElementById('thumb-container')?.scrollBy({ left: 100, behavior: 'smooth' })}
                                        className="absolute -right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white shadow-xl border border-neutral-100 rounded-full flex items-center justify-center opacity-0 group-hover/thumbs:opacity-100 transition-all hover:scale-110 z-10"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="lg:col-span-7 space-y-5 lg:space-y-6">
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Brand Badge */}
                                {product.brand && (
                                    <Link
                                        to={`/products?brand=${product.brand.slug}`}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100/50 hover:bg-blue-100 transition-all shadow-sm"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">Brand:</span>
                                        <span className="text-xs font-bold">{product.brand.name}</span>
                                    </Link>
                                )}

                                {/* Category Badge */}
                                {product.categories?.[0] && (
                                    <Link
                                        to={`/products?category=${product.categories[0].slug}`}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-600 rounded-full border border-purple-100/50 hover:bg-purple-100 transition-all shadow-sm"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">Category:</span>
                                        <span className="text-xs font-bold">{product.categories[0].name}</span>
                                    </Link>
                                )}
                            </div>

                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1.5">
                                    <h1 className="text-2xl lg:text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                                        {product.name}
                                    </h1>
                                    <div className="flex items-center space-x-3">
                                        <div className="flex text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-3.5 h-3.5 ${i < Math.round(product.average_rating || 0) ? 'fill-current' : 'text-neutral-200'}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-neutral-400 font-medium">{product.average_rating || '0.0'} | {product.rating_count || 0} reviews</span>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={async () => {
                                            if (!isAuthenticated) return navigate('/login');
                                            if (isInWishlist(product.id)) {
                                                const item = wishlist.find(i => i.product.id === product.id);
                                                if (item) await removeFromWishlist(item.id);
                                            } else {
                                                await addToWishlist(product.id);
                                            }
                                        }}
                                        className={`p-3 rounded-xl border transition-all active:scale-95 ${isInWishlist(product.id) ? 'bg-brand/5 border-brand/10 text-brand' : 'bg-white shadow-sm border-neutral-100 text-neutral-400 hover:text-brand hover:border-brand'}`}
                                        title="Add to Wishlist"
                                    >
                                        <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({
                                                    title: product.name,
                                                    url: window.location.href
                                                });
                                            } else {
                                                navigator.clipboard.writeText(window.location.href);
                                                alert('Link copied to clipboard!');
                                            }
                                        }}
                                        className="p-3 bg-white shadow-sm border border-neutral-100 rounded-xl text-neutral-400 hover:text-brand hover:border-brand transition-all active:scale-95"
                                        title="Share Product"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {product.stock && product.stock > 0 ? (
                            <div className="flex items-baseline space-x-4">
                                <span className="text-3xl lg:text-4xl font-black text-brand">
                                    ৳{Math.round(product.sale_price || product.regular_price).toLocaleString()}
                                </span>
                                {product.sale_price && (
                                    <div className="flex items-center space-x-3">
                                        <span className="text-lg lg:text-2xl text-neutral-300 line-through font-medium">
                                            ৳{Math.round(product.regular_price).toLocaleString()}
                                        </span>
                                        <span className="bg-red-700/10 text-red-700 text-[10px] lg:text-xs font-black px-2 lg:px-3 py-1 rounded-md">
                                            -{Math.round(((product.regular_price - product.sale_price) / product.regular_price) * 100)}% OFF
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-baseline space-x-4">
                                <span className="text-3xl lg:text-4xl font-black text-neutral-500">
                                    To be announced
                                </span>
                            </div>
                        )}


                        {/* Colors */}
                        {availableColors.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Color</span>
                                    <span className="text-neutral-900 text-xs font-bold">: {selectedColor?.name || 'Select a variant'}</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {availableColors.map((color: any) => {
                                        const colorImg = product.images?.find((img: any) => img.color === color.id)?.image || product.image;
                                        const isActive = selectedColor?.id === color.id;
                                        return (
                                            <button
                                                key={color.id}
                                                onClick={() => {
                                                    setSelectedColor(color);
                                                    const imgIdx = gallery.findIndex((img: any) => img.color === color.id);
                                                    if (imgIdx !== -1) setActiveImage(imgIdx);
                                                }}
                                                className={`group relative w-12 h-12 lg:w-14 lg:h-14 rounded-xl overflow-hidden border-2 transition-all ${isActive ? 'border-brand shadow-lg ring-2 ring-red-100' : 'border-neutral-100 hover:border-neutral-200'}`}
                                            >
                                                <img src={resolveImageUrl(colorImg)} className="w-full h-full object-cover" alt={color.name} />
                                                {isActive && (
                                                    <div className="absolute top-1 right-1 bg-brand rounded-full p-0.5 shadow-sm">
                                                        <CheckCircle2 className="w-3 h-3 text-white fill-current" />
                                                    </div>
                                                )}
                                                <div className={`absolute inset-0 bg-white/10 transition-opacity ${isActive ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Sizes */}
                        {product.sizes?.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Size</span>
                                    <span className="text-neutral-900 text-xs font-bold">: {selectedSize?.name || 'Select a size'}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {product.sizes.map((size: any) => {
                                        const isActive = selectedSize?.id === size.id;
                                        return (
                                            <button
                                                key={size.id}
                                                onClick={() => setSelectedSize(size)}
                                                className={`min-w-[50px] h-9 flex shadow-sm shadow-red-700/20 items-center justify-center px-3 rounded-lg border-2  font-black text-[10px] uppercase tracking-widest transition-all ${isActive ? 'border-brand bg-brand text-white shadow-lg shadow-red-700/20' : 'border-neutral-100 text-neutral-400 hover:border-neutral-200 bg-neutral-50/50'}`}
                                            >
                                                {size.code}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="space-y-6 pt-10 border-t border-neutral-100 lg:block hidden">
                            <div>
                                <span className="text-sm font-bold text-neutral-400 block mb-4">Quantity</span>
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="flex border-2 border-neutral-100 rounded-xl overflow-hidden h-12 w-28 bg-neutral-50/50">
                                        <button
                                            disabled={!(product.stock && product.stock > 0)}
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className={`flex-1 hover:bg-neutral-100 font-black transition-colors ${!(product.stock && product.stock > 0) ? 'cursor-not-allowed opacity-50' : ''}`}
                                        >
                                            -
                                        </button>
                                        <div className="w-10 flex items-center justify-center font-black text-lg select-none">
                                            {quantity}
                                        </div>
                                        <button
                                            disabled={!(product.stock && product.stock > 0)}
                                            onClick={() => setQuantity(quantity + 1)}
                                            className={`flex-1 hover:bg-neutral-100 font-black transition-colors ${!(product.stock && product.stock > 0) ? 'cursor-not-allowed opacity-50' : ''}`}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-4 flex-grow w-full">
                                        {product.stock && product.stock > 0 ? (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        addToCart(product, quantity, selectedColor, selectedSize);
                                                        setIsCartOpen(true);
                                                    }}
                                                    className="flex-grow bg-brand hover:bg-brand-hover text-white font-black h-12 rounded-2xl shadow-xl shadow-brand/10 transition-all flex items-center justify-center space-x-3 active:scale-95"
                                                >
                                                    <ShoppingCart className="w-6 h-6" />
                                                    <span>Add to Cart</span>
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        addToCart(product, quantity, selectedColor, selectedSize);
                                                        navigate('/checkout');
                                                    }}
                                                    className="flex-grow border-2 border-brand text-brand hover:bg-brand/5 font-black h-12 rounded-2xl transition-all flex items-center justify-center space-x-3 active:scale-95 animate-glow"
                                                >
                                                    <Zap className="w-6 h-6 fill-current" />
                                                    <span>Order Now</span>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    disabled
                                                    className="flex-grow bg-neutral-200 text-neutral-400 cursor-not-allowed font-black h-12 rounded-2xl flex items-center justify-center space-x-3"
                                                >
                                                    <ShoppingCart className="w-6 h-6" />
                                                    <span>Out Of Stock</span>
                                                </button>

                                                <button
                                                    disabled
                                                    className="flex-grow bg-neutral-200 text-neutral-400 cursor-not-allowed font-black h-12 rounded-2xl flex items-center justify-center space-x-3"
                                                >
                                                    <Zap className="w-6 h-6 fill-current" />
                                                    <span>Out Of Stock</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inline Action Bar (Mobile Only) */}
                        <div ref={inlineActionsRef} className="lg:hidden block pt-6 border-t border-neutral-100">
                            <div className="flex items-center gap-2">
                                <div className="flex border-2 border-neutral-100 rounded-xl overflow-hidden h-12 w-24 bg-neutral-50/50 shrink-0">
                                    <button
                                        disabled={!(product.stock && product.stock > 0)}
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className={`flex-1 hover:bg-neutral-100 font-black transition-colors text-sm ${!(product.stock && product.stock > 0) ? 'cursor-not-allowed opacity-50' : ''}`}
                                    >
                                        -
                                    </button>
                                    <div className="w-6 flex items-center justify-center font-black text-xs select-none">
                                        {quantity}
                                    </div>
                                    <button
                                        disabled={!(product.stock && product.stock > 0)}
                                        onClick={() => setQuantity(quantity + 1)}
                                        className={`flex-1 hover:bg-neutral-100 font-black transition-colors text-sm ${!(product.stock && product.stock > 0) ? 'cursor-not-allowed opacity-50' : ''}`}
                                    >
                                        +
                                    </button>
                                </div>

                                {product.stock && product.stock > 0 ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                handleAddToCart();
                                                setIsCartOpen(true);
                                            }}
                                            className="flex-1 bg-white border-2 border-brand text-brand font-black h-12 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                            <span className="text-[10px] uppercase font-bold">Add to Cart</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                handleAddToCart();
                                                navigate('/checkout');
                                            }}
                                            className="flex-1 bg-brand text-white font-black h-12 rounded-xl shadow-lg shadow-red-700/10 active:scale-95 transition-all flex items-center justify-center gap-2 animate-glow font-bold"
                                        >
                                            <Zap className="w-4 h-4 fill-current" />
                                            <span className="text-[10px] uppercase font-bold">Order Now</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            disabled
                                            className="flex-1 bg-neutral-200 text-neutral-400 cursor-not-allowed font-black h-12 rounded-xl flex items-center justify-center gap-2"
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                            <span className="text-[10px] uppercase font-bold">Out Of Stock</span>
                                        </button>

                                        <button
                                            disabled
                                            className="flex-1 bg-neutral-200 text-neutral-400 cursor-not-allowed font-black h-12 rounded-xl flex items-center justify-center gap-2"
                                        >
                                            <Zap className="w-4 h-4 fill-current" />
                                            <span className="text-[10px] uppercase font-bold">Out Of Stock</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-6 pt-6 border-t border-neutral-100">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-brand/5 rounded-lg">
                                    <Truck className="w-4 h-4 text-brand" />
                                </div>
                                <div className="text-[10px]">
                                    <p className="font-bold text-neutral-900 leading-none mb-1">Fast Delivery</p>
                                    <p className="text-neutral-500">2-4 Business days</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-brand/5 rounded-lg">
                                    <RefreshCcw className="w-4 h-4 text-brand" />
                                </div>
                                <div className="text-[10px]">
                                    <p className="font-bold text-neutral-900 leading-none mb-1">Easy Returns</p>
                                    <p className="text-neutral-500">7 days exchange</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technical Features & Specifications */}
                <div className="mt-12 lg:mt-20 space-y-6 lg:space-y-8">
                    {/* Desktop Tabs */}
                    <div className="hidden lg:flex justify-center border-b border-neutral-100 space-x-12 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setActiveTab('description')}
                            className={`pb-6 border-b-2 font-bold transition-all whitespace-nowrap ${activeTab === 'description' ? 'border-red-700 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-900'}`}
                        >
                            Description
                        </button>
                        {product.show_additional_info && (
                            <button
                                onClick={() => setActiveTab('additional')}
                                className={`pb-6 border-b-2 font-bold transition-all whitespace-nowrap ${activeTab === 'additional' ? 'border-red-700 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-900'}`}
                            >
                                Additional Info
                            </button>
                        )}
                        {product.show_specifications !== false && (
                            <button
                                onClick={() => setActiveTab('specs')}
                                className={`pb-6 border-b-2 font-bold transition-all whitespace-nowrap ${activeTab === 'specs' ? 'border-red-700 text-neutral-900' : 'border-transparent text-neutral-400 hover:text-neutral-900'}`}
                            >
                                Specifications
                            </button>
                        )}
                    </div>

                    {/* Mobile Tab Header */}
                    <div className="lg:hidden flex justify-center border-b border-neutral-100 space-x-6 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setActiveTab('description')}
                            className={`pb-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === 'description' ? 'border-brand text-neutral-900' : 'border-transparent text-neutral-400'}`}
                        >
                            Description
                        </button>
                        {product.show_additional_info && (
                            <button
                                onClick={() => setActiveTab('additional')}
                                className={`pb-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === 'additional' ? 'border-brand text-neutral-900' : 'border-transparent text-neutral-400'}`}
                            >
                                Additional
                            </button>
                        )}
                        {product.show_specifications !== false && (
                            <button
                                onClick={() => setActiveTab('specs')}
                                className={`pb-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === 'specs' ? 'border-brand text-neutral-900' : 'border-transparent text-neutral-400'}`}
                            >
                                Specs
                            </button>
                        )}
                    </div>

                    {/* Content for Mobile Tabs */}
                    <div className="lg:hidden">
                        {activeTab === 'description' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 text-sm text-neutral-600 prose prose-neutral max-w-none product-description-content" dangerouslySetInnerHTML={{ __html: product.description_html || '' }} />
                        )}
                        {activeTab === 'additional' && product.show_additional_info && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 text-sm text-neutral-600 prose prose-neutral max-w-none product-description-content" dangerouslySetInnerHTML={{ __html: product.additional_info_html || '' }} />
                        )}
                        {activeTab === 'specs' && product.show_specifications !== false && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 text-sm">
                                <div className="grid grid-cols-1 divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
                                    {product.weight > 0 && (
                                        <div className="grid grid-cols-2 p-3">
                                            <span className="font-bold text-neutral-900">Weight</span>
                                            <span>{product.weight} kg</span>
                                        </div>
                                    )}
                                    {product.specifications && Object.entries(product.specifications).map(([key, value]: [string, any], idx) => (
                                        <div key={key} className={`grid grid-cols-2 p-3 ${idx % 2 === 0 ? 'bg-neutral-50/50' : 'bg-white'}`}>
                                            <span className="font-bold text-neutral-900 capitalize">{key.replace('_', ' ')}</span>
                                            <span>{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="hidden lg:block max-w-4xl mx-auto text-neutral-600 leading-loose prose prose-indigo">
                        {activeTab === 'description' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="product-description-content" dangerouslySetInnerHTML={{ __html: product.description_html || 'Detailed information coming soon...' }} />
                            </div>
                        )}

                        {activeTab === 'additional' && product.show_additional_info && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="product-description-content" dangerouslySetInnerHTML={{ __html: product.additional_info_html || 'No additional info available.' }} />
                            </div>
                        )}

                        {activeTab === 'specs' && product.show_specifications !== false && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                                <div className="grid grid-cols-1 border border-neutral-100 rounded-3xl overflow-hidden divide-y divide-neutral-100">
                                    {product.weight > 0 && (
                                        <div className="grid grid-cols-3 p-6">
                                            <span className="font-bold text-neutral-900">Weight</span>
                                            <span className="col-span-2">{product.weight} kg</span>
                                        </div>
                                    )}
                                    {product.specifications && Object.entries(product.specifications).map(([key, value]: [string, any], idx) => (
                                        <div key={key} className={`grid grid-cols-3 p-6 ${idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}>
                                            <span className="font-bold text-neutral-900 capitalize">{key.replace('_', ' ')}</span>
                                            <span className="col-span-2">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 max-w-4xl overflow-hidden">
                    <ReviewSection product={product} />
                </div>

                <div className="mt-12 border-t border-neutral-100 pt-10 overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl lg:text-2xl font-black text-neutral-900">Related Products</h2>
                        {isCarousel && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => document.getElementById('related-products-scroll')?.scrollBy({ left: -240, behavior: 'smooth' })}
                                    className="p-2 rounded-full border border-neutral-100 hover:bg-neutral-50 transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => document.getElementById('related-products-scroll')?.scrollBy({ left: 240, behavior: 'smooth' })}
                                    className="p-2 rounded-full border border-neutral-100 hover:bg-neutral-50 transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                    <div
                        id="related-products-scroll"
                        className={isCarousel
                            ? "flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x"
                            : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"}
                    >
                        {relatedProducts?.map((p: any) => (
                            <div key={p.id} className={isCarousel ? "min-w-[160px] md:min-w-[200px] lg:min-w-[240px] snap-start" : ""}>
                                <ProductCard product={p} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Bar (Mobile) */}
            {showStickyBar && (
                <div className="lg:hidden fixed bottom-[55px] left-0 right-0 z-50 bg-white border-t border-neutral-100 p-1.5 animate-in slide-in-from-bottom-full duration-500">
                    <div className="flex items-center gap-1.5">
                        {product.stock && product.stock > 0 ? (
                            <>
                                <button
                                    onClick={() => {
                                        handleAddToCart();
                                        setIsCartOpen(true);
                                    }}
                                    className="flex-1 bg-white border-2 border-brand text-brand font-black h-13 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    <span className="text-[10px] uppercase font-bold">Add to Cart</span>
                                </button>

                                <button
                                    onClick={() => {
                                        handleAddToCart();
                                        navigate('/checkout');
                                    }}
                                    className="flex-1 bg-brand text-white font-black h-13 rounded-xl shadow-lg shadow-red-700/10 active:scale-95 transition-all flex items-center justify-center gap-2 animate-glow"
                                >
                                    <Zap className="w-4 h-4 fill-current" />
                                    <span className="text-[10px] uppercase font-bold">Order Now</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    disabled
                                    className="flex-1 bg-neutral-200 text-neutral-400 cursor-not-allowed font-black h-13 rounded-xl flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    <span className="text-[10px] uppercase font-bold">Out Of Stock</span>
                                </button>

                                <button
                                    disabled
                                    className="flex-1 bg-neutral-200 text-neutral-400 cursor-not-allowed font-black h-13 rounded-xl flex items-center justify-center gap-2"
                                >
                                    <Zap className="w-4 h-4 fill-current" />
                                    <span className="text-[10px] uppercase font-bold">Out Of Stock</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Lightbox Modal for Full Image View */}
            {isLightboxOpen && gallery[activeImage] && gallery[activeImage].type === 'image' && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    {/* Top Controls */}
                    <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-[110]" onClick={(e) => e.stopPropagation()}>
                        <div className="text-white/80 font-bold text-xs bg-black/40 px-4 py-2 rounded-full backdrop-blur">
                            {activeImage + 1} / {gallery.filter((g: any) => g.type === 'image').length}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setLightboxScale(prev => Math.min(3, prev + 0.25))}
                                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur active:scale-95 border border-white/10"
                                title="Zoom In"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setLightboxScale(prev => Math.max(1, prev - 0.25))}
                                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur active:scale-95 border border-white/10"
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => { setLightboxScale(1); setIsLightboxOpen(false); }}
                                className="p-2.5 bg-red-600/90 hover:bg-red-600 text-white rounded-full transition-all backdrop-blur active:scale-95 shadow-lg shadow-red-600/20"
                                title="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Main Image Container */}
                    <div
                        className="w-full h-full flex items-center justify-center p-4 overflow-auto cursor-grab active:cursor-grabbing"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <div
                            className="relative max-w-4xl max-h-[85vh] transition-transform duration-200 select-none"
                            style={{ transform: `scale(${lightboxScale})` }}
                            onClick={(e) => {
                                e.stopPropagation();
                                // Toggle zoom on image click
                                setLightboxScale(prev => prev > 1 ? 1 : 2);
                            }}
                        >
                            <img
                                src={resolveImageUrl(gallery[activeImage].image)}
                                className="w-full h-auto max-h-[80vh] rounded-2xl shadow-2xl object-contain border border-white/10"
                                alt={product.name}
                            />
                        </div>
                    </div>

                    {/* Navigation Inside Lightbox */}
                    {gallery.filter((g: any) => g.type === 'image').length > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxScale(1);
                                    setActiveImage(prev => (prev > 0 ? prev - 1 : gallery.length - 1));
                                }}
                                className="absolute left-6 top-1/2 -translate-y-1/2 p-3.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[110] backdrop-blur border border-white/10 active:scale-95"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxScale(1);
                                    setActiveImage(prev => (prev < gallery.length - 1 ? prev + 1 : 0));
                                }}
                                className="absolute right-6 top-1/2 -translate-y-1/2 p-3.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[110] backdrop-blur border border-white/10 active:scale-95"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductDetail;
