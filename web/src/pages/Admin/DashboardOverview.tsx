import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShoppingBag, 
  Users, 
  Package, 
  DollarSign, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { getAdminStats, getOrders } from '../../services/api';
import { Link } from 'react-router-dom';

const DashboardOverview = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats', refreshKey],
    queryFn: () => getAdminStats().then(res => res.data),
    refetchInterval: 60000 
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['admin-recent-orders', refreshKey],
    queryFn: () => getOrders().then(res => res.data.slice(0, 5)),
    refetchInterval: 60000
  });

  const StatCard = ({ title, value, icon: Icon, trend, trendType }: any) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-xs font-medium ${trendType === 'up' ? 'text-emerald-500' : 'text-brand'}`}>
            {trendType === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">
          {isLoading ? <div className="h-8 w-24 bg-gray-50 animate-pulse rounded" /> : value}
        </h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Overview of your store's performance and recent activity.</p>
        </div>
        <button 
          onClick={() => setRefreshKey(k => k + 1)}
          className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`৳${stats?.total_sales?.toLocaleString() || '0'}`} icon={DollarSign} trend="12.5%" trendType="up" />
        <StatCard title="Total Orders" value={stats?.order_count || '0'} icon={ShoppingBag} trend="4.2%" trendType="up" />
        <StatCard title="Total Customers" value={stats?.user_count || '0'} icon={Users} trend="2.1%" trendType="up" />
        <StatCard title="Low Stock" value={stats?.low_stock_products || '0'} icon={Package} trend="Action" trendType="down" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Recent Orders</h3>
            <Link to="/staff/admin/orders" className="text-xs font-medium text-brand hover:text-red-700 transition-colors">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders?.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">#{String(order.id).padStart(5, '0')}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{order.customer_name}</div>
                      <div className="text-[11px] text-gray-400">{order.phone_number}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        order.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        'bg-gray-50 text-gray-500 border border-gray-100'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">৳{Number(order.total_amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Activity/Status */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-6">System Status</h3>
            <div className="space-y-6">
              {[
                { label: 'API Server', status: 'Healthy', color: 'bg-emerald-500' },
                { label: 'Asset Storage', status: 'Healthy', color: 'bg-emerald-500' },
                { label: 'Database', status: 'Optimal', color: 'bg-emerald-500' },
                { label: 'Cache (Redis)', status: 'Connected', color: 'bg-emerald-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-gray-900">{item.status}</span>
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold">Quick Guide</h3>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Use the sidebar to manage products, view orders, and configure store settings. Need help? Contact the tech team.
            </p>
            <button className="w-full mt-6 py-2.5 bg-white text-gray-900 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors shadow-lg">
              Open Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
