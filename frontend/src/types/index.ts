export type UserRole = 'builder' | 'vendor';

export interface User {
  id: string;
  role: UserRole;
  phoneNumber: string;
  phoneVerified: boolean;
  email?: string;
  emailVerified: boolean;
  status: string;
  profile?: BuilderProfile | VendorProfile | null;
  profileId?: string | null;
  profileName?: string | null;
  kycCompleted?: boolean;
}

export interface BuilderProfile {
  id: string;
  firstName: string;
  lastName: string;
  addressText: string;
  rating: number;
  ratingCount: number;
  location?: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
}

export interface VendorProfile {
  id: string;
  businessName: string;
  yearEstablished: number;
  panNumber: string;
  gstNumber: string;
  addressText: string;
  catalogCategories: string[];
  rating: number;
  ratingCount: number;
  location?: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
}

export interface Project {
  id: string;
  builder_id: string;
  category: string;
  sub_item: string;
  brand_preference?: string;
  quantity: number;
  unit: string;
  requirement_date: string;
  transport_needed: boolean;
  gst_number?: string;
  notes?: string;
  status: 'open' | 'closed' | 'cancelled';
  address_text: string;
  created_at: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  total_bids?: number;
  lowest_quote?: number;
  lowest_unit_price?: number;
  distance_km?: number;
  has_submitted_bid?: boolean;
  my_bid_amount?: number;
  my_bid_status?: string;
  builder_first_name?: string;
  builder_last_name?: string;
}

export interface Bid {
  id: string;
  project_id: string;
  vendor_id: string;
  base_unit_price: number;
  transport_fee: number;
  tax_rate_percent: number;
  total_amount: number;
  delivery_timeline_days: number;
  remarks?: string;
  bid_status: 'submitted' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  bid_created_at: string;
  business_name: string;
  year_established: number;
  vendor_address: string;
  vendor_rating: number;
  vendor_rating_count: number;
  vendor_phone: string;
  vendor_email: string;
  distance_km: number;
  price_rank: number;
}

export interface Rating {
  id: string;
  bid_id: string;
  reviewer_user_id: string;
  target_user_id: string;
  score: number;
  review: string | null;
  created_at: string;
  reviewer_role: 'builder' | 'vendor';
  reviewer_name: string;
}
