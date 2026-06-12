import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AccountSidebar from '../components/AccountSidebar';
import { changePassword } from '../services/api';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword({
        current_password: formData.currentPassword,
        new_password: formData.newPassword
      });
      
      setSuccess('Password updated successfully.');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => navigate('/account'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <AccountSidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Link to="/account" className="inline-flex items-center text-neutral-500 hover:text-[#5173FB] font-bold mb-8 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Account
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] p-8 shadow-sm border border-neutral-100 max-w-2xl"
            >
              <div className="mb-10">
                <div className="w-16 h-16 bg-brand/10 text-[#5173FB] rounded-2xl flex items-center justify-center mb-6">
                  <Lock className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Change Password</h1>
                <p className="text-neutral-500 text-sm mt-2">Create a new, strong password to keep your account secure.</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-brand/5 text-brand rounded-xl text-sm flex items-start border border-red-100">
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl text-sm flex items-start border border-green-100">
                  <p>{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 ml-1">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 -translate-y-1/2 left-4 w-5 h-5 text-neutral-400 pointer-events-none" />
                    <input
                      name="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl text-sm font-medium transition-all outline-none border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-[#5173FB] focus:ring-2 focus:ring-[#5173FB]/20 text-neutral-900 placeholder-neutral-400"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute top-1/2 -translate-y-1/2 right-4 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 ml-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 -translate-y-1/2 left-4 w-5 h-5 text-neutral-400 pointer-events-none" />
                    <input
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl text-sm font-medium transition-all outline-none border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-[#5173FB] focus:ring-2 focus:ring-[#5173FB]/20 text-neutral-900 placeholder-neutral-400"
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute top-1/2 -translate-y-1/2 right-4 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 ml-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 -translate-y-1/2 left-4 w-5 h-5 text-neutral-400 pointer-events-none" />
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl text-sm font-medium transition-all outline-none border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-[#5173FB] focus:ring-2 focus:ring-[#5173FB]/20 text-neutral-900 placeholder-neutral-400"
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute top-1/2 -translate-y-1/2 right-4 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center py-4 bg-brand text-white font-bold rounded-xl hover:bg-[#3a5bd9] transition-all focus:ring-4 focus:ring-[#5173FB]/30 disabled:opacity-70"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
