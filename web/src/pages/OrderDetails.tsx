import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrderDetails, requestCancelOrder, BASE_URL } from '../services/api';
import { motion } from 'framer-motion';
import { 
  Package, 
  MapPin, 
  CreditCard, 
  ArrowLeft, 
  Loader2, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertCircle,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import AccountSidebar from '../components/AccountSidebar';
import SEO from '../components/SEO';

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isCancelling, setIsCancelling] = React.useState(false);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order-details', id],
    queryFn: () => getOrderDetails(Number(id)).then(res => res.data),
    enabled: !!id,
  });

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setIsCancelling(true);
    try {
      await requestCancelOrder(Number(id));
      queryClient.invalidateQueries({ queryKey: ['order-details', id] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Pending Confirmation' };
      case 'processing':
        return { icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Processing' };
      case 'shipped':
        return { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Shipped' };
      case 'delivered':
        return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Delivered' };
      case 'cancelled':
        return { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Cancelled' };
      default:
        return { icon: Package, color: 'text-neutral-600', bg: 'bg-neutral-50', border: 'border-neutral-200', label: status };
    }
  };

  const statusInfo = getStatusInfo(order?.status);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-brand mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900">Order not found</h2>
          <p className="text-neutral-500 mt-2 mb-6">The order you're looking for doesn't exist.</p>
          <Link to="/account/orders" className="inline-flex items-center space-x-2 bg-brand text-white px-6 py-3 rounded-xl font-bold">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Orders</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12">
      <SEO title={`Order #${String(order.id).padStart(6, '0')}`} description={`Viewing details for order #${order.id}`} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <AccountSidebar activeTab="dashboard" />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="flex items-center space-x-4 mb-8">
              <Link to="/account/orders" className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500 hover:text-neutral-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Order Details</h1>
                <p className="text-neutral-500 text-sm mt-1">Order #{String(order.id).padStart(8, '0')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side: Order Info & Items */}
              <div className="lg:col-span-2 space-y-8">
                {/* Status Banner */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${statusInfo.bg} ${statusInfo.border} border p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`${statusInfo.color} bg-white p-3 rounded-xl shadow-sm`}>
                      <statusInfo.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">Current Status</p>
                      <h3 className={`text-lg font-bold ${statusInfo.color}`}>{statusInfo.label}</h3>
                      {order.courier_tracking_code && (
                        <div className="mt-1">
                          <a 
                            href={order.courier_name === 'carrybee' 
                              ? `https://merchant.carrybee.com/order-track/${order.courier_consignment_id}` 
                              : `https://steadfast.com.bd/tl/${order.courier_tracking_code}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs font-bold text-brand hover:underline"
                          >
                            Track Order ({order.courier_tracking_code})
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  {order.status === 'pending' && (
                    <button
                      onClick={handleCancelOrder}
                      disabled={isCancelling}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                </motion.div>

                {/* Items List */}
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
                  <div className="p-6 border-b border-neutral-50">
                    <h3 className="text-lg font-bold text-neutral-900">Items Ordered</h3>
                  </div>
                  <div className="divide-y divide-neutral-50">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="p-6 flex items-center space-x-6">
                        <div className="w-20 h-20 rounded-xl bg-neutral-50 border border-neutral-100 overflow-hidden flex-shrink-0">
                          {item.product_image ? (
                            <img 
                              src={item.product_image.startsWith('http') ? item.product_image : `${BASE_URL}${item.product_image}`} 
                              className="w-full h-full object-cover" 
                              alt={item.product_name} 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <ShoppingBag className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-neutral-900 truncate">{item.product_name}</h4>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-neutral-500">
                            <span className="font-medium">Qty: {item.quantity}</span>
                            <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                            <span className="font-medium">TK. {item.price} each</span>
                            {(item.color_name || item.size_name) && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                                    <span className="text-[10px] font-bold text-brand uppercase tracking-widest border border-red-100 bg-brand/5 px-1.5 py-0.5 rounded">
                                        {[item.color_name, item.size_name].filter(Boolean).join(' / ')}
                                    </span>
                                </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-neutral-900">TK. {item.price * item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping & Payment Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 space-y-4">
                    <div className="flex items-center space-x-3 text-neutral-900">
                      <MapPin className="w-5 h-5 text-brand" />
                      <h3 className="font-bold">Shipping Address</h3>
                    </div>
                    <div className="text-sm text-neutral-600 leading-relaxed">
                      <p className="font-bold text-neutral-900">{order.customer_name}</p>
                      <p>{order.address}</p>
                      <p className="mt-2 font-medium text-neutral-900">{order.phone_number}</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 space-y-4">
                    <div className="flex items-center space-x-3 text-neutral-900">
                      <CreditCard className="w-5 h-5 text-brand" />
                      <h3 className="font-bold">Payment Method</h3>
                    </div>
                    <div className="text-sm text-neutral-600">
                      <p className="font-bold text-neutral-900 uppercase tracking-wide">
                        {order.payment_method_name || 'Cash on Delivery'}
                      </p>
                      <p className="mt-1">Transaction ID: {order.transaction_id || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Summary */}
              <div className="space-y-8">
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
                  <div className="p-6 border-b border-neutral-50">
                    <h3 className="text-lg font-bold text-neutral-900">Order Summary</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between text-sm text-neutral-500">
                      <span>Subtotal</span>
                      <span className="font-bold text-neutral-900">TK. {order.total_amount - (order.shipping_cost || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-neutral-500">
                      <span>Shipping Fee</span>
                      <span className="font-bold text-neutral-900">TK. {order.shipping_cost || 0}</span>
                    </div>
                    <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
                      <span className="text-base font-bold text-neutral-900">Total</span>
                      <span className="text-2xl font-black text-brand">TK. {order.total_amount}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-brand/5 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-brand" />
                    </div>
                    <h3 className="font-bold text-neutral-900">Return Policy</h3>
                  </div>
                  <p className="text-sm text-neutral-500 leading-relaxed mb-6">
                    Check our return and replacement policy to understand how we handle returns and exchanges.
                  </p>
                  <Link 
                    to="/return-replacement-policy" 
                    className="w-full inline-flex items-center justify-center space-x-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-900 py-3 rounded-xl text-sm font-bold transition-colors border border-neutral-100"
                  >
                    <span>Read Policy</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
