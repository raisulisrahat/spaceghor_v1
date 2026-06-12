import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  Settings, 
  Bell, 
  ExternalLink,
  LogOut,
  FolderTree,
  Tag,
  Palette,
  Layers,
  Zap,
  Image as ImageIcon,
  BookOpen,
  Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { getMediaUrl } from '../../utils/api';

const DashboardSidebar = () => {
  const { logout } = useAuth();
  const { siteTitle, siteLogo } = useSettings();

  const menuGroups = [
    {
      label: 'General',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/staff/admin/dashboard' },
        { name: 'Orders', icon: ShoppingBag, path: '/staff/admin/orders' },
        { name: 'Users', icon: Users, path: '/staff/admin/customers' },
      ]
    },
    {
      label: 'Catalog',
      items: [
        { name: 'Products', icon: Package, path: '/staff/admin/products' },
        { name: 'Categories', icon: FolderTree, path: '/staff/admin/categories' },
        { name: 'Brands', icon: Star, path: '/staff/admin/categories?tab=brands' },
        { name: 'Tags', icon: Tag, path: '/staff/admin/tags' },
      ]
    },
    {
      label: 'Marketing',
      items: [
        { name: 'Flash Sales', icon: Zap, path: '/staff/admin/flash-sales' },
        { name: 'Funnels', icon: Layers, path: '/staff/admin/funnels' },
        { name: 'Banners', icon: ImageIcon, path: '/staff/admin/banners' },
        { name: 'Notice', icon: Bell, path: '/staff/admin/notices' },
        { name: 'Blogs', icon: BookOpen, path: '/staff/admin/blog' },
      ]
    },
    {
      label: 'System',
      items: [
        { name: 'Settings', icon: Settings, path: '/staff/admin/settings' },
      ]
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-100 h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="p-6">
        <div className="flex items-center space-x-2.5">
          {siteLogo ? (
            <img 
              src={getMediaUrl(siteLogo)} 
              alt={siteTitle} 
              className="h-8 w-auto object-contain"
            />
          ) : (
            <>
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand/20">
                {siteTitle.charAt(0)}
              </div>
              <h2 className="text-gray-900 text-lg font-bold tracking-tight">
                {siteTitle.includes(' ') ? (
                  <>
                    {siteTitle.split(' ')[0]}
                    <span className="text-brand">{siteTitle.split(' ').slice(1).join(' ')}</span>
                  </>
                ) : siteTitle}
              </h2>
            </>
          )}
        </div>
      </div>

      <nav className="flex-grow px-3 space-y-7 overflow-y-auto pt-2 no-scrollbar">
        {menuGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group ${
                      isActive 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon className={`w-4 h-4 ${window.location.pathname === item.path ? 'text-brand' : 'text-gray-400 group-hover:text-gray-900'}`} />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 mt-auto">
        <a 
          href="/" 
          target="_blank" 
          className="flex items-center space-x-3 px-3 py-2 text-gray-500 hover:text-gray-900 transition-all text-sm font-medium group"
        >
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-900" />
          <span>View Site</span>
        </a>
        <button 
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2 text-gray-500 hover:text-brand transition-all text-sm font-medium group mt-1"
        >
          <LogOut className="w-4 h-4 text-gray-400 group-hover:text-brand" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardSidebar;
