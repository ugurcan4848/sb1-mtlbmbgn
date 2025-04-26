import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Car, MessageSquare, User, Plus, HelpCircle, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext'; // Make sure this path is correct

interface MobileNavProps {
  unreadCount: number;
  onHelpClick: () => void;
  isHelpDialogOpen?: boolean; // New prop to track help dialog state
}

export const MobileNav: React.FC<MobileNavProps> = ({ 
  unreadCount, 
  onHelpClick,
  isHelpDialogOpen = false // Default to false if not provided
}) => {
  const location = useLocation();
  const pathname = location.pathname;
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '#help') return isHelpDialogOpen;
    if (path === '/') return pathname === path;
    return pathname.startsWith(path);
  };

  const navItems = [
    { path: '/listings', icon: Car, label: 'İlanlar' },
    { path: '/create-listing', icon: Plus, label: 'İlan Ver' },
    { 
      path: '/messages', 
      icon: MessageSquare, 
      label: 'Mesajlar',
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    { path: '/profile', icon: User, label: 'Profil' },
    { 
      path: '#help', 
      icon: HelpCircle, 
      label: 'Yardım',
      onClick: onHelpClick
    },
    { 
      path: '#logout', 
      icon: LogOut,
      label: 'Çıkış',
      onClick: signOut,
      className: 'text-red-600 dark:text-red-400'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 z-50 md:hidden">
      <div className="grid grid-cols-6 h-16">
        {navItems.map(({ path, icon: Icon, label, badge, onClick, className }) => {
          const active = isActive(path);
          const Component = onClick ? 'button' : Link;
          const props = onClick ? { onClick } : { to: path };

          return (
            <Component
              key={path}
              {...props}
              className="relative flex flex-col items-center justify-center"
            >
              {active && (
                <motion.div
                  layoutId="bubble"
                  className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20"
                  style={{ borderRadius: 8 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="relative">
                <Icon
                  className={`w-6 h-6 ${
                    className || (active
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400')
                  }`}
                />
                {badge !== undefined && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {badge}
                  </span>
                )}
              </div>
              <span
                className={`text-xs mt-1 ${
                  className || (active
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-500 dark:text-gray-400')
                }`}
              >
                {label}
              </span>
            </Component>
          );
        })}
      </div>
    </nav>
  );
};