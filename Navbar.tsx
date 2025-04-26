import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, MessageSquare, User, Plus, HelpCircle, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { motion } from 'framer-motion';
import { MobileNav } from './MobileNav';
import { HelpDialog } from './HelpDialog';
import { supabase } from '../lib/supabase';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [showHelpDialog, setShowHelpDialog] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      // Get initial unread count
      const fetchUnreadCount = async () => {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact' })
          .eq('receiver_id', user.id)
          .eq('read', false);
        
        setUnreadCount(count || 0);
      };

      fetchUnreadCount();

      // Subscribe to new messages
      const subscription = supabase
        .channel('messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        }, () => {
          // Only increment if not on messages page
          if (!location.pathname.startsWith('/messages')) {
            setUnreadCount(prev => prev + 1);
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        }, (payload) => {
          if (payload.new.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, location.pathname]);

  // Clear notifications when messages page is opened
  React.useEffect(() => {
    if (location.pathname.startsWith('/messages') && user && unreadCount > 0) {
      setUnreadCount(0);
      
      // Mark all messages as read
      supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('read', false)
        .then(({ error }) => {
          if (error) {
            console.error('Error marking messages as read:', error);
          }
        });
    }
  }, [location.pathname, user, unreadCount]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg transition-all duration-200 z-50 w-full border-b border-gray-200 dark:border-gray-700"
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link 
              to="/" 
              className="flex items-center space-x-2 group"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center shadow-lg"
              >
                <Car className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-200 bg-clip-text text-transparent">
              Autinoa
              </span>
            </Link>
            
            <div className="flex items-center space-x-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </motion.button>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                {user ? (
                  <>
                    <motion.div className="flex items-center space-x-1">
                      <Link
                        to="/listings"
                        className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                          isActive('/listings')
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Car className="w-5 h-5" />
                        <span>İlanlar</span>
                      </Link>
                      
                      <Link
                        to="/create-listing"
                        className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                          isActive('/create-listing')
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Plus className="w-5 h-5" />
                        <span>İlan Ver</span>
                      </Link>

                      <Link
                        to="/messages"
                        className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 relative ${
                          isActive('/messages')
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span>Mesajlar</span>
                        {unreadCount > 0 && !isActive('/messages') && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 shadow-lg"
                          >
                            {unreadCount}
                          </motion.span>
                        )}
                      </Link>
                      
                      <Link
                        to="/profile"
                        className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                          isActive('/profile')
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <User className="w-5 h-5" />
                        <span>Profil</span>
                      </Link>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowHelpDialog(true)}
                        className="px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <HelpCircle className="w-5 h-5" />
                        <span>Yardım</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => signOut()}
                        className="px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 flex items-center space-x-2"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Çıkış</span>
                      </motion.button>
                    </motion.div>
                  </>
                ) : (
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/login')}
                      className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                    >
                      Giriş Yap
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/register')}
                      className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Kayıt Ol
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                {!user && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 shadow-lg"
                  >
                    Giriş
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      {user && (
        <MobileNav 
          unreadCount={unreadCount} 
          onHelpClick={() => setShowHelpDialog(true)} 
        />
      )}

      {/* Help Dialog */}
      <HelpDialog 
        isOpen={showHelpDialog} 
        onClose={() => setShowHelpDialog(false)} 
      />

      {/* Content Padding for Fixed Navigation */}
      <div className="h-16" /> {/* Top navbar spacing */}
      {user && <div className="h-16 md:h-0" />} {/* Bottom navbar spacing on mobile */}
    </>
  );
};

export default Navbar;