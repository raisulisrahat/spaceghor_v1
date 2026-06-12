import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { motion } from 'framer-motion';
import { UserPlus, Phone, Lock, User as UserIcon, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import SEO from '../components/SEO';
import { formatPhoneNumber, isValidPhoneNumber } from '../utils/phone';

const Signup = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { siteLogo, siteTitle } = useSettings();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone_number') {
      setFormData({ ...formData, [name]: formatPhoneNumber(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!isValidPhoneNumber(formData.phone_number)) {
      setError('Please enter a valid 11-digit mobile number starting with 01.');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await register({
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        password: formData.password
      });
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.phone_number?.[0] || 'Registration failed. This mobile number may already be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-neutral-50 px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-neutral-100">
          <SEO title="Create Account" description={`Join ${siteTitle} for a premium shopping experience in Bangladesh.`} />
          <div className="text-center mb-8">
            <img src={siteLogo} alt={siteTitle} className="h-16 mx-auto mb-4 object-contain" />
            <h1 className="text-2xl font-bold text-neutral-900">Create Account</h1>
            <p className="text-neutral-500 mt-2">Join our premium shopping community</p>
          </div>

          {isSuccess ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8"
            >
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-neutral-900">Success!</h2>
              <p className="text-neutral-500 mt-2">Your account has been created. Redirecting to login...</p>
            </motion.div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-brand/5 border border-red-100 rounded-xl flex items-start text-brand text-sm">
                  <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <input
                      name="full_name"
                      type="text"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                      className="block w-full pl-10 pr-3 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      name="phone_number"
                      type="text"
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder="e.g. 01712345678"
                      className="block w-full pl-10 pr-3 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5173FB]/20 focus:border-[#5173FB] transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="block w-full pl-10 pr-12 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5173FB]/20 focus:border-[#5173FB] transition-all"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        name="confirm_password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirm_password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="block w-full pl-10 pr-12 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5173FB]/20 focus:border-[#5173FB] transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 focus:outline-none"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-brand text-white font-bold rounded-xl hover:bg-brand-hover focus:outline-none focus:ring-4 focus:ring-brand/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center pt-8"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    'Register Now'
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
                <p className="text-sm text-neutral-500">
                  Already have an account?{' '}
                  <Link to="/login" className="font-bold text-brand hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
