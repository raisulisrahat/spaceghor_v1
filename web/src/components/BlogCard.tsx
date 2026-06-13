import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { resolveImageUrl } from '../utils/image';

interface BlogCardProps {
  post: {
    id: number;
    title: string;
    slug: string;
    category_name: string;
    content: string;
    image: string;
    created_at: string;
    views: number;
  };
}

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  const date = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group flex flex-col h-full bg-white border border-zinc-100 rounded-3xl overflow-hidden hover:border-brand/20 hover:shadow-[0_20px_40px_rgba(81, 115, 251,0.06)] transition-all duration-500 relative"
    >
      <Link to={`/blog/${post.slug}`} className="relative aspect-[16/10] overflow-hidden bg-zinc-50 block">
        <img 
          src={resolveImageUrl(post.image)} 
          alt={post.title} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 bg-white/80 backdrop-blur-md text-brand text-[9px] font-black uppercase tracking-widest rounded-full border border-brand/10 shadow-sm">
            {post.category_name}
          </span>
        </div>
      </Link>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-3">
          <span>{date}</span>
          <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
          <span>{post.views || 0} Reads</span>
        </div>

        <h3 className="text-sm md:text-base font-black text-zinc-900 group-hover:text-brand transition-colors line-clamp-2 leading-snug mb-3 tracking-tight">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>

        <p className="text-[11px] md:text-xs text-zinc-500 line-clamp-2 leading-relaxed flex-grow opacity-90 group-hover:opacity-100 transition-opacity">
          {post.content
            .replace(/<[^>]*>/g, '') // Strip tags
            .replace(/&nbsp;/g, ' ') // Replace nbsp
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .substring(0, 95)}...
        </p>

        <div className="pt-4 mt-5 border-t border-zinc-50 flex items-center justify-between">
          <Link 
            to={`/blog/${post.slug}`} 
            className="text-[9px] font-black uppercase tracking-widest text-zinc-900 group-hover:text-brand flex items-center gap-1 transition-all"
          >
            Read Story <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default BlogCard;
