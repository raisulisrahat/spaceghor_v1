import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Phone, MapPin, Package, LogOut, Settings, Camera, Save, 
  Loader2, CheckCircle2, ChevronRight, ShoppingBag, CreditCard,
  ShieldCheck, Bell, Heart, LayoutDashboard, UserCircle, Edit3, XCircle
} from 'lucide-react';
import { updateProfile, BASE_URL, getMyOrders } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import AccountSidebar from '../components/AccountSidebar';
import SEO from '../components/SEO';

const Account = () => {
  const { user, logout, refreshProfile } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>(
    location.pathname === '/account/profile' ? 'profile' : 'dashboard'
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  React.useEffect(() => {
    if (location.pathname === '/account/profile') {
      setActiveTab('profile');
    } else if (location.pathname === '/account') {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  const { data: orders } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => getMyOrders().then(res => res.data),
    enabled: !!user
  });

  const [formData, setFormData] = useState({
    full_name: '',
    address: '',
    city: '',
    zip_code: ''
  });
  const [enable2fa, setEnable2fa] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.user?.first_name || '',
        address: user.profile?.address || '',
        city: user.profile?.city || '',
        zip_code: user.profile?.zip_code || ''
      });
      setEnable2fa(user.profile?.enable_2fa !== false);
    }
  }, [user]);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleToggle2FA = async () => {
    try {
      const newStatus = !enable2fa;
      setEnable2fa(newStatus);
      setVerifyError('');
      setVerificationCode('');
      
      await updateProfile({ enable_2fa: newStatus });
      await refreshProfile();
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to toggle 2FA:', error);
      setEnable2fa(enable2fa);
    }
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length < 6) return;
    setIsVerifying(true);
    setVerifyError('');
    try {
      await updateProfile({ otp_code: verificationCode });
      await refreshProfile();
      setVerificationCode('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error('2FA verification failed:', error);
      setVerifyError(error.response?.data?.otp_code?.[0] || error.response?.data?.error || 'Invalid code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const data = new FormData();
      data.append('full_name', formData.full_name);
      data.append('address', formData.address);
      data.append('city', formData.city);
      data.append('zip_code', formData.zip_code);
      
      if (selectedImage) {
        data.append('profile_picture', selectedImage);
      }

      await updateProfile(data);
      await refreshProfile();
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getProfileImageUrl = () => {
    if (imagePreview) return imagePreview;
    if (user?.profile?.profile_picture) {
      return user.profile.profile_picture.startsWith('http') 
        ? user.profile.profile_picture 
        : `${BASE_URL}${user.profile.profile_picture}`;
    }
    return null;
  };

  if (!user) return null;



  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12">
      <SEO title={activeTab === 'dashboard' ? 'Account Dashboard' : 'My Profile'} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 lg:gap-8">
          
          {/* Sidebar (Tabs on Mobile) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <AccountSidebar activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6 lg:space-y-8">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {(() => {
                    const cancelledOrdersCount = orders?.filter((order: any) => order.status === 'cancelled').length || 0;
                    return (
                      <div className="grid grid-cols-3 gap-3 md:gap-6">
                        {[
                          { icon: ShoppingBag, label: 'Total Orders', value: orders?.length || 0, color: 'blue' },
                          { icon: Heart, label: 'Wishlist', value: 0, color: 'rose' },
                          { icon: XCircle, label: 'Cancelled Orders', value: cancelledOrdersCount, color: 'amber' },
                        ].map((stat, i) => (
                          <div key={i} className="bg-white p-3 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-neutral-100 flex flex-col md:flex-row items-center justify-center md:justify-start space-y-2 md:space-y-0 md:space-x-4 text-center md:text-left">
                            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 shrink-0`}>
                              <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] md:text-xs font-bold text-neutral-400 uppercase tracking-widest truncate">{stat.label}</p>
                              <h4 className="text-xl md:text-2xl font-black text-neutral-900">{stat.value}</h4>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="bg-white rounded-[2rem] shadow-sm border border-neutral-100 overflow-hidden">
                    <div className="p-8 border-b border-neutral-50 flex items-center justify-between">
                      <h3 className="text-xl font-black text-neutral-900 tracking-tight">Recent Orders</h3>
                      <Link to="/account/orders" className="text-sm font-bold text-[#5173FB] hover:underline">View All</Link>
                    </div>
                    <div className="p-8">
                      {orders?.length > 0 ? (
                        <div className="space-y-6">
                          {orders.slice(0, 4).map((order: any) => (
                            <Link 
                              key={order.id} 
                              to={`/account/orders/${order.id}`}
                              className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100 group hover:border-[#5173FB] hover:bg-white transition-all shadow-sm hover:shadow-md block"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-neutral-400 overflow-hidden border border-neutral-100 group-hover:border-[#5173FB]/20 transition-colors">
                                  {order.items?.[0]?.product_image ? (
                                    <img 
                                      src={order.items[0].product_image ? (order.items[0].product_image.startsWith('http') ? order.items[0].product_image : `${BASE_URL}${order.items[0].product_image}`) : ''} 
                                      className="w-full h-full object-cover" 
                                      alt="" 
                                    />
                                  ) : (
                                    <Package className="w-6 h-6" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-neutral-900 group-hover:text-[#5173FB] transition-colors">Order #{String(order.id).padStart(6, '0')}</p>
                                  <p className="text-xs text-neutral-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="text-right flex items-center space-x-4">
                                <div>
                                  <p className="text-sm font-black text-[#5173FB]">TK. {order.total_amount}</p>
                                  <span className="inline-block px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1">
                                    {order.status}
                                  </span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-[#5173FB] group-hover:translate-x-1 transition-all" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingBag className="w-8 h-8 text-neutral-200" />
                          </div>
                          <p className="text-neutral-500 font-medium">No recent orders found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-[2rem] p-8 shadow-sm border border-neutral-100"
                >
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h3 className="text-2xl font-black text-neutral-900 tracking-tight">Personal Information</h3>
                      <p className="text-neutral-500 text-sm mt-1">Update your profile and contact details</p>
                    </div>
                    {!isEditing && (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 px-6 py-3 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-900/10"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute top-4 left-4 w-5 h-5 text-neutral-300" />
                        <input
                          readOnly={!isEditing}
                          value={formData.full_name}
                          onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                          className={`w-full pl-12 pr-4 py-4 rounded-2xl text-sm font-bold transition-all outline-none border-2 ${
                            isEditing 
                              ? 'bg-white border-[#5173FB]/20 focus:border-[#5173FB]' 
                              : 'bg-neutral-50 border-transparent text-neutral-500'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">Mobile Number</label>
                      <div className="relative">
                        <Phone className="absolute top-4 left-4 w-5 h-5 text-neutral-300" />
                        <div className="w-full pl-12 pr-4 py-4 rounded-2xl text-sm font-bold bg-neutral-50 border-2 border-transparent text-neutral-400 flex items-center justify-between">
                          <span>{user.user.username}</span>
                          <span className="text-[10px] bg-neutral-200 text-neutral-500 px-2 py-0.5 rounded-lg">PRIMARY</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">Delivery Address</label>
                      <div className="relative">
                        <MapPin className="absolute top-4 left-4 w-5 h-5 text-neutral-300" />
                        <textarea
                          readOnly={!isEditing}
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          rows={3}
                          className={`w-full pl-12 pr-4 py-4 rounded-2xl text-sm font-bold transition-all outline-none border-2 resize-none ${
                            isEditing 
                              ? 'bg-white border-[#5173FB]/20 focus:border-[#5173FB]' 
                              : 'bg-neutral-50 border-transparent text-neutral-500'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">City</label>
                      <input
                        readOnly={!isEditing}
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className={`w-full px-5 py-4 rounded-2xl text-sm font-bold transition-all outline-none border-2 ${
                          isEditing 
                            ? 'bg-white border-[#5173FB]/20 focus:border-[#5173FB]' 
                            : 'bg-neutral-50 border-transparent text-neutral-500'
                        }`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1">Zip Code</label>
                      <input
                        readOnly={!isEditing}
                        value={formData.zip_code}
                        onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                        className={`w-full px-5 py-4 rounded-2xl text-sm font-bold transition-all outline-none border-2 ${
                          isEditing 
                            ? 'bg-white border-[#5173FB]/20 focus:border-[#5173FB]' 
                            : 'bg-neutral-50 border-transparent text-neutral-500'
                        }`}
                      />
                    </div>

                    {isEditing && (
                      <div className="md:col-span-2 flex items-center space-x-4 pt-6">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-grow flex items-center justify-center py-4 bg-brand text-white font-black rounded-2xl hover:bg-[#3a5bd9] transition-all shadow-xl shadow-red-700/20 disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save Changes</>}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              full_name: user?.user?.first_name || '',
                              address: user?.profile?.address || '',
                              city: user?.profile?.city || '',
                              zip_code: user?.profile?.zip_code || ''
                            });
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                          className="px-8 py-4 bg-neutral-100 text-neutral-600 font-black rounded-2xl hover:bg-neutral-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </form>

                  <div className="mt-8 pt-8 border-t border-neutral-100 space-y-4">
                    <Link 
                      to="/account/change-password" 
                      className="flex items-center justify-between p-4 bg-neutral-50 hover:bg-brand/5 rounded-2xl border border-neutral-100 hover:border-red-200 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-xl text-neutral-400 group-hover:text-[#5173FB] shadow-sm">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-neutral-700 group-hover:text-neutral-900">Change Password</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#5173FB]" />
                    </Link>

                    {(user?.user?.is_staff || user?.user?.is_superuser || ['admin', 'moderator'].includes(user?.profile?.role)) && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white rounded-xl text-neutral-400 shadow-sm">
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <span className="text-sm font-bold text-neutral-700 block">Two-Factor Authentication (2FA)</span>
                              <span className="text-xs text-neutral-500">Require Google Authenticator OTP code when logging in</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleToggle2FA}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                              enable2fa ? 'bg-brand' : 'bg-neutral-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                enable2fa ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Setup flow if enabled but not verified yet */}
                        {enable2fa && !user?.profile?.is_2fa_setup && (
                          <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 text-left space-y-4">
                            <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Setup Google Authenticator 2FA</p>
                            
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                              {user?.profile?.qr_code && (
                                <div className="bg-white p-3 rounded-xl border border-neutral-100 shadow-sm shrink-0">
                                  <img src={user.profile.qr_code} alt="QR Code" className="w-36 h-36" />
                                </div>
                              )}
                              <div className="space-y-3 flex-grow">
                                <p className="text-xs text-neutral-600 leading-relaxed">
                                  1. Open <strong>Google Authenticator</strong> on your mobile device.<br />
                                  2. Scan the QR code or enter this secret key manually:<br />
                                  <code className="inline-block mt-1 px-2.5 py-1 bg-neutral-200 text-neutral-800 text-[11px] font-bold rounded-md font-mono select-all">
                                    {user?.profile?.secret}
                                  </code>
                                </p>
                                
                                <div className="space-y-2 max-w-xs">
                                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Verification Code</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={verificationCode}
                                      onChange={(e) => setVerificationCode(e.target.value)}
                                      placeholder="e.g. 123456"
                                      className="flex-grow px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-center tracking-widest font-mono focus:border-[#5173FB] focus:outline-none"
                                      maxLength={6}
                                    />
                                    <button
                                      type="button"
                                      onClick={handleVerify2FA}
                                      disabled={isVerifying || verificationCode.length < 6}
                                      className="px-4 py-2 bg-brand text-white text-xs font-bold rounded-xl hover:bg-[#3a5bd9] transition-all disabled:opacity-50"
                                    >
                                      {isVerifying ? 'Verifying...' : 'Verify'}
                                    </button>
                                  </div>
                                  {verifyError && (
                                    <p className="text-xs text-red-600 font-medium">{verifyError}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <div className="bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-green-600/20 flex items-center space-x-3">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="font-bold">Profile updated successfully!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Account;
