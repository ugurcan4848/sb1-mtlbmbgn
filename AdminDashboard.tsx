import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Settings, Car, MessageSquare, BarChart, 
  Facebook, Instagram, Bell, AlertTriangle, CheckCircle,
  Trash2, Edit, Eye, Share2, Download, Filter, Search,
  ChevronDown, ChevronUp, CheckSquare, Square, RefreshCw,
  Lock, PieChart, LineChart, TrendingUp, Calendar,
  Phone, PhoneOff, Smartphone, UserX, Building2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'corporate' | 'listings' | 'messages' | 'settings'>('analytics');
  const [users, setUsers] = useState<any[]>([]);
  const [corporateUsers, setCorporateUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalListings: 0,
    totalMessages: 0,
    activeUsers: 0,
    dailyStats: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [socialPlatforms, setSocialPlatforms] = useState({
    facebook: false,
    instagram: false
  });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [showDeleteListingModal, setShowDeleteListingModal] = useState<string | null>(null);
  const [deletingListing, setDeletingListing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    appNotifications: true,
    marketingEmails: false
  });
  const [listingSearchTerm, setListingSearchTerm] = useState('');
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      switch (activeTab) {
        case 'analytics':
          // Fetch statistics
          const [
            { count: userCount },
            { count: listingCount },
            { count: messageCount }
          ] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact' }),
            supabase.from('car_listings').select('*', { count: 'exact' }),
            supabase.from('messages').select('*', { count: 'exact' })
          ]);

          // Get daily stats for the last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { data: dailyListings } = await supabase
            .from('car_listings')
            .select('created_at')
            .gte('created_at', thirtyDaysAgo.toISOString());

          const dailyStats = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            return {
              date: dateStr,
              listings: dailyListings?.filter(l => 
                l.created_at.split('T')[0] === dateStr
              ).length || 0
            };
          }).reverse();

          // For active users, count users who have created listings or sent messages in the last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const [{ data: recentListingUsers }, { data: recentMessageUsers }] = await Promise.all([
            supabase
              .from('car_listings')
              .select('user_id')
              .gte('created_at', sevenDaysAgo.toISOString()),
            supabase
              .from('messages')
              .select('sender_id')
              .gte('created_at', sevenDaysAgo.toISOString())
          ]);

          // Combine unique user IDs from both listings and messages
          const activeUserIds = new Set([
            ...(recentListingUsers?.map(l => l.user_id) || []),
            ...(recentMessageUsers?.map(m => m.sender_id) || [])
          ]);

          setStats({
            totalUsers: userCount,
            totalListings: listingCount,
            totalMessages: messageCount,
            activeUsers: activeUserIds.size,
            dailyStats
          });
          break;

        case 'users':
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('*')
            .eq('is_corporate', false)
            .order('created_at', { ascending: false });
          
          if (usersError) throw usersError;
          setUsers(usersData || []);
          break;

        case 'corporate':
          const { data: corporateData, error: corporateError } = await supabase
            .from('users')
            .select(`
              *,
              car_listings (
                id,
                brand,
                model,
                price,
                created_at
              )
            `)
            .eq('is_corporate', true)
            .order('created_at', { ascending: false });
          
          if (corporateError) throw corporateError;
          setCorporateUsers(corporateData || []);
          break;

        case 'listings':
          const { data: listingsData, error: listingsError } = await supabase
            .from('car_listings')
            .select(`
              *,
              users (
                id,
                full_name,
                email,
                is_corporate,
                company_name
              ),
              car_images (
                id,
                url
              )
            `)
            .order('created_at', { ascending: false });
          
          if (listingsError) throw listingsError;
          setListings(listingsData || []);
          break;

        case 'messages':
          const { data: messagesData, error: messagesError } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!sender_id(*),
              receiver:users!receiver_id(*),
              listing:car_listings(*)
            `)
            .order('created_at', { ascending: false });
          
          if (messagesError) throw messagesError;
          setMessages(messagesData || []);
          break;
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Veri yüklenirken bir hata oluştu');
      toast.error('Veri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    setChangingPassword(true);

    try {
      const adminSession = JSON.parse(localStorage.getItem('adminSession') || '{}');
      
      const { data, error } = await supabase.rpc('change_admin_password', {
        admin_id: adminSession.id,
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });

      if (error) throw error;

      if (!data.success) {
        toast.error(data.error);
        return;
      }

      toast.success('Şifre başarıyla güncellendi');
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error('Şifre değiştirilemedi');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSocialToggle = async (platform: 'facebook' | 'instagram') => {
    try {
      setSocialPlatforms(prev => ({
        ...prev,
        [platform]: !prev[platform]
      }));

      // Here you would update the platform status in your database
      toast.success(`${platform === 'facebook' ? 'Facebook' : 'Instagram'} ${
        socialPlatforms[platform] ? 'devre dışı bırakıldı' : 'etkinleştirildi'
      }`);
    } catch (err) {
      console.error(`Error toggling ${platform}:`, err);
      toast.error(`${platform === 'facebook' ? 'Facebook' : 'Instagram'} durumu güncellenemedi`);
      
      // Revert the toggle on error
      setSocialPlatforms(prev => ({
        ...prev,
        [platform]: !prev[platform]
      }));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setDeletingUser(true);
      
      const { error } = await supabase.rpc('delete_user_data', {
        target_uid: userId
      });

      if (error) throw error;

      // Remove user from local state
      if (activeTab === 'corporate') {
        setCorporateUsers(corporateUsers.filter(u => u.id !== userId));
      } else {
        setUsers(users.filter(u => u.id !== userId));
      }
      
      setShowDeleteUserModal(false);
      toast.success('Kullanıcı başarıyla silindi');
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Kullanıcı silinemedi');
    } finally {
      setDeletingUser(false);
    }
  };

  const handleBlockUser = async (userId: string, reason: string) => {
    try {
      const { error } = await supabase.rpc('block_user', {
        target_uid: userId,
        block_reason: reason,
        admin_id: JSON.parse(localStorage.getItem('adminSession') || '{}').id
      });

      if (error) throw error;

      // Update user in local state
      const updateUser = (user: any) => ({
        ...user,
        is_blocked: true,
        block_reason: reason,
        blocked_at: new Date().toISOString()
      });

      if (activeTab === 'corporate') {
        setCorporateUsers(corporateUsers.map(u => 
          u.id === userId ? updateUser(u) : u
        ));
      } else {
        setUsers(users.map(u => 
          u.id === userId ? updateUser(u) : u
        ));
      }

      toast.success('Kullanıcı engellendi');
    } catch (err) {
      console.error('Error blocking user:', err);
      toast.error('Kullanıcı engellenemedi');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('unblock_user', {
        target_uid: userId
      });

      if (error) throw error;

      // Update user in local state
      const updateUser = (user: any) => ({
        ...user,
        is_blocked: false,
        block_reason: null,
        blocked_at: null,
        blocked_by: null
      });

      if (activeTab === 'corporate') {
        setCorporateUsers(corporateUsers.map(u => 
          u.id === userId ? updateUser(u) : u
        ));
      } else {
        setUsers(users.map(u => 
          u.id === userId ? updateUser(u) : u
        ));
      }

      toast.success('Kullanıcı engeli kaldırıldı');
    } catch (err) {
      console.error('Error unblocking user:', err);
      toast.error('Kullanıcı engeli kaldırılamadı');
    }
  };

  const handleToggleWhatsApp = async (user: any) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          whatsapp_enabled: !user.whatsapp_enabled 
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => 
        u.id === user.id 
          ? { ...u, whatsapp_enabled: !u.whatsapp_enabled }
          : u
      ));

      toast.success(`WhatsApp ${user.whatsapp_enabled ? 'devre dışı bırakıldı' : 'etkinleştirildi'}`);
    } catch (err) {
      console.error('Error toggling WhatsApp:', err);
      toast.error('WhatsApp durumu güncellenemedi');
    }
  };

  const handleToggleInstagram = async (user: any) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          instagram_enabled: !user.instagram_enabled 
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => 
        u.id === user.id 
          ? { ...u, instagram_enabled: !u.instagram_enabled }
          : u
      ));

      toast.success(`Instagram ${user.instagram_enabled ? 'devre dışı bırakıldı' : 'etkinleştirildi'}`);
    } catch (err) {
      console.error('Error toggling Instagram:', err);
      toast.error('Instagram durumu güncellenemedi');
    }
  };

  const handleUpdateNotificationSettings = () => {
    toast.success('Bildirim ayarları güncellendi');
  };

  const handleDeleteListing = async (listingId: string) => {
    try {
      setDeletingListing(listingId);
      
      // Get admin session
      const adminSession = JSON.parse(localStorage.getItem('adminSession') || '{}');
      
      // Call the delete_fake_listing function
      const { error } = await supabase.rpc('delete_fake_listing', {
        listing_id: listingId,
        admin_id: adminSession.id,
        reason: 'Admin tarafından silindi'
      });

      if (error) throw error;

      // Remove listing from local state
      setListings(listings.filter(listing => listing.id !== listingId));
      
      setShowDeleteListingModal(null);
      toast.success('İlan başarıyla silindi');
    } catch (err) {
      console.error('Error deleting listing:', err);
      toast.error('İlan silinemedi');
    } finally {
      setDeletingListing(null);
    }
  };

  const tabs = [
    { id: 'analytics', label: 'İstatistikler', icon: BarChart },
    { id: 'users', label: 'Bireysel Kullanıcılar', icon: Users },
    { id: 'corporate', label: 'Kurumsal Kullanıcılar', icon: Building2 },
    { id: 'listings', label: 'İlanlar', icon: Car },
    { id: 'messages', label: 'Mesajlar', icon: MessageSquare },
    { id: 'settings', label: 'Ayarlar', icon: Settings }
  ];

  const filteredCorporateUsers = corporateUsers.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.company_name?.toLowerCase().includes(searchLower) ||
      user.tax_number?.toLowerCase().includes(searchLower)
    );
  });

  const filteredUsers = users.filter(user => {
    if (!userSearchTerm) return true;
    const searchLower = userSearchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower)
    );
  });

  const filteredListings = listings.filter(listing => {
    if (!listingSearchTerm) return true;
    const searchLower = listingSearchTerm.toLowerCase();
    return (
      listing.brand?.toLowerCase().includes(searchLower) ||
      listing.model?.toLowerCase().includes(searchLower) ||
      listing.users?.full_name?.toLowerCase().includes(searchLower) ||
      listing.users?.company_name?.toLowerCase().includes(searchLower)
    );
  });

  const filteredMessages = messages.filter(message => {
    if (!messageSearchTerm) return true;
    const searchLower = messageSearchTerm.toLowerCase();
    return (
      message.content?.toLowerCase().includes(searchLower) ||
      message.sender?.full_name?.toLowerCase().includes(searchLower) ||
      message.receiver?.full_name?.toLowerCase().includes(searchLower)
    );
  });

  // Prepare data for pie chart
  const userTypeData = [
    { name: 'Bireysel', value: stats.totalUsers - corporateUsers.length, color: '#4F46E5' },
    { name: 'Kurumsal', value: corporateUsers.length, color: '#06B6D4' }
  ];

  // Random listing status data for demo
  const listingStatusData = [
    { name: 'Aktif', value: Math.floor(stats.totalListings * 0.7), color: '#10B981' },
    { name: 'Beklemede', value: Math.floor(stats.totalListings * 0.2), color: '#F59E0B' },
    { name: 'Satıldı', value: Math.floor(stats.totalListings * 0.1), color: '#6366F1' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-4">
        <div className="flex items-center space-x-2 mb-8">
          <Car className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <span className="text-xl font-bold text-gray-800 dark:text-white">Admin Panel</span>
        </div>

        <nav className="space-y-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-gray-600 dark:text-gray-300">Yükleniyor...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
            {error}
          </div>
        ) : (
          <>
            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Platform İstatistikleri
                  </h2>
                  <button
                    onClick={() => fetchData()}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Kullanıcı</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.totalUsers}</h3>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        +5% geçen haftaya göre
                      </span>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam İlan</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.totalListings}</h3>
                      </div>
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <Car className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        +12% geçen aya göre
                      </span>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Mesaj</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.totalMessages}</h3>
                      </div>
                      <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                        <MessageSquare className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        +18% geçen aya göre
                      </span>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aktif Kullanıcı</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.activeUsers}</h3>
                      </div>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        +8% geçen haftaya göre
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Daily Listings Chart */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm lg:col-span-2"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">İlan Yayınlama Trendi</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={stats.dailyStats}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorListings" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(date) => {
                              const d = new Date(date);
                              return `${d.getDate()}/${d.getMonth() + 1}`;
                            }}
                            stroke="#9CA3AF"
                          />
                          <YAxis stroke="#9CA3AF" />
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: 'none',
                              borderRadius: '0.5rem',
                              color: '#F3F4F6'
                            }}
                            itemStyle={{ color: '#F3F4F6' }}
                            labelStyle={{ color: '#F3F4F6', fontWeight: 'bold' }}
                            formatter={(value) => [`${value} ilan`, null]}
                            labelFormatter={(date) => {
                              const d = new Date(date);
                              return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="listings" 
                            stroke="#6366F1" 
                            fillOpacity={1} 
                            fill="url(#colorListings)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* Pie Charts */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Kullanıcı Dağılımı</h3>
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={userTypeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {userTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: 'none',
                              borderRadius: '0.5rem',
                              color: '#F3F4F6'
                            }}
                            formatter={(value) => [`${value} kullanıcı`, null]}
                          />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center mt-2 space-x-6">
                      {userTypeData.map((entry, index) => (
                        <div key={index} className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: entry.color }}
                          ></div>
                          <span className="text-xs text-gray-600 dark:text-gray-300">{entry.name}</span>
                        </div>
                      ))}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mt-6 mb-2">İlan Durumları</h3>
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={listingStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {listingStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: 'none',
                              borderRadius: '0.5rem',
                              color: '#F3F4F6'
                            }}
                            formatter={(value) => [`${value} ilan`, null]}
                          />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center mt-2 space-x-4">
                      {listingStatusData.map((entry, index) => (
                        <div key={index} className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: entry.color }}
                          ></div>
                          <span className="text-xs text-gray-600 dark:text-gray-300">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Bireysel Kullanıcı Yönetimi
                  </h2>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        placeholder="Ara..."
                        className="pl-10 pr-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={() => fetchData()}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Kullanıcı
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            İletişim
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Durum
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Kayıt Tarihi
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            İletişim Tercihleri
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredUsers.map(user => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                                    {user.full_name?.charAt(0)}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {user.full_name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {user.phone || "Telefon yok"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.is_blocked
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                    : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                }`}
                              >
                                {user.is_blocked ? "Engelli" : "Aktif"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(user.created_at).toLocaleDateString("tr-TR")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleToggleWhatsApp(user)}
                                  className={`flex items-center justify-center h-8 w-8 rounded-full ${
                                    user.whatsapp_enabled
                                      ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                                  }`}
                                  title={`WhatsApp ${user.whatsapp_enabled ? "Açık" : "Kapalı"}`}
                                >
                                  <Phone className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleInstagram(user)}
                                  className={`flex items-center justify-center h-8 w-8 rounded-full ${
                                    user.instagram_enabled
                                      ? "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
                                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                                  }`}
                                  title={`Instagram ${user.instagram_enabled ? "Açık" : "Kapalı"}`}
                                >
                                  <Instagram className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                {user.is_blocked ? (
                                  <button
                                    onClick={() => handleUnblockUser(user.id)}
                                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                                    title="Engeli Kaldır"
                                  >
                                    <CheckCircle className="w-5 h-5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleBlockUser(user.id, "Kurumsal hesap engellendi")}
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                    title="Engelle"
                                  >
                                    <AlertTriangle className="w-5 h-5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowDeleteUserModal(true);
                                  }}
                                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                  title="Sil"
                                >
                                  <UserX className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Corporate Tab */}
            {activeTab === 'corporate' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Kurumsal Kullanıcı Yönetimi
                  </h2>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Ara..."
                        className="pl-10 pr-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={() => fetchData()}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Firma Bilgileri
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Yetkili
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            İlan Sayısı
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Üyelik Durumu
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Kayıt Tarihi
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredCorporateUsers.map(user => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.company_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Vergi No: {user.tax_number}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {user.full_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {user.car_listings?.length || 0}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.subscription_status === 'trial'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                  : user.subscription_status === 'active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                              }`}>
                                {user.subscription_status === 'trial' ? 'Deneme' :
                                 user.subscription_status === 'active' ? 'Aktif' : 'Ücretsiz'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(user.created_at).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                {user.is_blocked ? (
                                  <button
                                    onClick={() => handleUnblockUser(user.id)}
                                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                                    title="Engeli Kaldır"
                                  >
                                    <CheckCircle className="w-5 h-5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleBlockUser(user.id, 'Kurumsal hesap engellendi')}
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                    title="Engelle"
                                  >
                                    <AlertTriangle className="w-5 h-5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowDeleteUserModal(true);
                                  }}
                                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                  title="Sil"
                                >
                                  <UserX className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    İlan Yönetimi
                  </h2>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={listingSearchTerm}
                        onChange={(e) => setListingSearchTerm(e.target.value)}
                        placeholder="Marka, model veya satıcı ara..."
                        className="pl-10 pr-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                      />
                    </div>
                    <button
                      onClick={() => fetchData()}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Araç
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Satıcı
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Fiyat
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Durum
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Yayın Tarihi
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredListings.map(listing => (
                          <tr key={listing.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-12 w-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700">
                                  {listing.car_images && listing.car_images.length > 0 ? (
                                    <img 
                                      src={listing.car_images[0].url} 
                                      alt={`${listing.brand} ${listing.model}`}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                      <Car className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {listing.brand} {listing.model}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {listing.year} • {listing.fuel_type} • {listing.transmission}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {listing.users?.is_corporate ? listing.users.company_name : listing.users?.full_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {listing.users?.is_corporate ? 'Kurumsal' : 'Bireysel'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {new Intl.NumberFormat('tr-TR', {
                                  style: 'currency',
                                  currency: 'TRY',
                                  minimumFractionDigits: 0
                                }).format(listing.price)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                listing.is_active
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : listing.is_sold
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              }`}>
                                {listing.is_active
                                  ? 'Aktif'
                                  : listing.is_sold
                                  ? 'Satıldı'
                                  : 'Beklemede'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(listing.created_at).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <button
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                  title="Görüntüle"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteListingModal(listing.id)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                  title="Sil"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Mesaj Yönetimi
                  </h2>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={messageSearchTerm}
                        onChange={(e) => setMessageSearchTerm(e.target.value)}
                        placeholder="Mesaj içeriği veya kullanıcı ara..."
                        className="pl-10 pr-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                      />
                    </div>
                    <button
                      onClick={() => fetchData()}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Gönderen
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Alıcı
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            İlan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Mesaj
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Tarih
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredMessages.map(message => (
                          <tr key={message.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {message.sender?.full_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {message.sender?.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {message.receiver?.full_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {message.receiver?.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {message.listing?.brand} {message.listing?.model}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 dark:text-white line-clamp-2">
                                {message.content}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(message.created_at).toLocaleString('tr-TR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <button
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                  title="Görüntüle"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteListingModal(listing.id)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                  title="Sil"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Sistem Ayarları
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Security Settings */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      <div className="flex items-center">
                        <Lock className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                        Güvenlik Ayarları
                      </div>
                    </h3>

                    <div className="space-y-4">
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Şifre Değiştir
                      </button>

                      <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            İki Faktörlü Doğrulama
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Hesabınıza ekstra güvenlik ekler
                          </p>
                        </div>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            IP Kısıtlaması
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Belirli IP adreslerinden erişim
                          </p>
                        </div>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Oturum Süresi
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            8 saat sonra otomatik çıkış yap
                          </p>
                        </div>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      <div className="flex items-center">
                        <Bell className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                        Bildirim Ayarları
                      </div>
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            E-posta Bildirimleri
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Sistem bildirimleri için e-posta gönder
                          </p>
                        </div>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.emailNotifications}
                              onChange={() => setNotificationSettings({
                                ...notificationSettings,
                                emailNotifications: !notificationSettings.emailNotifications
                              })}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Uygulama Bildirimleri
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Admin panelde bildirim göster
                          </p>
                        </div>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.appNotifications}
                              onChange={() => setNotificationSettings({
                                ...notificationSettings,
                                appNotifications: !notificationSettings.appNotifications
                              })}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Pazarlama E-postaları
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Yeni özellikler ve duyurular için e-posta gönder
                          </p>
                        </div>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.marketingEmails}
                              onChange={() => setNotificationSettings({
                                ...notificationSettings,
                                marketingEmails: !notificationSettings.marketingEmails
                              })}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      <button
                        onClick={handleUpdateNotificationSettings}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Bildirimleri Güncelle
                      </button>
                    </div>
                  </div>

                  {/* Social Integration */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      <div className="flex items-center">
                        <Share2 className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                        Sosyal Medya Entegrasyonu
                      </div>
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg mr-3">
                            <Facebook className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Facebook</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              İlanları otomatik paylaş
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={socialPlatforms.facebook}
                              onChange={() => handleSocialToggle('facebook')}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                          <div className="p-2 bg-pink-100 dark:bg-pink-900/20 rounded-lg mr-3">
                            <Instagram className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Instagram</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              İlanları Instagram'da paylaş
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={socialPlatforms.instagram}
                              onChange={() => handleSocialToggle('instagram')}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Backup */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                      <div className="flex items-center">
                        <Download className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                        Sistem Yedekleme
                      </div>
                    </h3>

                    <div className="space-y-4">
                      <div className="py-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Son yedekleme: <span className="font-medium text-gray-900 dark:text-white">12.06.2023, 14:30</span>
                        </p>

                        <div className="flex flex-col space-y-2">
                          <button className="w-full px-4 py-2 border border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            Manuel Yedekleme Oluştur
                          </button>
                          <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            Yedekleme İndir
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Otomatik Yedekleme
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Her gün 02:00'de otomatik yedekle
                          </p>
                        </div>
                        <div className="flex items-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete User Confirmation Modal */}
      {showDeleteUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Kullanıcıyı Sil
            </h3>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>{selectedUser.company_name || selectedUser.full_name}</strong> adlı {selectedUser.is_corporate ? 'kurumsal' : ''} kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve kullanıcının tüm verileri silinecektir.
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteUserModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => handleDeleteUser(selectedUser.id)}
                disabled={deletingUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                {deletingUser ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Siliniyor...</span>
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4" />
                    <span>Sil</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Şifre Değiştir
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mevcut Şifre
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Şifreyi Onayla
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  {changingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Değiştiriliyor...</span>
                    </>
                  ) : (
                    <span>Şifreyi Değiştir</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminDashboard;