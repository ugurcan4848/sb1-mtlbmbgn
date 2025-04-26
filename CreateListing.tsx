import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { createCarListing } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Car, Upload, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
const MAX_FILES = 16;
const MIN_WIDTH = 1920;
const MIN_HEIGHT = 1080;

const CreateListing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const validateImageResolution = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve(img.width >= MIN_WIDTH && img.height >= MIN_HEIGHT);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Check total number of images
      if (images.length + newFiles.length > MAX_FILES) {
        setError(`En fazla ${MAX_FILES} fotoğraf yükleyebilirsiniz.`);
        return;
      }

      // Validate each file
      for (const file of newFiles) {
        if (file.size > MAX_FILE_SIZE) {
          setError(`${file.name} dosyası çok büyük. Maksimum dosya boyutu 30MB olabilir.`);
          return;
        }

        if (!file.type.startsWith('image/')) {
          setError(`${file.name} geçerli bir resim dosyası değil.`);
          return;
        }

        const isValidResolution = await validateImageResolution(file);
        if (!isValidResolution) {
          setError(`${file.name} dosyası minimum Full HD (1920x1080) çözünürlükte olmalıdır.`);
          return;
        }
      }
      
      setImages(prev => [...prev, ...newFiles]);
      
      // Create preview URLs
      const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
      setError(''); // Clear any previous errors
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => {
      // Revoke the URL to prevent memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Lütfen önce giriş yapın.');
      return;
    }

    if (images.length === 0) {
      setError('En az bir fotoğraf eklemelisiniz.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Clean numeric values before submission
      const cleanedFormData = {
        ...formData,
        price: parseInt(formData.price.toString().replace(/[^\d]/g, ''), 10),
        mileage: parseInt(formData.mileage.toString().replace(/[^\d]/g, ''), 10),
        year: parseInt(formData.year.toString(), 10)
      };

      const listing = {
        ...cleanedFormData,
        user_id: user.id,
      };

      await createCarListing(listing, images);
      toast.success('İlan başarıyla oluşturuldu');
      navigate('/listings');
    } catch (err) {
      console.error('Error creating listing:', err);
      setError('İlan oluşturulamadı. Lütfen tekrar deneyin.');
      toast.error('İlan oluşturulamadı');
    } finally {
      setLoading(false);
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
      // Remove non-numeric characters and format with thousands separator
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

  const carBrands = [
    'Audi', 'BMW', 'Chevrolet', 'Citroen', 'Dacia', 'Fiat', 'Ford', 'Honda', 
    'Hyundai', 'Kia', 'Mercedes', 'Nissan', 'Opel', 'Peugeot', 'Renault', 
    'Seat', 'Skoda', 'Toyota', 'Volkswagen', 'Volvo'
  ];

  const carFeatures = [
    'ABS', 'Klima', 'Hız Sabitleyici', 'Yokuş Kalkış Desteği', 'ESP',
    'Şerit Takip Sistemi', 'Geri Görüş Kamerası', 'Park Sensörü',
    'Deri Döşeme', 'Elektrikli Ayna', 'Elektrikli Cam', 'Merkezi Kilit',
    'Yağmur Sensörü', 'Far Sensörü', 'Start/Stop', 'Sunroof',
    'Navigasyon', 'Bluetooth', 'USB', 'Aux'
  ];

  const bodyTypes = [
    'Sedan', 'Hatchback', 'Station Wagon', 'SUV', 'Crossover',
    'Coupe', 'Convertible', 'Van', 'Pickup'
  ];

  const conditions = [
    { value: 'new', label: 'Sıfır' },
    { value: 'used', label: 'İkinci El' },
    { value: 'damaged', label: 'Hasarlı' }
  ];

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/login', {
        state: {
          message: 'İlan vermek için lütfen giriş yapın.',
          returnTo: '/create-listing'
        }
      });
    }
  }, [user, navigate]);

  // If not authenticated, don't render anything
  if (!user) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Yeni İlan Oluştur</h1>
        
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
                <select
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Seçiniz</option>
                  {carBrands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
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
                  placeholder="0"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="body_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kasa Tipi
                </label>
                <select
                  id="body_type"
                  name="body_type"
                  value={formData.body_type}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Seçiniz</option>
                  {bodyTypes.map(type => (
                    <option key={type} value={type.toLowerCase()}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Durumu
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  {conditions.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
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
                  placeholder="1600"
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
                  placeholder="120"
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
                  placeholder="0"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

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

          {/* Images */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Fotoğraflar</h2>
            
            <div className="border-2 border-dashed dark:border-gray-600 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4 flex text-sm leading-6 text-gray-600 dark:text-gray-400">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white dark:bg-gray-800 font-semibold text-blue-600 dark:text-blue-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                  >
                    <span>Fotoğraf Yükle</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      multiple
                      onChange={handleImageAdd}
                    />
                  </label>
                  <p className="pl-1">veya sürükleyip bırakın</p>
                </div>
                <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">
                  PNG, JPG, GIF - Minimum Full HD (1920x1080), Maksimum 30MB, en fazla 16 fotoğraf
                </p>
              </div>
            </div>

            {imagePreviewUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200"
          >
            {loading ? 'İlan Oluşturuluyor...' : 'İlan Oluştur'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default CreateListing;