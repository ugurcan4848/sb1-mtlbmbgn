import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add validation for file uploads
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
const MAX_FILES = 16;
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

// Add signUp function
export const signUp = async (email: string, password: string, fullName: string, isCorporate = false, companyDetails?: { companyName: string; taxNumber: string }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        is_corporate: isCorporate,
      },
    },
  });

  if (error) throw error;

  // Create user profile in the users table
  if (data.user) {
    const profile: any = {
      id: data.user.id,
      email: data.user.email,
      full_name: fullName,
      is_corporate: isCorporate,
    };

    if (isCorporate && companyDetails) {
      // Start corporate trial
      const { error: trialError } = await supabase.rpc('start_corporate_trial', {
        user_id: data.user.id,
        company_name: companyDetails.companyName,
        tax_number: companyDetails.taxNumber
      });

      if (trialError) throw trialError;
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert([profile]);

    if (profileError) throw profileError;
  }

  return data;
};

// Add function to check trial status
export const checkTrialStatus = async (userId: string) => {
  const { data, error } = await supabase
    .rpc('is_trial_active', { user_id: userId });

  if (error) throw error;
  return data;
};

// Add function to toggle auto-share
export const toggleAutoShare = async (userId: string, enabled: boolean) => {
  const { error } = await supabase
    .from('users')
    .update({ auto_share: enabled })
    .eq('id', userId);

  if (error) throw error;
};

// Add function to get corporate status
export const getCorporateStatus = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('is_corporate, trial_start_date, trial_end_date, subscription_status, company_name, tax_number, auto_share')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

const validateImage = (file: File) => {
  if (!allowedImageTypes.includes(file.type)) {
    throw new Error('Geçersiz dosya türü. Sadece JPEG, PNG ve WebP formatları desteklenir.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Dosya boyutu çok büyük. Maksimum dosya boyutu 30MB olabilir.');
  }
};

