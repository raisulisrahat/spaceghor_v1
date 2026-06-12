import { motion } from 'framer-motion';

const ProductSkeleton = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white rounded-xl overflow-hidden border border-neutral-100 flex flex-col h-full shadow-sm"
    >
      {/* Image Container Skeleton */}
      <div className="relative aspect-square m-1.5 rounded-xl bg-neutral-100 overflow-hidden">
        <div className="w-full h-full animate-shimmer" />
      </div>

      {/* Content Skeleton */}
      <div className="px-2 pb-2 flex flex-col flex-grow space-y-2.5 mt-2">
        {/* Title */}
        <div className="h-4 bg-neutral-100 rounded w-5/6 overflow-hidden relative">
          <div className="w-full h-full animate-shimmer" />
        </div>
        
        {/* Categories */}
        <div className="h-3 bg-neutral-100 rounded w-1/2 overflow-hidden relative">
          <div className="w-full h-full animate-shimmer" />
        </div>

        {/* Stock status */}
        <div className="h-3 bg-neutral-100 rounded w-1/3 overflow-hidden relative">
          <div className="w-full h-full animate-shimmer" />
        </div>

        {/* Price */}
        <div className="h-5 bg-neutral-100 rounded w-1/4 overflow-hidden relative mt-1">
          <div className="w-full h-full animate-shimmer" />
        </div>

        {/* Button */}
        <div className="h-8 bg-neutral-100 rounded-lg w-full overflow-hidden relative mt-2">
          <div className="w-full h-full animate-shimmer" />
        </div>
      </div>
    </motion.div>
  );
};

export default ProductSkeleton;
