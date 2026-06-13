import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { Calendar, User, Eye, ChevronLeft, Share2, Sparkles, BookOpen } from 'lucide-react';
import { resolveImageUrl } from '../utils/image';
import SEO from '../components/SEO';
import { useSettings } from '../context/SettingsContext';

const BlogDetail = () => {
  const { siteTitle } = useSettings();
  const { slug } = useParams();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => api.get(`blog-posts/${slug}/`).then(res => res.data)
  });

  // Smooth scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        url: window.location.href,
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Article link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6]">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-zinc-100 border-t-brand rounded-full animate-spin"></div>
          <div className="absolute w-8 h-8 border border-neutral-100 rounded-full bg-brand/5 animate-ping"></div>
        </div>
        <p className="text-zinc-400 font-black uppercase tracking-widest text-[10px] mt-6">Loading Article...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] px-6 text-center">
        <h2 className="text-3xl font-black text-zinc-900 mb-4 tracking-tight uppercase">Article Not Found</h2>
        <p className="text-zinc-500 text-xs mb-8 max-w-xs leading-relaxed">The article you are looking for might have been removed or is temporarily unavailable.</p>
        <Link to="/blogs" className="px-8 py-3.5 bg-zinc-900 text-white hover:bg-brand rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-zinc-950/10 hover:shadow-brand/20 transition-all duration-300">
          Back to Journal
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-32 font-sans selection:bg-brand/10 selection:text-brand overflow-x-hidden">
      <SEO 
        title={post.title} 
        description={post.summary || post.content?.replace(/<[^>]*>?/gm, '').slice(0, 160)}
        image={post.image}
        type="article"
        schema={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": post.title,
          "image": post.image ? resolveImageUrl(post.image) : '',
          "datePublished": post.created_at,
          "author": {
            "@type": "Organization",
            "name": siteTitle
          },
          "description": post.summary || post.content?.replace(/<[^>]*>?/gm, '').slice(0, 160)
        }}
      />
      
      {/* 1. Elegant Header Navigation Bar */}
      <div className="max-w-4xl mx-auto px-6 py-8 md:py-10 flex items-center justify-between border-b border-zinc-200/50">
        <Link 
          to="/blogs" 
          className="group flex items-center space-x-3 text-zinc-500 hover:text-brand transition-all"
        >
          <div className="w-9 h-9 rounded-full bg-white border border-zinc-100 flex items-center justify-center group-hover:bg-brand/5 group-hover:border-brand/15 transition-all">
            <ChevronLeft size={16} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest">Blogs list</span>
        </Link>
        
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-white text-brand text-xs font-black uppercase tracking-widest rounded-full border border-orange-100 shadow-sm flex items-center gap-1">
            <BookOpen size={10} /> {post.category_name || 'Lifestyle'}
          </span>
        </div>
      </div>

      {/* 2. Title Section */}
      <div className="max-w-6xl mx-auto px-6 mt-12 md:mt-20 text-center">
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl md:text-3xl lg:text-4xl font-black text-zinc-900 leading-[1.1] tracking-tighter mb-8 break-words uppercase"
        >
          {post.title}
        </motion.p>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center space-x-6 text-[9px] font-black text-zinc-400 uppercase tracking-widest pb-10 border-b border-zinc-200/40"
        >
          <div className="flex items-center space-x-1.5">
            <Calendar size={12} className="text-brand" />
            <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <span className="w-1.5 h-1.5 bg-zinc-200 rounded-full"></span>
          <div className="flex items-center space-x-1.5">
            <Eye size={12} className="text-brand" />
            <span>{post.views || 0} Reads</span>
          </div>
        </motion.div>
      </div>

      {/* 3. Featured Image Frame with Elevated Shadow */}
      <div className="max-w-5xl mx-auto px-6 pt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative aspect-[16/9] md:aspect-[2.2/1] rounded-[2.5rem] overflow-hidden"
        >
          {post.image && (
            <img 
              src={resolveImageUrl(post.image)} 
              alt={post.title} 
              className="w-full h-full object-contain"
            />
          )}
        </motion.div>
      </div>

      {/* 4. Article Content with Curated Luxury Typography */}
      <div className="max-w-6xl mx-auto px-6 pt-12 md:pt-16">
        <article className="bg-white p-8 md:p-12 rounded-[2.5rem]">
          <div 
            className="blog-main-article text-zinc-700 leading-[1.8] text-[15px] md:text-[17px] font-medium"
            dangerouslySetInnerHTML={{ 
              __html: (post.content || '').replace(/&nbsp;/g, ' ') 
            }}
          />
        </article>

        {/* 5. Author Card & Share Actions */}
        <div className="mt-16 pt-12 border-t border-zinc-200/50 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex items-center space-x-6">
            <button 
              onClick={handleShare}
              className="flex items-center space-x-2 text-zinc-400 hover:text-brand transition-all group px-4 py-2 bg-white rounded-full border border-zinc-100 shadow-sm"
            >
              <Share2 size={13} className="group-hover:scale-110 transition-transform text-brand" />
              <span className="text-[9px] font-black uppercase tracking-widest">Share story</span>
            </button>
          </div>
          <div className="flex items-center space-x-4 bg-white px-6 py-4 rounded-3xl border border-zinc-100 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-brand/5 overflow-hidden flex items-center justify-center border border-brand/10">
              <User size={18} className="text-brand" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Published by</span>
              <span className="text-xs font-black text-zinc-900 leading-none">{siteTitle} Editorial</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .blog-main-article p {
          margin-bottom: 2rem;
          color: #4b5563;
        }
        .blog-main-article h2, .blog-main-article h3 {
          font-weight: 900;
          color: #18181b;
          margin-top: 3.5rem;
          margin-bottom: 1.5rem;
          letter-spacing: -0.04em;
          line-height: 1.2;
          text-transform: uppercase;
        }
        .blog-main-article h2 { font-size: 1.8rem; border-left: 3px solid #5173FB; padding-left: 1rem; }
        .blog-main-article h3 { font-size: 1.4rem; }

        .blog-main-article blockquote {
          position: relative;
          padding: 2.5rem 2rem;
          margin: 3.5rem 0;
          border-left: 4px solid #5173FB;
          background: #FAF9F6;
          border-radius: 0 2rem 2rem 0;
          font-style: italic;
          color: #18181b;
          font-weight: 700;
          font-size: 1.1rem;
        }
        .blog-main-article blockquote p {
          margin-bottom: 0;
          color: #18181b;
        }
        
        .blog-main-article img {
          border-radius: 2rem;
          margin: 3.5rem auto;
          max-width: 100%;
          height: auto;
          display: block;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
        }

        .blog-main-article ul {
          list-style-type: disc !important;
          margin: 2.5rem 0;
          padding-left: 2.5rem;
        }
        .blog-main-article ol {
          list-style-type: decimal !important;
          margin: 2.5rem 0;
          padding-left: 2.5rem;
        }
        .blog-main-article li {
          margin-bottom: 0.75rem;
          list-style: inherit;
        }
        .blog-main-article a {
          color: #5173FB;
          text-decoration: underline;
          text-underline-offset: 4px;
          font-weight: bold;
        }
        /* Reset any ugly inline styles from copy-pasting */
        .blog-main-article span {
          background-color: transparent !important;
          color: inherit !important;
        }
      `}</style>
    </div>
  );
};

export default BlogDetail;
