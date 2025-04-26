import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const location = useLocation();
  
  const checkAdminSession = () => {
    const session = localStorage.getItem('adminSession');
    if (!session) return false;

    try {
      const { timestamp } = JSON.parse(session);
      const now = Date.now();
      const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

      if (now - timestamp > SESSION_DURATION) {
        localStorage.removeItem('adminSession');
        return false;
      }

      return true;
    } catch (error) {
      localStorage.removeItem('adminSession');
      return false;
    }
  };

  const isAuthenticated = checkAdminSession();

  if (!isAuthenticated) {
    // Store the attempted URL to redirect back after login
    return <Navigate to="/admin/login" state={{ returnTo: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;