import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyOrders, BASE_URL } from '../services/api';
import { motion } from 'framer-motion';
import { ShoppingBag, Package, ChevronRight, Loader2, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import AccountSidebar from '../components/AccountSidebar';
import SEO from '../components/SEO';

const MyOrders = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const { data: orders, isLoading } = useQuery({
        queryKey: ['my-orders'],
        queryFn: () => getMyOrders().then(res => res.data),
    });

    const totalPages = Math.ceil((orders?.length || 0) / ITEMS_PER_PAGE);
    const paginatedOrders = orders?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

    const duplicateOrders = (() => {
        if (!orders) return [];
        const activeOrders = orders.filter((o: any) => 
            ['pending', 'processing'].includes(o.status.toLowerCase())
        );
        const duplicates: any[] = [];
        const seen = new Map<string, any>();

        activeOrders.forEach((order: any) => {
            const sortedItems = [...order.items].sort((a: any, b: any) => 
                a.product_name.localeCompare(b.product_name)
            );
            const itemKey = sortedItems.map((item: any) => 
                `${item.product_name}-${item.quantity}-${item.color_name || ''}-${item.size_name || ''}`
            ).join('|');

            if (seen.has(itemKey)) {
                const originalOrder = seen.get(itemKey);
                if (!duplicates.some(d => d.id === originalOrder.id)) {
                    duplicates.push(originalOrder);
                }
                if (!duplicates.some(d => d.id === order.id)) {
                    duplicates.push(order);
                }
            } else {
                seen.set(itemKey, order);
            }
        });
        return duplicates.sort((a, b) => a.id - b.id);
    })();

    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
        }
    };

    const getPaymentMethodName = (method: any) => {
        if (!method) return 'Cash on Delivery';
        if (method === 1 || method === '1') return 'Cash on Delivery';
        if (method === 2 || method === '2') return 'Online Payment';
        return typeof method === 'string' && isNaN(Number(method)) ? method : 'Cash on Delivery';
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#5173FB] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <SEO title="My Orders" description="View and track your order history." />
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                            <AccountSidebar />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center space-x-4">
                                <Link to="/account" className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500 hover:text-neutral-900">
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">My Orders</h1>
                                    <p className="text-neutral-500 text-sm mt-1">Track and manage your recent purchases</p>
                                </div>
                            </div>

                            {/* Duplicate Order Warning Bar */}
                            {duplicateOrders.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-start space-x-3 bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-800 px-4 py-3 rounded-2xl max-w-md shadow-md shadow-red-900/5"
                                >
                                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 animate-pulse" />
                                    <div className="text-xs">
                                        <p className="font-extrabold text-red-900 uppercase tracking-wider text-[10px]">Duplicate Order Detected</p>
                                        <p className="text-red-700 font-medium mt-1 leading-relaxed text-[11px]">
                                            Orders {duplicateOrders.map(o => `#${String(o.id).padStart(8, '0')}`).join(' & ')} contain the exact same items. Please contact support if this was a mistake.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {orders?.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-20 bg-white rounded-xl border border-neutral-200 shadow-sm"
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-50 rounded-full mb-6">
                                    <ShoppingBag className="w-8 h-8 text-neutral-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-neutral-900">No orders yet</h3>
                                <p className="text-neutral-500 mt-2 mb-6">You haven't placed any orders with us yet.</p>
                                <Link 
                                    to="/products" 
                                    className="inline-flex items-center space-x-2 bg-brand text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#3a5bd9] transition-colors"
                                >
                                    <span>Start Shopping</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </motion.div>
                        ) : (
                            <div className="space-y-6">
                                {paginatedOrders?.map((order: any, idx: number) => (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                                        className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col"
                                    >
                                        {/* Card Header */}
                                        <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="bg-white p-2 rounded-lg border border-neutral-200 shadow-sm">
                                                    <Package className="w-5 h-5 text-neutral-600" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-0.5">Order ID</p>
                                                    <h3 className="text-sm font-semibold text-neutral-900 font-mono">#{String(order.id).padStart(8, '0')}</h3>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4 text-right">
                                                <div className="hidden sm:block text-right mr-2">
                                                    <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-0.5">Date placed</p>
                                                    <p className="text-sm text-neutral-900 font-medium">
                                                        {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Body - Items */}
                                        <div className="p-6">
                                            <div className="flex flex-col space-y-4">
                                                {order.items.slice(0, 2).map((item: any) => (
                                                    <div key={item.id} className="flex items-center space-x-4">
                                                        <div className="w-16 h-16 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0">
                                                            {item.product_image ? (
                                                                <img src={item.product_image.startsWith('http') ? item.product_image : `${BASE_URL}${item.product_image}`} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                                                    <ShoppingBag className="w-5 h-5" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-semibold text-neutral-900 truncate">{item.product_name}</h4>
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                <p className="text-xs text-neutral-500 font-medium">Qty: {item.quantity}</p>
                                                                {(item.color_name || item.size_name) && (
                                                                    <>
                                                                        <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                                                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                                                                            {[item.color_name, item.size_name].filter(Boolean).join(' / ')}
                                                                        </p>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-semibold text-neutral-900">TK. {item.price}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {order.items.length > 2 && (
                                                    <p className="text-sm text-neutral-500 font-medium pt-2">
                                                        + {order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Footer */}
                                        <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-4 mt-auto">
                                            <div className="flex items-center space-x-6">
                                                <div>
                                                    <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-0.5">Total</p>
                                                    <p className="text-base font-semibold text-[#5173FB]">TK. {order.total_amount}</p>
                                                </div>
                                                <div className="h-8 w-px bg-neutral-200 hidden sm:block"></div>
                                                <div className="hidden sm:block">
                                                    <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-0.5">Payment</p>
                                                    <p className="text-sm font-medium text-neutral-900">{getPaymentMethodName(order.payment_method)}</p>
                                                </div>
                                            </div>
                                            <Link 
                                                to={`/account/orders/${order.id}`} 
                                                className="inline-flex items-center justify-center px-4 py-2 bg-white border border-neutral-200 text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                                            >
                                                View Details
                                                <ArrowRight className="w-4 h-4 ml-2 text-neutral-500" />
                                            </Link>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center space-x-2 pt-8">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
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
                                                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === page ? 'bg-brand text-white shadow-lg shadow-[#5173FB]/20' : 'text-neutral-500 hover:bg-neutral-50 bg-white border border-neutral-200'}`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        ))}

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyOrders;