export const createCarListing = async (listing: any, images: File[]) => {
  try {
    // Validate number of images
    if (images.length > MAX_FILES) {
      throw new Error(`En fazla ${MAX_FILES} fotoğraf yükleyebilirsiniz.`);
    }

    // Validate all images first
    for (const image of images) {
      validateImage(image);
    }

    // First, create the listing
    const { data: listingData, error: listingError } = await supabase
      .from('car_listings')
      .insert([listing])
      .select()
      .single();

    if (listingError) throw listingError;

    // Then upload images and create image records
    const imagePromises = images.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${listingData.id}/${fileName}`;

      // Upload image to storage
      const { error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(filePath);

      // Create image record
      const { error: imageError } = await supabase
        .from('car_images')
        .insert([{
          listing_id: listingData.id,
          url: publicUrl
        }]);

      if (imageError) throw imageError;

      return publicUrl;
    });

    await Promise.all(imagePromises);
    return listingData;
  } catch (error) {
    console.error('Error in createCarListing:', error);
    throw error;
  }
};

// Listings
export const getCarListings = async (filters: any = {}) => {
  try {
    let query = supabase
      .from('car_listings')
      .select(`
        *,
        car_images(*),
        users!inner(*)
      `);

    // Apply text search filters
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      query = query.or(`brand.ilike.*${searchTerm}*,model.ilike.*${searchTerm}*,location.ilike.*${searchTerm}*`);
    }

    // Apply exact match filters
    if (filters.brand) {
      query = query.ilike('brand', `%${filters.brand}%`);
    }
    if (filters.model) {
      query = query.ilike('model', `%${filters.model}%`);
    }
    if (filters.fuelType) {
      query = query.eq('fuel_type', filters.fuelType);
    }
    if (filters.transmission) {
      query = query.eq('transmission', filters.transmission);
    }
    if (filters.bodyType) {
      query = query.eq('body_type', filters.bodyType);
    }
    if (filters.color) {
      query = query.eq('color', filters.color);
    }
    if (filters.condition) {
      query = query.eq('condition', filters.condition);
    }

    // Apply range filters
    if (filters.minPrice) {
      query = query.gte('price', parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      query = query.lte('price', parseInt(filters.maxPrice));
    }
    if (filters.minYear) {
      query = query.gte('year', parseInt(filters.minYear));
    }
    if (filters.maxYear) {
      query = query.lte('year', parseInt(filters.maxYear));
    }
    if (filters.minMileage) {
      query = query.gte('mileage', parseInt(filters.minMileage));
    }
    if (filters.maxMileage) {
      query = query.lte('mileage', parseInt(filters.maxMileage));
    }

    // Apply array filters
    if (filters.features && filters.features.length > 0) {
      query = query.contains('features', filters.features);
    }

    // Add sorting
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching car listings:', error);
    throw error;
  }
};

export const getUserListings = async (userId: string) => {
  const { data, error } = await supabase
    .from('car_listings')
    .select('*, car_images(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getCarListingById = async (id: string) => {
  const { data, error } = await supabase
    .from('car_listings')
    .select(`
      *,
      car_images(*),
      users!inner(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const updateCarListing = async (id: string, updates: any) => {
  try {
    // Clean numeric values before submission
    const cleanedUpdates = {
      ...updates,
      price: parseInt(updates.price.toString().replace(/[^\d]/g, ''), 10),
      mileage: parseInt(updates.mileage.toString().replace(/[^\d]/g, ''), 10),
      year: parseInt(updates.year.toString(), 10)
    };

    const { data, error } = await supabase
      .from('car_listings')
      .update(cleanedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating car listing:', error);
    throw error;
  }
};

export const deleteCarListing = async (id: string) => {
  try {
    // First get all images for this listing
    const { data: images, error: imageQueryError } = await supabase
      .from('car_images')
      .select('url')
      .eq('listing_id', id);

    if (imageQueryError) throw imageQueryError;

    // Delete image records first
    if (images && images.length > 0) {
      const { error: imageDeleteError } = await supabase
        .from('car_images')
        .delete()
        .eq('listing_id', id);

      if (imageDeleteError) throw imageDeleteError;

      // Then delete images from storage
      for (const image of images) {
        const urlParts = image.url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `${id}/${fileName}`;
        
        await supabase.storage
          .from('car-images')
          .remove([filePath]);
      }
    }

    // Finally delete the listing
    const { error: listingDeleteError } = await supabase
      .from('car_listings')
      .delete()
      .eq('id', id);

    if (listingDeleteError) throw listingDeleteError;

  } catch (error) {
    console.error('Error in deleteCarListing:', error);
    throw error;
  }
};

// Messages
export const getMessages = async (userId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!sender_id(*),
      receiver:users!receiver_id(*),
      listing:car_listings(
        *,
        car_images(*)
      )
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Mark messages as read when they are fetched
  const unreadMessages = data.filter(msg => 
    msg.receiver_id === userId && !msg.read
  );

  if (unreadMessages.length > 0) {
    const { error: updateError } = await supabase
      .from('messages')
      .update({ read: true })
      .in('id', unreadMessages.map(msg => msg.id));

    if (updateError) console.error('Error marking messages as read:', updateError);
  }

  return data;
};

export const sendMessage = async (message: any) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([message])
    .select(`
      *,
      sender:users!sender_id(*),
      receiver:users!receiver_id(*),
      listing:car_listings(*)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const deleteMessage = async (messageId: string, userId: string) => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', userId);

  if (error) throw error;
};

// User Profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const updateUserProfile = async (userId: string, updates: { full_name?: string; phone?: string }) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Account Management
export const deleteAccount = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active session');
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/delete_user`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete account');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in deleteAccount:', error);
    throw error;
  }
};

// Add social media sharing function
export const shareToSocial = async (listingId: string, platforms: ('instagram' | 'facebook')[]) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active session');
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/social-share`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listingId,
          platforms
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to share to social media');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sharing to social media:', error);
    throw error;
  }
};