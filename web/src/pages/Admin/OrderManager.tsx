import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  Truck, 
  XCircle, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Package,
  ExternalLink,
  MapPin,
  Phone
} from 'lucide-react';
import { getOrders, updateOrder } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(date);
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(date);
};

const OrderManager = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => getOrders().then(res => res.data)
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => updateOrder(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-indigo-100 text-indigo-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  const filteredOrders = orders?.filter((order: any) => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Orders</h1>
          <p className="text-neutral-500 mt-1 font-medium">Manage and track customer shipments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Search by Order ID or Customer Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5173FB]/20 focus:border-[#5173FB] transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                statusFilter === status 
                  ? 'bg-neutral-900 text-white shadow-lg' 
                  : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 border-b border-neutral-100">
                <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <AnimatePresence>
                {filteredOrders?.map((order: any) => (
                  <motion.tr 
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-neutral-50/50 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <span className="font-mono font-bold text-neutral-900">#{order.id.toString().padStart(6, '0')}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-neutral-900 truncate max-w-[150px]">{order.customer_name}</span>
                        <div className="flex items-center text-[10px] text-neutral-400 font-medium mt-0.5">
                          <Phone className="w-2.5 h-2.5 mr-1" /> {order.phone_number}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-extrabold text-neutral-900">৳{parseFloat(order.total_amount).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col text-xs">
                        <span className="text-neutral-700 font-bold">{formatDate(order.created_at)}</span>
                        <span className="text-neutral-400">{formatTime(order.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {order.status === 'pending' && (
                          <button 
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'processing' })}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Start Processing"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {(order.status === 'processing' || order.status === 'shipped') && (
                          <button 
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'delivered' })}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            title="Mark as Delivered"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {(!filteredOrders || filteredOrders.length === 0) && !isLoading && (
          <div className="p-20 text-center">
            <Package className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
            <p className="text-neutral-400 font-medium">No orders found matching your filters</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-neutral-500 font-medium">
        <span>Showing {filteredOrders?.length || 0} of {orders?.length || 0} orders</span>
        <div className="flex space-x-2">
           <button className="p-2 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 disabled:opacity-30" disabled>
             <ChevronLeft className="w-4 h-4" />
           </button>
           <button className="p-2 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 disabled:opacity-30" disabled>
             <ChevronRight className="w-4 h-4" />
           </button>
        </div>
      </div>
    </div>
  );
};

export default OrderManager;
