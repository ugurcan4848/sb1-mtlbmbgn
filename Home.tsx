import React, { useEffect, useState } from 'react';
import { Search, Car, TrendingUp, Shield, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCarListings } from '../lib/supabase';
import { CarListing } from '../lib/types';
import { motion } from 'framer-motion';
import { useAuth } from '../components/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [featuredListings, setFeaturedListings] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFeaturedListings();
  }, []);

  const fetchFeaturedListings = async () => {
    try {
      const listings = await getCarListings();
      setFeaturedListings(listings.slice(0, 6)); // Get the 6 most recent listings
    } catch (error) {
      console.error('Error fetching listings:', error);
      setError('İlanlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/listings?search=${searchTerm}`);
  };

  const features = [
    {
      icon: <Shield className="w-12 h-12 text-blue-500" />,
      title: "Güvenli Alışveriş",
      description: "Güvenli ödeme sistemleri ve doğrulanmış satıcılar ile güvenle alım satım yapın."
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-green-500" />,
      title: "Güncel Fiyatlar",
      description: "Piyasadaki en güncel ve rekabetçi fiyatlarla araç alın veya satın."
    },
    {
      icon: <Clock className="w-12 h-12 text-purple-500" />,
      title: "7/24 Destek",
      description: "Sorularınız için 7/24 müşteri desteğimiz her zaman yanınızda."
    }
  ];

  const handleCreateListing = () => {
    if (!user) {
      navigate('/login', { 
        state: { 
          message: 'İlan vermek için lütfen giriş yapın.',
          returnTo: '/create-listing'
        }
      });
      return;
    }
    navigate('/create-listing');
  };

  const handleListingClick = (listingId: string) => {
    navigate(`/listings/${listingId}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      {/* Hero Section */}
      <div className="relative h-[600px] -mt-8 rounded-b-3xl overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1920"
          alt="Cars"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50 flex items-center">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl space-y-6"
            >
              <h1 className="text-5xl font-bold text-white leading-tight">
                Hayalinizdeki Araca Ulaşmanın En Kolay Yolu
              </h1>
              <p className="text-xl text-gray-200">
                Binlerce araç arasından size en uygun olanı bulun, güvenle alın veya satın.
              </p>
              
              <form onSubmit={handleSearch} className="flex gap-2 bg-white/10 backdrop-blur-md p-2 rounded-xl">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-200" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Marka, model veya anahtar kelime"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 text-white placeholder-gray-300 border-0 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Search className="w-5 h-5" />
                  <span>Ara</span>
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                {feature.icon}
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Featured Listings */}
      <div className="container mx-auto px-4 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
            Öne Çıkan İlanlar
          </h2>
          <button
            onClick={() => navigate('/listings')}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            Tümünü Gör
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-300">Yükleniyor...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 dark:text-red-400">{error}</div>
          </div>
        ) : featuredListings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-600 dark:text-gray-300">Henüz ilan bulunmuyor.</div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {featuredListings.map((listing, index) => (
              <motion.div 
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
                onClick={() => handleListingClick(listing.id)}
              >
                <div className="aspect-w-16 aspect-h-9 h-48 relative overflow-hidden">
                  {listing.car_images && listing.car_images.length > 0 ? (
                    <img
                      src={listing.car_images[0].url}
                      alt={`${listing.brand} ${listing.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <Car className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {listing.brand} {listing.model} {listing.year}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    {listing.mileage.toLocaleString()} km • {listing.fuel_type}
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-3">
                    ₺{listing.price.toLocaleString()}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {listing.location}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(listing.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 dark:bg-blue-700">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-white">
              Aracınızı Hemen Satışa Çıkarın
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Binlerce potansiyel alıcıya ulaşın, aracınızı en iyi fiyata satın.
            </p>
            <button
              onClick={handleCreateListing}
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              {user ? 'Hemen İlan Ver' : 'Giriş Yap ve İlan Ver'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Home;