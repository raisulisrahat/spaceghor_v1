import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, ArrowRight, Clock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { searchProducts, BASE_URL } from '../services/api';

const Searchbar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
   const [history, setHistory] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    const newHistory = [
      searchTerm,
      ...history.filter(item => item !== searchTerm)
    ].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const removeFromHistory = (e: React.MouseEvent, searchTerm: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newHistory = history.filter(item => item !== searchTerm);
    setHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('searchHistory');
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsLoading(true);
        try {
          const response = await searchProducts(query);
          setResults(response.data.slice(0, 6)); // Top 6 results
          setIsOpen(true);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

   const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveToHistory(query.trim());
      navigate(`/products?search=${query}`);
      setIsOpen(false);
    }
  };

  const handleHistoryClick = (searchTerm: string) => {
    setQuery(searchTerm);
    saveToHistory(searchTerm);
    navigate(`/products?search=${searchTerm}`);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-xl mx-auto flex-grow md:px-0">
      <form onSubmit={handleSearch} className="group relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-brand transition-colors">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for premium products..."
          className="block w-full pl-10 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-white transition-all duration-300"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden z-[60]"
          >
            {isLoading ? (
              <div className="p-12 flex flex-col items-center justify-center text-neutral-400">
                <Loader2 className="h-8 w-8 animate-spin mb-3 text-[#5173FB]" />
                <p className="text-sm">Searching our boutique...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                <div className="px-4 py-2 border-b border-neutral-50 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Products Found</span>
                  <Link 
                    to={`/products?search=${query}`} 
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-semibold text-[#5173FB] hover:underline"
                  >
                    View All
                  </Link>
                </div>
                <div className="max-h-[70vh] overflow-y-auto">
                  {results.map((product: any) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.slug}`}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center px-4 py-3 hover:bg-neutral-50 transition-colors group ${!(product.stock && product.stock > 0) ? 'opacity-85' : ''}`}
                    >
                      <div className="h-14 w-14 flex-shrink-0 rounded-lg border border-neutral-100 overflow-hidden bg-white">
                        <img
                          src={product.image ? (product.image.startsWith('http') ? product.image : `${BASE_URL}${product.image}`) : 'https://via.placeholder.com/100'}
                          alt={product.name}
                          className={`h-full w-full object-cover group-hover:scale-110 transition-transform duration-500 ${!(product.stock && product.stock > 0) ? 'grayscale' : ''}`}
                        />
                      </div>
                      <div className="ml-4 flex-grow">
                        <h4 className="text-sm font-semibold text-neutral-900 line-clamp-1 group-hover:text-[#5173FB] transition-colors">
                          {product.name}
                        </h4>
                        <div className="flex items-center mt-1">
                          {product.stock && product.stock > 0 ? (
                            <>
                              <span className="text-sm font-bold text-brand">৳{product.sale_price || product.regular_price}</span>
                              {product.sale_price && (
                                <span className="ml-2 text-[10px] text-neutral-400 line-through">৳{product.regular_price}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-sm font-bold text-neutral-500">To be announced</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-4 w-4 text-[#5173FB]" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : query.length > 1 ? (
              <div className="p-12 text-center">
                <Search className="h-10 w-10 text-neutral-200 mx-auto mb-4" />
                <p className="text-sm font-medium text-neutral-500">No products match your search</p>
                <p className="text-xs text-neutral-400 mt-1">Try different keywords or browse our shop</p>
              </div>
            ) : history.length > 0 ? (
              <div className="py-2">
                <div className="px-4 py-2 border-b border-neutral-50 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Recent Searches</span>
                  <button 
                    onClick={clearHistory}
                    className="text-[10px] font-bold text-brand hover:text-brand transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div>
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 cursor-pointer group/item transition-colors"
                      onClick={() => handleHistoryClick(item)}
                    >
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-neutral-300 mr-3 group-hover/item:text-[#5173FB]" />
                        <span className="text-sm text-neutral-600 group-hover/item:text-neutral-900">{item}</span>
                      </div>
                      <button
                        onClick={(e) => removeFromHistory(e, item)}
                        className="p-1.5 opacity-0 group-hover/item:opacity-100 hover:bg-brand/5 hover:text-brand rounded-lg transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-neutral-400">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">Start typing to search products</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Searchbar;
