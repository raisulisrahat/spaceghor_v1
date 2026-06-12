import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, Loader2, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, KeyRound, Eye, EyeOff } from 'lucide-react';
import { requestOTP, verifyOTP, resetPassword } from '../services/api';
import SEO from '../components/SEO';
import { formatPhoneNumber, isValidPhoneNumber } from '../utils/phone';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: New Password
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { siteLogo, siteTitle } = useSettings();
  const navigate = useNavigate();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhoneNumber(phone)) {
      setError('Please enter a valid 11-digit mobile number starting with 01.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await requestOTP(phone);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await verifyOTP(phone, otp);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await resetPassword({ phone_number: phone, code: otp, new_password: newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password.');
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
          <SEO title="Reset Password" description={`Securely reset your ${siteTitle} account password.`} />
          <div className="text-center mb-8">
            <Link to="/">
              <img src={siteLogo} alt={siteTitle} className="w-32 mx-auto mb-4 object-contain" />
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900">Reset Password</h1>
            <p className="text-neutral-500 mt-2 text-sm">
              {step === 1 && "Enter your phone number to receive a reset code"}
              {step === 2 && "Enter the 4-digit code sent to your phone"}
              {step === 3 && "Create a strong new password for your account"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-brand/5 border border-red-100 rounded-xl flex items-start text-brand text-sm">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-start text-green-600 text-sm">
              <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
              <p>Password reset successful! Redirecting to login...</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!success && (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {step === 1 && (
                  <form onSubmit={handleRequestOTP} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                          <Phone className="w-5 h-5" />
                        </div>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                          placeholder="e.g. 01712345678"
                          className="block w-full pl-10 pr-3 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5173FB]/20 focus:border-[#5173FB] transition-all"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-brand text-white font-bold rounded-xl hover:bg-[#3a5bd9] transition-all disabled:opacity-70 flex items-center justify-center group"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          Send OTP Code
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {step === 2 && (
                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Verification Code</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <input
                          type="text"
                          maxLength={4}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="4-digit code"
                          className="block w-full pl-10 pr-3 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5173FB]/20 focus:border-[#5173FB] transition-all tracking-[0.5em] font-bold"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 py-3 px-4 bg-neutral-100 text-neutral-700 font-bold rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center"
                      >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-[2] py-3 px-4 bg-brand text-white font-bold rounded-xl hover:bg-[#3a5bd9] transition-all disabled:opacity-70 flex items-center justify-center"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Code"}
                      </button>
                    </div>
                  </form>
                )}

                {step === 3 && (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="block w-full pl-10 pr-12 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5173FB]/20 focus:border-[#5173FB] transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-type password"
                          className="block w-full pl-10 pr-12 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5173FB]/20 focus:border-[#5173FB] transition-all"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-brand text-white font-bold rounded-xl hover:bg-[#3a5bd9] transition-all disabled:opacity-70 flex items-center justify-center"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <Link to="/login" className="text-sm font-bold text-[#5173FB] hover:underline">
              Return to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
