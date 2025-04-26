import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { getCarListingById, updateCarListing } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Car, AlertCircle } from 'lucide-react';
import { CarListing } from '../lib/types';

const EditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [listing, setListing] = useState<CarListing | null>(null);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    mileage: 0,
    color: '',
    price: 0,
    fuel_type: '',
    transmission: '',
    location: '',
    description: '',
    body_type: '',
    engine_size: '',
    power: '',
    doors: '4',
    condition: 'used',
    features: [] as string[],
    warranty: false,
    negotiable: false,
    exchange: false
  });

  const carFeatures = [
    'ABS', 'Klima', 'Hız Sabitleyici', 'ESP', 'Şerit Takip', 'Geri Görüş Kamerası',
    'Park Sensörü', 'Deri Döşeme', 'Sunroof', 'Navigasyon'
  ];

  useEffect(() => {
    if (!id || !user) return;
    
    const fetchListing = async () => {
      try {
        const data = await getCarListingById(id);
        if (!data) {
          setError('İlan bulunamadı.');
          return;
        }
        
        if (data.user_id !== user.id) {
          setError('Bu ilanı düzenleme yetkiniz yok.');
          return;
        }

        setListing(data);
        setFormData({
          brand: data.brand,
          model: data.model,
          year: data.year,
          mileage: data.mileage,
          color: data.color,
          price: data.price,
          fuel_type: data.fuel_type,
          transmission: data.transmission,
          location: data.location,
          description: data.description || '',
          body_type: data.body_type,
          engine_size: data.engine_size || '',
          power: data.power || '',
          doors: data.doors || '4',
          condition: data.condition,
          features: data.features || [],
          warranty: data.warranty || false,
          negotiable: data.negotiable || false,
          exchange: data.exchange || false
        });
      } catch (err) {
        console.error('Error fetching listing:', err);
        setError('İlan yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    setSaving(true);
    setError('');

    try {
      await updateCarListing(id, formData);
      navigate(`/listings/${id}`);
    } catch (err) {
      console.error('Error updating listing:', err);
      setError('İlan güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else if (name === 'price' || name === 'mileage') {
      const numericValue = value.replace(/[^\d]/g, '');
      const formattedValue = numericValue ? parseInt(numericValue, 10).toLocaleString('tr-TR') : '';
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-300">Yükleniyor...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        {error || 'İlan bulunamadı.'}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">İlanı Düzenle</h1>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Temel Bilgiler</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Marka
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Model
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Yıl
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kilometre
                </label>
                <input
                  type="text"
                  id="mileage"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Renk
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fiyat (₺)
                </label>
                <input
                  type="text"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Teknik Özellikler</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="engine_size" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Motor Hacmi (cc)
                </label>
                <input
                  type="text"
                  id="engine_size"
                  name="engine_size"
                  value={formData.engine_size}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="power" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Motor Gücü (HP)
                </label>
                <input
                  type="text"
                  id="power"
                  name="power"
                  value={formData.power}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Yakıt Tipi
                </label>
                <select
                  id="fuel_type"
                  name="fuel_type"
                  value={formData.fuel_type}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Seçiniz</option>
                  <option value="benzin">Benzin</option>
                  <option value="dizel">Dizel</option>
                  <option value="lpg">LPG</option>
                  <option value="elektrik">Elektrik</option>
                  <option value="hibrit">Hibrit</option>
                </select>
              </div>

              <div>
                <label htmlFor="transmission" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vites
                </label>
                <select
                  id="transmission"
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Seçiniz</option>
                  <option value="manuel">Manuel</option>
                  <option value="otomatik">Otomatik</option>
                  <option value="yarı_otomatik">Yarı Otomatik</option>
                </select>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Özellikler</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {carFeatures.map(feature => (
                <label
                  key={feature}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Ek Bilgiler</h2>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Konum
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Açıklama
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="warranty"
                  checked={formData.warranty}
                  onChange={handleChange}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Garantili</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="negotiable"
                  checked={formData.negotiable}
                  onChange={handleChange}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Pazarlık Payı Var</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="exchange"
                  checked={formData.exchange}
                  onChange={handleChange}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Takas</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(`/listings/${id}`)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <span>Kaydet</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default EditListing;