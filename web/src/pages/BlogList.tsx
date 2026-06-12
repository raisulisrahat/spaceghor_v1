import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { motion } from 'framer-motion';
import BlogCard from '../components/BlogCard';
import { Search, ArrowRight, Eye, Calendar, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';
import { resolveImageUrl } from '../utils/image';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const BlogList = () => {
  const { siteTitle } = useSettings();
  const [selectedCategory, setSelectedCategory] = React.useState<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 16;

  const { data: blogs, isLoading } = useQuery({
    queryKey: ['blogs'],
    queryFn: () => api.get('blog-posts/').then(res => res.data)
  });

  const { data: categories } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: () => api.get('blog-categories/').then(res => res.data)
  });

  const filteredBlogs = blogs?.filter((post: any) => {
    const matchesCategory = selectedCategory ? post.category === selectedCategory : true;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Reset page when category or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const totalPages = filteredBlogs ? Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE) : 0;

  // Show Featured Story only on page 1 and when no category/search filter is active
  const showFeatured = !selectedCategory && !searchQuery && currentPage === 1;
  const featuredPost = showFeatured && filteredBlogs && filteredBlogs.length > 0 ? filteredBlogs[0] : null;

  let gridPosts = [];
  if (filteredBlogs) {
    if (showFeatured) {
      // Page 1 with Featured Post: show featured + 15 grid posts
      gridPosts = filteredBlogs.slice(1, 16);
    } else {
      // Other pages or when filters are active: show 16 grid posts
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      gridPosts = filteredBlogs.slice(start, end);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-2 border-[#5173FB] border-t-transparent rounded-full"></div>
          <div className="absolute w-6 h-6 border border-neutral-100 rounded-full bg-brand/5 animate-ping"></div>
        </div>
        <p className="text-[10px] uppercase tracking-widest font-black text-neutral-400 mt-6 animate-pulse">Loading Journal...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-24">
      <SEO 
        title="Journal & Insights" 
        description={`Explore articles on modest lifestyle, fashion trends, styling secrets, and updates directly from the ${siteTitle} editorial team.`}
      />

      {/* Hero Header with Organic Warm Gradient Background */}
      <div className="relative overflow-hidden bg-gradient-to-tr from-amber-50/50 via-rose-50/20 to-orange-50/30 border-b border-neutral-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(81, 115, 251,0.05),transparent_50%)]"></div>
        <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/70 backdrop-blur-md rounded-full border border-orange-100 shadow-sm mb-6"
          >
            <Sparkles size={10} className="text-[#5173FB] animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#5173FB]">{siteTitle} Journal</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl md:text-6xl font-black text-neutral-900 tracking-tighter mb-6 uppercase leading-none"
          >
            Insights <span className="text-[#5173FB]">&</span> Stories
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-[12px] md:text-sm text-neutral-500 max-w-xl mx-auto font-medium leading-relaxed opacity-90"
          >
            Explore articles on modest lifestyle, fashion trends, styling guides, and updates directly from the {siteTitle} editorial team.
          </motion.p>
        </div>
      </div>

      {/* Toolbar / Sticky Filter Bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-100 shadow-sm shadow-neutral-900/5">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${!selectedCategory ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm' : 'bg-transparent text-neutral-400 border-neutral-200 hover:text-neutral-900 hover:border-neutral-900'}`}
            >
              All Topics
            </button>
            {categories?.map((cat: any) => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategory === cat.id ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm' : 'bg-transparent text-neutral-400 border-neutral-200 hover:text-neutral-900 hover:border-neutral-900'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50/50 border border-neutral-200 rounded-full text-[11px] font-medium focus:ring-1 focus:ring-[#5173FB]/20 focus:border-[#5173FB] focus:bg-white outline-none transition-all placeholder:text-neutral-400"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-[1200px] mx-auto px-6 py-12 md:py-16">
        
        {/* Featured Story - Elevated Split Layout */}
        {featuredPost && !selectedCategory && !searchQuery && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 bg-white border border-neutral-100 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.02)] group hover:shadow-[0_25px_60px_rgba(81, 115, 251,0.04)] hover:border-[#5173FB]/10 transition-all duration-500"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Left Column: Image with premium hover zoom */}
              <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto min-h-[300px] lg:min-h-[480px] overflow-hidden bg-neutral-50">
                <Link to={`/blog/${featuredPost.slug}`}>
                  <img 
                    src={resolveImageUrl(featuredPost.image)} 
                    alt={featuredPost.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"></div>
                  <div className="absolute top-6 left-6 z-10">
                    <span className="px-4 py-1.5 bg-white/90 backdrop-blur-sm text-[#5173FB] text-[9px] font-black uppercase tracking-widest rounded-full border border-orange-100 shadow-sm">
                      Featured Story
                    </span>
                  </div>
                </Link>
              </div>

              {/* Right Column: Text content & details */}
              <div className="lg:col-span-5 p-8 md:p-12 lg:p-14 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-4">
                  <span>{new Date(featuredPost.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="w-1.5 h-1.5 bg-neutral-200 rounded-full"></span>
                  <span>{featuredPost.views || 0} Reads</span>
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-neutral-900 tracking-tight leading-tight mb-4 group-hover:text-[#5173FB] transition-colors duration-300">
                  <Link to={`/blog/${featuredPost.slug}`}>
                    {featuredPost.title}
                  </Link>
                </h2>

                <p className="text-[12px] md:text-sm text-neutral-500 leading-relaxed mb-8 opacity-90 group-hover:opacity-100 transition-opacity">
                  {featuredPost.content
                    .replace(/<[^>]*>/g, '') // Strip tags
                    .replace(/&nbsp;/g, ' ') // Replace nbsp
                    .substring(0, 180)}...
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-neutral-50">
                  <Link 
                    to={`/blog/${featuredPost.slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand shadow-lg shadow-neutral-950/10 hover:shadow-[#5173FB]/20 active:scale-95 transition-all duration-300"
                  >
                    Read Full Story <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <span className="px-3 py-1 bg-neutral-55 text-neutral-400 border border-neutral-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                    {featuredPost.category_name}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Regular Blog Grid */}
        <div className="space-y-8">
          {featuredPost && !selectedCategory && !searchQuery && (
            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-6">Latest Updates</h3>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-8">
            {gridPosts?.map((post: any) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* Gorgeous Premium Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-16 pt-8 border-t border-neutral-200/50">
            {/* Previous Button */}
            <button
              onClick={() => {
                setCurrentPage(prev => Math.max(prev - 1, 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
              className="p-2.5 rounded-full bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-500 hover:text-neutral-900 disabled:opacity-40 disabled:hover:border-neutral-200 disabled:hover:text-neutral-500 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-9 h-9 rounded-full text-xs font-black transition-all flex items-center justify-center cursor-pointer ${isActive ? 'bg-neutral-900 text-white shadow-md shadow-neutral-950/15' : 'bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-600 hover:text-neutral-900'}`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => {
                setCurrentPage(prev => Math.min(prev + 1, totalPages));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-full bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-500 hover:text-neutral-900 disabled:opacity-40 disabled:hover:border-neutral-200 disabled:hover:text-neutral-500 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {filteredBlogs?.length === 0 && (
          <div className="py-24 text-center bg-white border border-neutral-100 rounded-[2.5rem] p-8 shadow-sm">
            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6 text-neutral-300">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-neutral-900 mb-2 uppercase tracking-tight">No stories found</h3>
            <p className="text-neutral-500 text-xs max-w-xs mx-auto leading-relaxed">We couldn't find any articles matching your search criteria. Try modifying filters or search query.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default BlogList;
