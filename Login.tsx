import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, CheckCircle, Building2, Phone } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import { PhoneInput } from '../components/PhoneInput';
import { PasswordInput } from '../components/PasswordInput';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isCorporate, setIsCorporate] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const message = location.state?.message;

  // Client-side validation function
  const validateInputs = () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      throw new Error('E-posta adresi gereklidir.');
    }
    if (!emailRegex.test(email)) {
      throw new Error('Geçerli bir e-posta adresi giriniz.');
    }

    // Password validation
    if (!password.trim()) {
      throw new Error('Şifre gereklidir.');
    }
    if (password.length < 6) {
      throw new Error('Şifre en az 6 karakter olmalıdır.');
    }

    // Phone validation for corporate users
    if (isCorporate) {
      if (!phone.trim()) {
        throw new Error('Kurumsal hesaplar için telefon numarası gereklidir.');
      }
      // Remove any non-digit characters and check length
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        throw new Error('Geçerli bir telefon numarası giriniz.');
      }
    }
  };

  const handleResendVerification = async () => {
    setResendingVerification(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (resendError) throw resendError;

      toast.success('Doğrulama e-postası yeniden gönderildi');
    } catch (err: any) {
      console.error('Verification resend error:', err);
      toast.error('Doğrulama e-postası gönderilemedi');
      setError('Doğrulama e-postası gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setResendingVerification(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowVerificationPrompt(false);

    try {
      validateInputs();

      // First check if user is blocked
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_blocked, block_reason')
        .eq('email', email)
        .single();

      if (userError && userError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw userError;
      }

      if (userData?.is_blocked) {
        const blockReason = userData.block_reason ? `: ${userData.block_reason}` : '';
        throw new Error(`Hesabınız engellenmiştir${blockReason}. Destek ekibiyle iletişime geçiniz.`);
      }

      const result = await signIn(email, password, rememberMe, isCorporate, phone);
      
      // If we get here, login was successful
      toast.success('Giriş başarılı');
      
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Check for email not confirmed error
      if (err?.message?.includes('Email not confirmed') || err?.message?.includes('email_not_confirmed')) {
        setShowVerificationPrompt(true);
        setError('E-posta adresiniz henüz doğrulanmamış. Lütfen e-posta kutunuzu kontrol edin veya yeni bir doğrulama e-postası gönderin.');
        toast.error('E-posta doğrulanmamış');
      } else if (err?.message?.includes('Hesabınız engellenmiştir')) {
        setError(err.message);
        toast.error('Hesap engellendi');
      } else if (err?.message?.includes('invalid_credentials') || err?.message?.includes('Invalid login credentials')) {
        setError('E-posta veya şifre yanlış. Lütfen bilgilerinizi kontrol edin ve tekrar deneyin.');
        toast.error('Giriş başarısız: Geçersiz kimlik bilgileri');
      } else if (err?.message?.includes('E-posta adresi gereklidir')) {
        setError(err.message);
        toast.error('E-posta adresi gereklidir');
      } else if (err?.message?.includes('Geçerli bir e-posta')) {
        setError(err.message);
        toast.error('Geçersiz e-posta formatı');
      } else if (err?.message?.includes('Şifre')) {
        setError(err.message);
        toast.error('Şifre hatası');
      } else if (err?.message?.includes('telefon')) {
        setError(err.message);
        toast.error('Telefon numarası hatası');
      } else if (err?.message?.includes('network')) {
        setError('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.');
        toast.error('Bağlantı hatası');
      } else {
        setError('Giriş yapılamadı. Lütfen daha sonra tekrar deneyin veya destek ekibiyle iletişime geçin.');
        toast.error('Beklenmeyen bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Email validation for reset password
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim()) {
        throw new Error('E-posta adresi gereklidir.');
      }
      if (!emailRegex.test(email)) {
        throw new Error('Geçerli bir e-posta adresi giriniz.');
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setResetEmailSent(true);
      setShowResetPassword(false);
      toast.success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Şifre sıfırlama e-postası gönderilemedi. Lütfen tekrar deneyin.');
      toast.error('Şifre sıfırlama başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[80vh] flex items-center justify-center"
    >
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Hoş Geldiniz</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {showResetPassword ? 'Şifrenizi sıfırlayın' : 'Hesabınıza giriş yapın'}
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-center space-x-4">
              <button
                type="button"
                onClick={() => setIsCorporate(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !isCorporate 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Bireysel
              </button>
              <button
                type="button"
                onClick={() => setIsCorporate(true)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isCorporate 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Kurumsal
              </button>
            </div>
          </div>
          
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-lg mb-6 flex items-center space-x-2"
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{message}</span>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6 flex items-center space-x-2"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
              {showVerificationPrompt && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  className="ml-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                >
                  {resendingVerification ? 'Gönderiliyor...' : 'Yeniden Gönder'}
                </button>
              )}
            </motion.div>
          )}

          {resetEmailSent ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Şifre Sıfırlama Bağlantısı Gönderildi
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                E-posta adresinize şifre sıfırlama bağlantısı gönderdik. Lütfen gelen kutunuzu ve spam klasörünüzü kontrol edin.
              </p>
              <button
                type="button"
                onClick={() => {
                  setResetEmailSent(false);
                  setShowResetPassword(false);
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Giriş sayfasına dön
              </button>
            </div>
          ) : showResetPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-posta
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="reset-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ornek@email.com"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Gönderiliyor...</span>
                    </>
                  ) : (
                    <span>Şifre Sıfırlama Bağlantısı Gönder</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetPassword(false)}
                  className="text-gray-600 dark:text-gray-400 hover:underline text-sm"
                >
                  Giriş sayfasına dön
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-posta
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="login-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ornek@email.com"
                    required
                  />
                </div>
              </div>

              {isCorporate && (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Telefon
                  </label>
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                  />
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Şifre
                </label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={setPassword}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Beni hatırla
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Şifremi unuttum
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Giriş yapılıyor...</span>
                  </>
                ) : (
                  <span>Giriş Yap</span>
                )}
              </button>
            </form>
          )}

          {!showResetPassword && !resetEmailSent && (
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Hesabınız yok mu?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Kayıt Ol
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Login;