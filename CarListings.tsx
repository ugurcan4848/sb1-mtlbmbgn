import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, Car, HelpCircle, Mail, Phone, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getCarListings } from '../lib/supabase';
import { CarListing } from '../lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/AuthContext';

const CarListings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    brand: '',
    model: '',
    minPrice: '',
    maxPrice: '',
    minYear: '',
    maxYear: '',
    minMileage: '',
    maxMileage: '',
    fuelType: '',
    transmission: '',
    bodyType: '',
    color: '',
    features: [] as string[],
    condition: '',
    location: '',
    searchTerm: '',
  });

  const carBrands = [
    'Audi', 'BMW', 'Chevrolet', 'Citroen', 'Dacia', 'Fiat', 'Ford', 'Honda', 
    'Hyundai', 'Kia', 'Mercedes', 'Nissan', 'Opel', 'Peugeot', 'Renault', 
    'Seat', 'Skoda', 'Toyota', 'Volkswagen', 'Volvo'
  ];

  const fuelTypes = [
    { value: '', label: 'Tümü' },
    { value: 'benzin', label: 'Benzin' },
    { value: 'dizel', label: 'Dizel' },
    { value: 'lpg', label: 'LPG' },
    { value: 'elektrik', label: 'Elektrik' },
    { value: 'hibrit', label: 'Hibrit' }
  ];

  const transmissionTypes = [
    { value: '', label: 'Tümü' },
    { value: 'manuel', label: 'Manuel' },
    { value: 'otomatik', label: 'Otomatik' },
    { value: 'yarı_otomatik', label: 'Yarı Otomatik' }
  ];

  const bodyTypes = [
    { value: '', label: 'Tümü' },
    { value: 'sedan', label: 'Sedan' },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'station_wagon', label: 'Station Wagon' },
    { value: 'suv', label: 'SUV' },
    { value: 'crossover', label: 'Crossover' },
    { value: 'coupe', label: 'Coupe' },
    { value: 'convertible', label: 'Convertible' },
    { value: 'van', label: 'Van' },
    { value: 'pickup', label: 'Pickup' }
  ];

  const conditions = [
    { value: '', label: 'Tümü' },
    { value: 'new', label: 'Sıfır' },
    { value: 'used', label: 'İkinci El' },
    { value: 'damaged', label: 'Hasarlı' }
  ];

  const colors = [
    { value: '', label: 'Tümü' },
    { value: 'beyaz', label: 'Beyaz' },
    { value: 'siyah', label: 'Siyah' },
    { value: 'gri', label: 'Gri' },
    { value: 'kırmızı', label: 'Kırmızı' },
    { value: 'mavi', label: 'Mavi' },
    { value: 'yeşil', label: 'Yeşil' },
    { value: 'sarı', label: 'Sarı' },
    { value: 'kahverengi', label: 'Kahverengi' },
    { value: 'gümüş', label: 'Gümüş' }
  ];

  const features = [
    'ABS', 'Klima', 'Hız Sabitleyici', 'ESP', 'Şerit Takip', 'Geri Görüş Kamerası',
    'Park Sensörü', 'Deri Döşeme', 'Sunroof', 'Navigasyon'
  ];

  useEffect(() => {
    fetchListings();
  }, [filters]);

  const fetchListings = async () => {
    try {
      const data = await getCarListings(filters);
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setError('İlanlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const resetFilters = () => {
    setFilters({
      brand: '',
      model: '',
      minPrice: '',
      maxPrice: '',
      minYear: '',
      maxYear: '',
      minMileage: '',
      maxMileage: '',
      fuelType: '',
      transmission: '',
      bodyType: '',
      color: '',
      features: [],
      condition: '',
      location: '',
      searchTerm: '',
    });
  };

  const filteredListings = listings.filter(listing => {
    if (!filters.searchTerm) return true;
    const searchTerm = filters.searchTerm.toLowerCase();
    return (
      listing.brand.toLowerCase().includes(searchTerm) ||
      listing.model.toLowerCase().includes(searchTerm) ||
      listing.location.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-20 md:pb-0"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Araba İlanları</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowHelpModal(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Yardım</span>
          </button>
          <button 
            onClick={handleCreateListing}
            className="btn-primary"
          >
            {user ? 'İlan Ver' : 'Giriş'}
          </button>
        </div>
      </div>

      <div className="card p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleFilterChange}
            placeholder="Marka, model veya konum ara..."
            className="pl-10 pr-4 py-2 w-full rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtreler</span>
          </div>
          {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Marka</label>
                    <select
                      name="brand"
                      value={filters.brand}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Tümü</option>
                      {carBrands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Model</label>
                    <input
                      type="text"
                      name="model"
                      value={filters.model}
                      onChange={handleFilterChange}
                      placeholder="Model ara..."
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fiyat Aralığı (₺)</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      name="minPrice"
                      value={filters.minPrice}
                      onChange={handleFilterChange}
                      placeholder="Min"
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      name="maxPrice"
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                      placeholder="Max"
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Yıl</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      name="minYear"
                      value={filters.minYear}
                      onChange={handleFilterChange}
                      placeholder="Min"
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      name="maxYear"
                      value={filters.maxYear}
                      onChange={handleFilterChange}
                      placeholder="Max"
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <select
                    name="fuelType"
                    value={filters.fuelType}
                    onChange={handleFilterChange}
                    className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  >
                    {fuelTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>

                  <select
                    name="transmission"
                    value={filters.transmission}
                    onChange={handleFilterChange}
                    className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  >
                    {transmissionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>

                  <select
                    name="condition"
                    value={filters.condition}
                    onChange={handleFilterChange}
                    className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  >
                    {conditions.map(condition => (
                      <option key={condition.value} value={condition.value}>{condition.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Filtreleri Sıfırla
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-600 dark:text-gray-300">
            Yükleniyor...
          </div>
        ) : error ? (
          <div className="col-span-full text-center py-8 text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-600 dark:text-gray-300">
            İlan bulunamadı.
          </div>
        ) : (
          filteredListings.map((listing) => (
            <motion.div
              key={listing.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              className="card overflow-hidden"
              onClick={() => navigate(`/listings/${listing.id}`)}
            >
              <div className="aspect-w-16 aspect-h-9 h-48">
                {listing.car_images && listing.car_images.length > 0 ? (
                  <img
                    src={listing.car_images[0].url}
                    alt={`${listing.brand} ${listing.model}`}
                    className="w-full h-full object-cover rounded-t-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-t-xl flex items-center justify-center">
                    <Car className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
                  {listing.brand} {listing.model} {listing.year}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 truncate">
                  {listing.mileage.toLocaleString()} km • {listing.fuel_type}
                </p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-2">
                  ₺{listing.price.toLocaleString()}
                </p>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 truncate">
                  {listing.location}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Yardım ve İletişim
                </h3>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
                  <Mail className="w-5 h-5" />
                  <a href="mailto:ugurcanduman48@gmail.com" className="hover:text-blue-600 dark:hover:text-blue-400">
                    ugurcanduman48@gmail.com
                  </a>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
                  <Phone className="w-5 h-5" />
                  <a href="tel:05488200267" className="hover:text-blue-600 dark:hover:text-blue-400">
                    0548 820 02 67
                  </a>
                </div>
                
                <div className="mt-6 pt-4 border-t dark:border-gray-700">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                    Nasıl İlan Verebilirim?
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Üye olun veya giriş yapın</li>
                    <li>"İlan Ver" butonuna tıklayın</li>
                    <li>Araç bilgilerini ve fotoğrafları ekleyin</li>
                    <li>İlanınızı yayınlayın</li>
                  </ol>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="btn-primary"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CarListings;