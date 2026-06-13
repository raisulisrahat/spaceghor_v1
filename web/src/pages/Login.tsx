import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { motion } from 'framer-motion';
import { LogIn, Phone, Lock, Loader2, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import SEO from '../components/SEO';
import { checkPhone, requestOTP, setupPassword } from '../services/api';
import { formatPhoneNumber, isValidPhoneNumber } from '../utils/phone';

const Login = () => {
  const [step, setStep] = useState<'phone' | 'password' | 'otp_setup' | 'two_factor'>('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [twoFactorPhone, setTwoFactorPhone] = useState('');
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorSetupRequired, setTwoFactorSetupRequired] = useState(false);
  const [twoFactorQRCode, setTwoFactorQRCode] = useState('');
  
  const { login } = useAuth();
  const { siteLogo, siteTitle } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    if (!isValidPhoneNumber(phone)) {
      setError('Please enter a valid 11-digit mobile number starting with 01.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await checkPhone(phone);
      const { exists, has_password } = response.data;

      if (!exists) {
        setError('No account found with this phone number. Please sign up or check the number.');
      } else if (has_password) {
        setStep('password');
      } else {
        // Passwordless account (e.g. Guest Checkout)
        // Trigger OTP
        await requestOTP(phone);
        setStep('otp_setup');
        setResendCooldown(60);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify phone number. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setError('');
    try {
      await requestOTP(phone);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await login({ username: phone, password });
      if (res && res.two_factor_required) {
        setTwoFactorSetupRequired(!!res.two_factor_setup_required);
        setTwoFactorQRCode(res.qr_code || '');
        setStep('two_factor');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Invalid password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode) return;
    setIsLoading(true);
    setError('');

    try {
      await login({ username: phone, password, otp_code: twoFactorCode });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.non_field_errors?.[0] || err.response?.data?.error || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !newPassword) return;
    setIsLoading(true);
    setError('');

    try {
      await setupPassword({
        phone_number: phone,
        code: otpCode,
        new_password: newPassword
      });
      // Immediately log in using the newly set password
      await login({ username: phone, password: newPassword });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify OTP or setup password. Please try again.');
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
          <SEO title="Sign In" description={`Login to your ${siteTitle} account to manage orders and profile.`} />
          <div className="text-center mb-8">
            <img src={siteLogo} alt={siteTitle} className="w-30 mx-auto mb-4 object-contain" />
            <h1 className="text-2xl font-bold text-neutral-900">Welcome to {siteTitle}</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-brand/5 border border-red-100 rounded-xl flex items-start text-brand text-sm">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {step === 'phone' && (
            <motion.form 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handlePhoneSubmit} 
              className="space-y-6"
            >
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
                    className="block w-full pl-10 pr-3 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-brand text-white font-bold rounded-xl hover:bg-brand-hover focus:outline-none focus:ring-4 focus:ring-brand/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Checking Account...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </motion.form>
          )}

          {step === 'password' && (
            <motion.form 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handlePasswordSubmit} 
              className="space-y-6"
            >
              <div className="flex items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                <span className="text-sm text-neutral-600 font-medium">{phone}</span>
                <button 
                  type="button" 
                  onClick={() => setStep('phone')} 
                  className="text-xs text-brand font-bold hover:underline"
                >
                  Change
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-neutral-700">Password</label>
                  <Link to="/forgot-password" className="text-xs font-medium text-brand hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-12 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                    required
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

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="w-1/3 py-3 px-4 bg-neutral-100 text-neutral-700 font-bold rounded-xl hover:bg-neutral-200 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 py-3 px-4 bg-brand text-white font-bold rounded-xl hover:bg-brand-hover focus:outline-none focus:ring-4 focus:ring-brand/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            </motion.form>
          )}

          {step === 'otp_setup' && (
            <motion.form 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleOTPSetupSubmit} 
              className="space-y-6"
            >
              <div className="flex items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Guest Account</span>
                  <span className="text-sm text-neutral-600 font-medium">{phone}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setStep('phone')} 
                  className="text-xs text-brand font-bold hover:underline"
                >
                  Change
                </button>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-emerald-800 text-xs leading-relaxed">
                An OTP (One-Time Password) was sent to your mobile number. Please verify your number and setup your new password.
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">OTP Verification Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="e.g. 1234"
                    className="block w-full pl-10 pr-3 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-center tracking-widest font-mono font-bold"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Set New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="block w-full pl-10 pr-12 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 focus:outline-none"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-xs text-brand font-bold hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP Code'}
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="w-1/3 py-3 px-4 bg-neutral-100 text-neutral-700 font-bold rounded-xl hover:bg-neutral-200 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 py-3 px-4 bg-brand text-white font-bold rounded-xl hover:bg-brand-hover focus:outline-none focus:ring-4 focus:ring-brand/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Sign In'
                  )}
                </button>
              </div>
            </motion.form>
          )}

          {step === 'two_factor' && (
            <motion.form 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleTwoFactorSubmit} 
              className="space-y-6"
            >
              <div className="bg-brand/5 border border-brand/10 p-4 rounded-xl text-neutral-800 text-xs leading-relaxed text-left">
                <p className="font-bold mb-1.5 text-brand">Google Authenticator 2FA</p>
                {twoFactorSetupRequired ? (
                  <div className="space-y-3">
                    <p>Scan this QR code with Google Authenticator on your mobile device to complete configuration:</p>
                    {twoFactorQRCode && (
                      <div className="bg-white p-3 rounded-lg border border-neutral-100 flex justify-center">
                        <img src={twoFactorQRCode} alt="Google Authenticator QR Code" className="w-48 h-48" />
                      </div>
                    )}
                    <p className="text-[10px] text-neutral-400">Can't scan? Use the Authenticator app to add a new account and enter code manually if needed.</p>
                  </div>
                ) : (
                  <p>Open the Google Authenticator app on your device and enter the 6-digit code for <strong>{siteTitle}</strong>.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Verification Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="e.g. 123456"
                    className="block w-full pl-10 pr-3 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-center tracking-widest font-mono font-bold"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div className="text-center text-xs text-neutral-400">
                Codes regenerate automatically every 30 seconds.
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('password')}
                  className="w-1/3 py-3 px-4 bg-neutral-100 text-neutral-700 font-bold rounded-xl hover:bg-neutral-200 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 py-3 px-4 bg-brand text-white font-bold rounded-xl hover:bg-brand-hover focus:outline-none focus:ring-4 focus:ring-brand/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Log In'
                  )}
                </button>
              </div>
            </motion.form>
          )}

          <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <p className="text-sm text-neutral-500">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-brand hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;