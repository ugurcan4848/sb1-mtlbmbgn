import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe: boolean, isCorporate?: boolean, phone?: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, isCorporate?: boolean, companyDetails?: { companyName: string; taxNumber: string; phone: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, rememberMe: boolean, isCorporate = false, phone?: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: {
          persistSession: rememberMe
        }
      });
      
      if (error) throw error;

      // Update user profile with corporate status and phone if provided
      if (isCorporate) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            is_corporate: true,
            phone: phone
          })
          .eq('id', (await supabase.auth.getUser()).data.user?.id);

        if (updateError) throw updateError;
      }

      // Check if there's a return path after login
      const state = location.state as { returnTo?: string } | undefined;
      navigate(state?.returnTo || '/');
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, isCorporate = false, companyDetails?: { companyName: string; taxNumber: string; phone: string }) => {
    try {
      const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          persistSession: true
        }
      });
      
      if (signUpError) throw signUpError;

      if (newUser) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: newUser.id,
            email: email,
            full_name: fullName,
            is_corporate: isCorporate,
            phone: companyDetails?.phone,
            company_name: companyDetails?.companyName,
            tax_number: companyDetails?.taxNumber
          }]);

        if (profileError) throw profileError;

        // For corporate users, automatically sign in
        if (isCorporate && companyDetails) {
          await signIn(email, password, true, true, companyDetails.phone);
          return;
        }
      }

      // For non-corporate users, redirect to login
      navigate('/login', { 
        state: { 
          message: 'Kayıt başarılı! Lütfen giriş yapın.' 
        }
      });
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-ypssarwodapubfasnryd-auth-token');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error during sign out:', error);
      }
      
      navigate('/login');
    } catch (error) {
      console.error('Error during sign out:', error);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);