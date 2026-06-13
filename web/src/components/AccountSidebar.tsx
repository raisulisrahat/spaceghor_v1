import React, { useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, Camera, ShieldCheck, LayoutDashboard, UserCircle, 
  Package, LogOut, ChevronRight, Edit3 
} from 'lucide-react';
import { BASE_URL, getMyOrders, updateProfile } from '../services/api';
import { useQuery } from '@tanstack/react-query';

interface AccountSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: any) => void;
}

const AccountSidebar: React.FC<AccountSidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout, refreshProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: orders } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => getMyOrders().then(res => res.data),
    enabled: !!user
  });

  const getProfileImageUrl = () => {
    if (user?.profile?.profile_picture) {
      return user.profile.profile_picture.startsWith('http') 
        ? user.profile.profile_picture 
        : `${BASE_URL}${user.profile.profile_picture}`;
    }
    return null;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('profile_picture', file);
        
        await updateProfile(formData);
        await refreshProfile();
      } catch (error) {
        console.error('Failed to update profile picture:', error);
      }
    }
  };

  const NavItem = ({ icon: Icon, label, tab, to, danger }: { icon: any, label: string, tab?: string, to?: string, danger?: boolean }) => {
    const isActive = tab ? activeTab === tab : to ? location.pathname === to : false;
    
    const handleClick = () => {
      if (danger) {
        logout();
        navigate('/');
      } else if (onTabChange && tab) {
        onTabChange(tab);
      } else if (to) {
        navigate(to);
      }
    };

    return (
      <button
        onClick={handleClick}
        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group ${
          isActive 
            ? 'bg-brand text-white shadow-lg shadow-red-700/20' 
            : danger 
              ? 'text-brand hover:bg-brand/5' 
              : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
        }`}
      >
        <div className="flex items-center">
          <Icon className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
          {label}
        </div>
        {!danger && <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-all ${isActive ? 'hidden' : ''}`} />}
      </button>
    );
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-neutral-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
      
      <div className="relative flex lg:flex-col items-center lg:text-center space-x-4 lg:space-x-0 w-full">
        <div className="relative group flex-shrink-0">
          <div className="w-16 h-16 lg:w-28 lg:h-28 rounded-2xl lg:rounded-3xl border-2 lg:border-4 border-white shadow-xl lg:shadow-2xl overflow-hidden bg-neutral-50 rotate-3 group-hover:rotate-0 transition-transform duration-500">
            {getProfileImageUrl() ? (
              <img src={getProfileImageUrl()!} alt={user.user.first_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-brand/5 text-red-200">
                <User className="w-8 h-8 lg:w-12 lg:h-12" />
              </div>
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 lg:-bottom-2 lg:-right-2 p-1.5 lg:p-2.5 bg-white rounded-xl lg:rounded-2xl shadow-xl border border-neutral-100 text-brand hover:scale-110 transition-all z-10"
          >
            <Camera className="w-3 h-3 lg:w-4 lg:h-4" />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
        </div>
        
        <div className="lg:mt-6 text-left lg:text-center flex-grow">
          <h2 className="text-lg lg:text-xl font-black text-neutral-900 tracking-tight">{user.user.first_name}</h2>
          <div className="inline-flex items-center mt-1 lg:mt-2 px-2 lg:px-3 py-0.5 lg:py-1 bg-brand/5 text-brand rounded-full text-[8px] lg:text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck className="w-2.5 h-2.5 lg:w-3 lg:h-3 mr-1" />
            {user.user.is_staff ? 'Admin Account' : 'Verified Member'}
          </div>
        </div>

        <button 
          onClick={() => navigate('/account/profile')}
          className="lg:hidden p-2.5 text-neutral-400 hover:text-brand bg-neutral-50 hover:bg-brand/5 rounded-xl transition-colors border border-neutral-100"
        >
          <Edit3 className="w-5 h-5" />
        </button>
      </div>

      {/* Menu List */}
      <div className="mt-8 lg:mt-10 hidden lg:flex flex-col space-y-2 pb-2 lg:pb-0">
        <div className="w-full">
          <NavItem icon={LayoutDashboard} label="Overview" to="/account" />
        </div>
        <div className="w-full">
          <NavItem icon={UserCircle} label="Profile" to="/account/profile" />
        </div>
        
        <div className="relative w-full">
          <NavItem icon={Package} label="My Orders" to="/account/orders" />
          <span className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 bg-neutral-100 text-neutral-500 px-1.5 lg:px-2 py-0.5 rounded-lg text-[8px] lg:text-[10px] font-black pointer-events-none">
            {orders?.length || 0}
          </span>
        </div>

        <div className="pt-4 mt-4 border-t border-neutral-50 w-full">
          <NavItem icon={LogOut} label="Sign Out" danger />
        </div>
      </div>
    </div>
  );
};

export default AccountSidebar;
