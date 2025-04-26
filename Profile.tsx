import React, { useState } from 'react';
import { User, Car, MessageSquare, Settings, Trash2, X, AlertCircle, Phone, Mail, Calendar, Edit, Lock } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { getUserProfile, updateUserProfile, getUserListings, deleteCarListing, deleteAccount, getMessages } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { VerificationDialog } from '../components/VerificationDialog';
import { PasswordDialog } from '../components/PasswordDialog';
import { Message } from '../lib/types';
import { PhoneInput } from '../components/PhoneInput';
import { ProfileForm } from '../components/ProfileForm';

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  React.useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const [profileData, listingsData, messagesData] = await Promise.all([
        getUserProfile(user!.id),
        getUserListings(user!.id),
        getMessages(user!.id)
      ]);
      
      setProfile(profileData);
      setListings(listingsData);
      setMessages(messagesData);
      setEditForm({
        full_name: profileData?.full_name || '',
        phone: profileData?.phone || '',
      });
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Profil bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const updatedProfile = await updateUserProfile(user!.id, editForm);
      setProfile(updatedProfile);
      setIsEditing(false);
      toast.success('Profil başarıyla güncellendi');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Profil güncellenirken bir hata oluştu.');
      toast.error('Profil güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailVerified = (newEmail: string) => {
    setProfile(prev => ({ ...prev, email: newEmail }));
  };

  const handlePhoneVerified = (newPhone: string) => {
    setProfile(prev => ({ ...prev, phone: newPhone }));
    setEditForm(prev => ({ ...prev, phone: newPhone }));
  };

  const handleDeleteListing = async (listingId: string) => {
    if (deleting) return;
    setDeleting(listingId);
    setError('');

    try {
      await deleteCarListing(listingId);
      const listingsData = await getUserListings(user!.id);
      setListings(listingsData);
      toast.success('İlan başarıyla silindi');
    } catch (err) {
      console.error('Error deleting listing:', err);
      setError('İlan silinirken bir hata oluştu.');
      toast.error('İlan silinirken bir hata oluştu');
    } finally {
      setDeleting(null);
      setShowDeleteConfirm(null);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setError('');
      const result = await deleteAccount();
      if (result.success) {
        await signOut();
        navigate('/');
        toast.success('Hesabınız başarıyla silindi');
      } else {
        throw new Error('Hesap silme işlemi başarısız oldu');
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Hesap silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      toast.error('Hesap silinirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-300">Yükleniyor...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-300">
        Profil bulunamadı.
      </div>
    );
  }

  const membershipDuration = formatDistanceToNow(new Date(profile.created_at), {
    addSuffix: true,
    locale: tr
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0"
    >
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Header */}
      <motion.div 
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <ProfileForm
                  profile={profile}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  onSubmit={handleEditSubmit}
                  saving={saving}
                  onEmailClick={() => setShowEmailDialog(true)}
                  onPasswordClick={() => setShowPasswordDialog(true)}
                />
              ) : (
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white truncate">
                    {profile.full_name}
                  </h1>
                  <div className="space-y-1 text-gray-600 dark:text-gray-300">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{profile.phone || 'Telefon numarası eklenmemiş'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Üyelik: {membershipDuration}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {!isEditing && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Düzenle</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm('account')}
                className="btn-secondary text-red-600 dark:text-red-400 flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hesabı Sil</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md"
        >
          <div className="flex items-center space-x-3">
            <Car className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">İlanlarım</h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{listings.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md cursor-pointer"
          onClick={() => navigate('/messages')}
        >
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Mesajlar</h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{messages.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md"
        >
          <div className="flex items-center space-x-3">
            <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Ayarlar</h3>
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Profili Düzenle
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* My Listings */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-4"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">İlanlarım</h2>
          <button
            onClick={() => navigate('/create-listing')}
            className="btn-primary"
          >
            Yeni İlan Ekle
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((listing, index) => (
            <motion.div 
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
            >
              <div 
                className="aspect-w-16 aspect-h-9 h-48 cursor-pointer"
                onClick={() => navigate(`/listings/${listing.id}`)}
              >
                {listing.car_images && listing.car_images.length > 0 ? (
                  <img
                    src={listing.car_images[0].url}
                    alt={`${listing.brand} ${listing.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Car className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {listing.brand} {listing.model} {listing.year}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {listing.mileage.toLocaleString()} km • {listing.fuel_type}
                </p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-2">
                  ₺{listing.price.toLocaleString()}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/listings/${listing.id}/edit`)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Düzenle</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(listing.id)}
                    className="btn-secondary text-red-600 dark:text-red-400 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Sil</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {listings.length === 0 && (
            <div className="col-span-2 text-center py-8 text-gray-500 dark:text-gray-400">
              Henüz ilan oluşturmadınız.
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-6 h-6" />
                  <h3 className="text-xl font-semibold">
                    {showDeleteConfirm === 'account' ? 'Hesabı Sil' : 'İlanı Sil'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {showDeleteConfirm === 'account'
                  ? 'Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinecektir.'
                  : 'Bu ilanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    if (showDeleteConfirm === 'account') {
                      handleDeleteAccount();
                    } else {
                      handleDeleteListing(showDeleteConfirm);
                    }
                  }}
                  disabled={deleting === showDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  {deleting === showDeleteConfirm ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Siliniyor...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Sil</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Verification Dialogs */}
      <VerificationDialog
        isOpen={showEmailDialog}
        onClose={() => setShowEmailDialog(false)}
        type="email"
        currentValue={profile.email}
        onVerified={handleEmailVerified}
      />

      <VerificationDialog
        isOpen={showPhoneDialog}
        onClose={() => setShowPhoneDialog(false)}
        type="phone"
        currentValue={profile.phone}
        onVerified={handlePhoneVerified}
      />

      <PasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
      />
    </motion.div>
  );
};

export default Profile;