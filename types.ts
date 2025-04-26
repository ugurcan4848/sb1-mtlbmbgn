export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  created_at: string;
}

export interface CarListing {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  color: string;
  price: number;
  fuel_type: string;
  transmission: string;
  location: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  features?: string[];
  warranty?: boolean;
  negotiable?: boolean;
  exchange?: boolean;
  car_images?: CarImage[];
  users?: User;
}

export interface CarImage {
  id: string;
  listing_id: string;
  url: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id: string;
  content: string;
  created_at: string;
  sender?: User;
  receiver?: User;
  listing?: CarListing;
}