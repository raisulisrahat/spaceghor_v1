import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  MoreHorizontal,
  Package,
  ArrowUpDown,
  AlertTriangle,
  Settings,
  Eye,
  Filter,
  Download,
  X,
  Loader2,
  Upload,
  Check
} from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct, BASE_URL, getCategories, getBrands } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const ProductManager = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => getProducts({ ordering: '-updated_at' }).then(res => res.data)
  });

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories().then(res => res.data) });
  const { data: brands } = useQuery({ queryKey: ['brands'], queryFn: () => getBrands().then(res => res.data) });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsModalOpen(false);
      setEditingProduct(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsModalOpen(false);
      setEditingProduct(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsDeleting(null);
    }
  });

  const filteredProducts = products?.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Clean up data for backend (prices should be numbers)
    const payload = {
        ...data,
        regular_price: Number(data.regular_price),
        sale_price: data.sale_price ? Number(data.sale_price) : null,
        stock: Number(data.stock),
        is_active: formData.get('is_active') === 'on',
        is_featured: formData.get('is_featured') === 'on',
    };

    if (editingProduct) {
        updateMutation.mutate({ id: editingProduct.id, data: payload });
    } else {
        createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your inventory, pricing and visibility.</p>
        </div>
        <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                <Download className="w-4 h-4" />
                <span>Export</span>
            </button>
            <button 
                onClick={handleOpenAddModal}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-bold shadow-lg shadow-gray-900/10 hover:bg-black transition-all"
            >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
            </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
          />
        </div>
        
        <div className="flex items-center space-x-2">
            <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <ArrowUpDown className="w-4 h-4 rotate-90" />
                </button>
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Package className="w-4 h-4" />
                </button>
            </div>
            <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 shadow-sm">
                <Filter className="w-4 h-4" />
            </button>
        </div>
      </div>

      {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
              <p className="text-sm text-gray-400 font-medium">Fetching product data...</p>
          </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredProducts?.map((product: any) => (
                            <tr key={product.id} className="hover:bg-gray-50/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-lg bg-gray-50 overflow-hidden border border-gray-100 flex-shrink-0">
                                            <img 
                                                src={product.image ? (product.image.startsWith('http') ? product.image : `${BASE_URL}${product.image}`) : 'https://via.placeholder.com/100'} 
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900 line-clamp-1">{product.name}</div>
                                            <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{product.brand?.name || 'No Brand'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                                        {product.category?.name || 'Uncategorized'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                        <span className={`text-sm font-bold ${product.stock < 10 ? 'text-brand' : 'text-gray-900'}`}>
                                            {product.stock}
                                        </span>
                                        {product.stock < 10 && (
                                            <AlertTriangle className="w-3.5 h-3.5 text-brand" />
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-gray-900">৳{parseFloat(product.sale_price || product.regular_price).toLocaleString()}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleOpenEditModal(product)}
                                            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => setIsDeleting(product.id)}
                                            className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded-md transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts?.map((product: any) => (
                <div key={product.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group">
                    <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden border-b border-gray-50">
                        <img 
                            src={product.image ? (product.image.startsWith('http') ? product.image : `${BASE_URL}${product.image}`) : 'https://via.placeholder.com/400'} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                            <button 
                                onClick={() => handleOpenEditModal(product)}
                                className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm text-gray-600 hover:text-brand transition-all border border-gray-100"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={() => setIsDeleting(product.id)}
                                className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm text-gray-600 hover:text-brand transition-all border border-gray-100"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">{product.brand?.name || 'No Brand'}</span>
                            <span className="text-[10px] font-bold text-gray-400">{product.stock} in stock</span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-3">{product.name}</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-gray-900">৳{parseFloat(product.sale_price || product.regular_price).toLocaleString()}</span>
                            <button className="text-[10px] font-bold text-gray-500 hover:text-gray-900 uppercase tracking-wider underline underline-offset-4 decoration-gray-200">View Details</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* CRUD Modal */}
      <AnimatePresence>
        {isModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsModalOpen(false)}
                    className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                            <p className="text-xs text-gray-500 mt-1">Fill in the details below to save the product.</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Product Name</label>
                                <input 
                                    name="name"
                                    required
                                    defaultValue={editingProduct?.name}
                                    placeholder="Enter full product name..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                                <select 
                                    name="category"
                                    defaultValue={editingProduct?.category?.id}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all appearance-none"
                                >
                                    <option value="">Select Category</option>
                                    {categories?.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Brand</label>
                                <select 
                                    name="brand"
                                    defaultValue={editingProduct?.brand?.id}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all appearance-none"
                                >
                                    <option value="">Select Brand</option>
                                    {brands?.map((b: any) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Regular Price (৳)</label>
                                <input 
                                    name="regular_price"
                                    type="number"
                                    required
                                    defaultValue={editingProduct?.regular_price}
                                    placeholder="0.00"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sale Price (৳)</label>
                                <input 
                                    name="sale_price"
                                    type="number"
                                    defaultValue={editingProduct?.sale_price}
                                    placeholder="Optional"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Stock Level</label>
                                <input 
                                    name="stock"
                                    type="number"
                                    required
                                    defaultValue={editingProduct?.stock}
                                    placeholder="Quantity in units"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                                />
                            </div>

                            <div className="flex items-center space-x-6 h-full pt-6">
                                <label className="flex items-center space-x-2 cursor-pointer group">
                                    <div className="relative">
                                        <input type="checkbox" name="is_active" defaultChecked={editingProduct ? editingProduct.is_active : true} className="sr-only" />
                                        <div className="w-10 h-5 bg-gray-200 rounded-full group-hover:bg-gray-300 transition-colors" />
                                        <div className="dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition transform" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer group">
                                    <div className="relative">
                                        <input type="checkbox" name="is_featured" defaultChecked={editingProduct?.is_featured} className="sr-only" />
                                        <div className="w-10 h-5 bg-gray-200 rounded-full group-hover:bg-gray-300 transition-colors" />
                                        <div className="dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition transform" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Featured</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Product Description</label>
                            <textarea 
                                name="description"
                                rows={4}
                                defaultValue={editingProduct?.description}
                                placeholder="Describe the product features, warranty, etc..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all resize-none"
                            />
                        </div>

                        <div className="p-6 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center space-y-2 group hover:border-red-200 transition-colors cursor-pointer bg-gray-50/50">
                            <Upload className="w-8 h-8 text-gray-300 group-hover:text-red-400 transition-colors" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-600 transition-colors">Upload Product Media</p>
                            <p className="text-[10px] text-gray-400 font-medium italic">PNG, JPG or WEBP (Max 2MB)</p>
                        </div>
                    </form>

                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={(e: any) => {
                                const form = e.target.closest('.relative').querySelector('form');
                                if (form) form.requestSubmit();
                            }}
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="flex items-center space-x-2 px-8 py-2.5 bg-brand text-white rounded-xl text-sm font-bold shadow-lg shadow-brand/20 hover:bg-red-700 transition-all disabled:opacity-50"
                        >
                            {(createMutation.isPending || updateMutation.isPending) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {isDeleting && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsDeleting(null)}
                    className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 text-center"
                >
                    <div className="w-16 h-16 bg-brand/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trash2 className="w-8 h-8 text-brand" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Are you sure?</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        This action cannot be undone. This product will be permanently removed from your inventory.
                    </p>
                    <div className="mt-8 flex items-center space-x-3">
                        <button 
                            onClick={() => setIsDeleting(null)}
                            className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
                        >
                            No, Cancel
                        </button>
                        <button 
                            onClick={() => deleteMutation.mutate(isDeleting)}
                            disabled={deleteMutation.isPending}
                            className="flex-1 py-3 bg-brand text-white rounded-xl text-sm font-bold shadow-lg shadow-brand/20 hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete'}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductManager;
