import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Car, ChevronLeft, ChevronRight, Check, Calendar, Phone, PhoneCall, MapPin } from 'lucide-react';
import { getCarListingById, sendMessage } from '../lib/supabase';
import { CarListing } from '../lib/types';
import { useAuth } from '../components/AuthContext';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<CarListing | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  React.useEffect(() => {
    const fetchListing = async () => {
      try {
        if (!id) return;
        const data = await getCarListingById(id);
        setListing(data);
      } catch (err) {
        setError('İlan yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !listing || !messageContent.trim()) return;

    setSendingMessage(true);
    try {
      await sendMessage({
        sender_id: user.id,
        receiver_id: listing.user_id,
        listing_id: listing.id,
        content: messageContent.trim()
      });
      setMessageContent('');
      setShowMessageModal(false);
      navigate('/messages');
    } catch (err) {
      setError('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSendingMessage(false);
    }
  };

  const nextImage = () => {
    if (listing?.car_images) {
      setSelectedImageIndex((prev) => 
        prev === listing.car_images!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (listing?.car_images) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? listing.car_images!.length - 1 : prev - 1
      );
    }
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappNumber = cleanPhone.startsWith('90') ? cleanPhone : `90${cleanPhone}`;
    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-300">Yükleniyor...</div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        {error || 'İlan bulunamadı.'}
      </div>
    );
  }

  const membershipDuration = listing.users?.created_at 
    ? formatDistanceToNow(new Date(listing.users.created_at), { 
        addSuffix: true,
        locale: tr 
      })
    : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0"
    >
      {/* Image Gallery */}
      <div className="card">
        <div className="relative">
          <div className="aspect-w-16 aspect-h-9 mb-4">
            {listing.car_images && listing.car_images.length > 0 ? (
              <motion.img
                key={selectedImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={listing.car_images[selectedImageIndex].url}
                alt={`${listing.brand} ${listing.model}`}
                className="w-full h-[400px] object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-[400px] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Car className="w-20 h-20 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>

          {listing.car_images && listing.car_images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {listing.car_images && listing.car_images.length > 0 && (
          <div className="grid grid-cols-4 gap-4 p-4">
            {listing.car_images.map((image, index) => (
              <motion.img
                key={image.id}
                whileHover={{ scale: 1.05 }}
                src={image.url}
                alt={`${listing.brand} ${listing.model} ${index + 1}`}
                className={`w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-all ${
                  selectedImageIndex === index ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedImageIndex(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Listing Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="card p-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 break-words">
              {listing.brand} {listing.model} {listing.year}
            </h1>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₺{listing.price.toLocaleString()}</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kilometre</p>
                <p className="font-semibold text-gray-800 dark:text-white">{listing.mileage.toLocaleString()} km</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Yakıt Tipi</p>
                <p className="font-semibold text-gray-800 dark:text-white break-words">{listing.fuel_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vites</p>
                <p className="font-semibold text-gray-800 dark:text-white break-words">{listing.transmission}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Renk</p>
                <p className="font-semibold text-gray-800 dark:text-white break-words">{listing.color}</p>
              </div>
            </div>
          </div>

          {/* Features */}
          {listing.features && listing.features.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Özellikler</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {listing.features.map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"
                  >
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm break-words">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Açıklama</h2>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line break-words">{listing.description}</p>
          </div>

          {/* Location */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Konum</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 break-words">{listing.location}</p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Satıcı ile İletişim</h2>
            {listing.users?.full_name && (
              <p className="text-gray-600 dark:text-gray-300 mb-2 break-words">
                {listing.users.full_name}
              </p>
            )}
            {listing.users?.phone && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                  <Phone className="w-5 h-5 flex-shrink-0" />
                  <span className="break-words">{listing.users.phone}</span>
                </div>
                <button
                  onClick={() => handleWhatsApp(listing.users.phone!)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <PhoneCall className="w-5 h-5 flex-shrink-0" />
                  <span>WhatsApp ile İletişime Geç</span>
                </button>
              </div>
            )}
            {membershipDuration && (
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 mb-4">
                <Calendar className="w-5 h-5 flex-shrink-0" />
                <span className="break-words">Üyelik: {membershipDuration}</span>
              </div>
            )}
            {user ? (
              user.id !== listing.user_id ? (
                <button
                  onClick={() => setShowMessageModal(true)}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Mesaj Gönder</span>
                </button>
              ) : (
                <p className="text-gray-600 dark:text-gray-300">Bu ilan size ait.</p>
              )
            ) : (
              <button
                onClick={() => navigate('/login', { 
                  state: { 
                    message: 'Mesaj göndermek için lütfen giriş yapın.',
                    returnTo: `/listings/${id}`
                  }
                })}
                className="w-full btn-primary"
              >
                Mesaj göndermek için giriş yapın
              </button>
            )}
          </div>

          {/* Additional Info */}
          <div className="card p-6 space-y-3">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Ek Bilgiler</h2>
            {listing.warranty && (
              <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="break-words">Garantili</span>
              </div>
            )}
            {listing.negotiable && (
              <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="break-words">Pazarlık Payı Var</span>
              </div>
            )}
            {listing.exchange && (
              <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="break-words">Takas Yapılır</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Satıcıya Mesaj Gönder
            </h3>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Mesajınızı yazın..."
                className="w-full h-32 px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="btn-secondary"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage || !messageContent.trim()}
                  className="btn-primary"
                >
                  {sendingMessage ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ListingDetail;