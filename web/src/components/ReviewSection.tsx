import React, { useRef } from 'react';
import { Star, CheckCircle, ChevronLeft, ChevronRight, ImagePlus, X, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveImageUrl } from '../utils/image';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

interface ReviewImage {
  id: number;
  image: string;
}

interface Review {
  id: number;
  user_name: string;
  user_initial: string;
  rating: number;
  headline: string;
  comment: string;
  is_verified: boolean;
  images: ReviewImage[];
  created_at: string;
}

interface ReviewSectionProps {
  product: {
    id?: number;
    reviews: Review[];
    average_rating: number;
    rating_count: number;
    rating_breakdown: Record<string, number>;
  };
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ product }) => {
  const { 
    reviews = [], 
    average_rating = 0, 
    rating_count = 0, 
    rating_breakdown = {} 
  } = product || {};

  const { user } = useAuth();
  const [showForm, setShowForm] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [headline, setHeadline] = React.useState('');
  const [comment, setComment] = React.useState('');
  const [images, setImages] = React.useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitMessage, setSubmitMessage] = React.useState({ type: '', text: '' });
  
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product?.id) return;
    setIsSubmitting(true);
    setSubmitMessage({ type: '', text: '' });
    
    try {
      const formData = new FormData();
      formData.append('product', product.id.toString());
      formData.append('rating', rating.toString());
      formData.append('headline', headline);
      formData.append('comment', comment);
      
      images.forEach((img) => {
        formData.append('images', img);
      });

      await api.post('reviews/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmitMessage({ type: 'success', text: 'Thank you! Your review has been submitted.' });
      setTimeout(() => {
        setShowForm(false);
        setSubmitMessage({ type: '', text: '' });
        setRating(5);
        setHeadline('');
        setComment('');
        setImages([]);
        window.location.reload();
      }, 1500);
    } catch (err) {
      setSubmitMessage({ type: 'error', text: 'Failed to submit review. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
      {/* Summary Section */}
      <div className="bg-white border border-neutral-100 rounded-3xl p-6 lg:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-4 text-center space-y-2 py-2 md:border-r border-neutral-100 flex flex-col items-center justify-center">
          <div className="text-5xl font-black text-neutral-900 leading-none tracking-tighter">
            {(average_rating || 0).toFixed(1)}
          </div>
          <div className="flex justify-center mt-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-4 h-4 ${i < Math.round(average_rating) ? 'fill-brand text-brand' : 'text-neutral-200'}`} 
              />
            ))}
          </div>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Based on {rating_count} reviews</p>
        </div>

        <div className="md:col-span-8 space-y-2.5 w-full max-w-lg md:px-6">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center space-x-3">
              <div className="flex space-x-0.5 w-16">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-2.5 h-2.5 ${i < rating ? 'fill-neutral-300 text-neutral-300' : 'text-neutral-100'}`} 
                  />
                ))}
              </div>
              <div className="flex-grow h-1.5 bg-neutral-50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(rating_breakdown?.[rating.toString()] || 0)}%` }}
                  className="h-full bg-brand rounded-full"
                />
              </div>
              <span className="text-[10px] font-black text-neutral-400 w-6">{Math.round(rating_breakdown?.[rating.toString()] || 0)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Form Toggle */}
      <div className="flex justify-start">
        {!showForm && (
          user ? (
            <button 
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-brand hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-brand/10"
            >
              Write a Review
            </button>
          ) : (
            <p className="text-sm text-neutral-500 italic">Please log in to write a review.</p>
          )
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }} 
          className="bg-neutral-50 rounded-2xl p-8 border border-neutral-200"
        >
          <h3 className="text-xl font-bold text-neutral-900 mb-6">Write your review</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2">Overall Rating</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star className={`w-8 h-8 ${rating >= star ? 'fill-brand text-brand' : 'text-neutral-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2">Your Review</label>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like or dislike?"
                rows={4}
                required
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2">Add Photos (Optional)</label>
              <div className="flex flex-wrap gap-4 items-center">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-neutral-200 group">
                    <img src={URL.createObjectURL(img)} alt={`preview ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:border-brand hover:bg-brand/5/50 transition-colors text-neutral-500 hover:text-brand">
                  <ImagePlus className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files);
                        setImages([...images, ...newFiles]);
                      }
                    }} 
                  />
                </label>
              </div>
            </div>

            {submitMessage.text && (
              <div className={`p-4 rounded-xl text-sm font-bold ${submitMessage.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {submitMessage.text}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 text-neutral-500 font-bold hover:text-neutral-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-brand text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Reviews List */}
      <div className="relative">
        {reviews.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-neutral-400 font-medium italic">No reviews yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide space-x-6 pb-8 pt-4 px-2 -mx-2"
          >
            {reviews.map((review) => (
              <motion.div 
                key={review.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="w-full sm:w-[320px] shrink-0 snap-start bg-white border border-neutral-100 rounded-2xl p-4 space-y-3 hover:shadow-xl hover:shadow-red-700/5 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {review.user_initial}
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm">{review.user_name}</h4>
                      {review.is_verified && (
                        <div className="flex items-center space-x-1 text-[#22c55e]">
                          <CheckCircle className="w-2.5 h-2.5 fill-current text-white bg-[#22c55e] rounded-full" />
                          <span className="text-[9px] font-black uppercase tracking-tighter">Verified Buyer</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-neutral-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3 h-3 ${i < review.rating ? 'fill-brand text-brand' : 'text-neutral-100'}`} 
                      />
                    ))}
                  </div>
                  {review.headline && (
                    <h5 className="font-bold text-neutral-900 text-sm">{review.headline}</h5>
                  )}
                  <p className="text-neutral-500 text-sm leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all">
                    {review.comment}
                  </p>
                </div>

                {review.images && review.images.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {review.images.map((img) => (
                      <div 
                        key={img.id} 
                        className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-100 shadow-sm hover:scale-110 transition-transform cursor-zoom-in group/img relative"
                        onClick={() => setSelectedImage(resolveImageUrl(img.image))}
                      >
                        <img src={resolveImageUrl(img.image)} alt="Review" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Navigation buttons for slider */}
        {reviews.length > 1 && (
            <>
              <button 
                onClick={() => scroll('left')}
                className="absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border border-neutral-100 rounded-full flex items-center justify-center shadow-lg hover:bg-neutral-900 hover:text-white transition-all z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => scroll('right')}
                className="absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border border-neutral-100 rounded-full flex items-center justify-center shadow-lg hover:bg-neutral-900 hover:text-white transition-all z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
        )}
      </div>

      {/* Image Full View Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-10"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-full flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 md:-right-12 text-white hover:text-neutral-300 transition-colors p-2"
              >
                <X className="w-8 h-8" />
              </button>
              <img 
                src={selectedImage} 
                alt="Full View" 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewSection;
