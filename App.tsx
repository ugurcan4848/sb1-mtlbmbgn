import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import { ThemeProvider } from './components/ThemeContext';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CarListings from './pages/CarListings';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/listings" element={<CarListings />} />
                  <Route path="/listings/:id" element={<ListingDetail />} />
                  <Route path="/listings/:id/edit" element={<EditListing />} />
                  <Route path="/create-listing" element={<CreateListing />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
                  <Route path="/admin/dashboard" element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } />
                </Routes>
              </AnimatePresence>
            </main>
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 4000,
                className: 'dark:bg-gray-800 dark:text-white',
              }}
            />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;