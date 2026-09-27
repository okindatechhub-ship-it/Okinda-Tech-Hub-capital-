export interface User {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  profile_photo: string;
  bio: string;
  location: string;
  role: 'normal_user' | 'advertiser' | 'resident' | 'admin';
  is_resident: boolean;
  resident_room_id: string | null;
  resident_room_number?: string | null;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  advertiser_id: string;
  payment_type: 'mpesa' | 'bank' | 'cash' | 'other';
  account_name: string;
  account_number?: string;
  phone_number?: string;
  bank_name?: string;
  instructions?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdvertiserApplication {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string;
  location: string;
  intended_products: string;
  payment_methods: {
    type: 'mpesa' | 'bank' | 'cash' | 'other';
    account_name: string;
    phone_number?: string;
    account_number?: string;
    bank_name?: string;
    instructions?: string;
  }[];
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'active';
}

export interface ProductVariationOption {
  label: string;
  price?: number;
  stock?: number;
}

export interface ProductVariation {
  type: string; // e.g. "Size", "Color", "Storage", "RAM"
  options: ProductVariationOption[];
}

export interface SellerPaymentOption {
  type: 'send_money' | 'till' | 'paybill';
  phone_number?: string;
  recipient_name?: string;
  till_number?: string;
  business_name?: string;
  paybill_number?: string;
  account_number?: string;
  is_default?: boolean;
}

export interface ProductDeliveryInfo {
  pickup_available: boolean;
  delivery_available: boolean;
  delivery_fee?: number;
  delivery_locations?: string;
  estimated_time?: string;
}

export interface Product {
  id: string;
  advertiser_id: string;
  advertiser_name?: string;
  category_id: string;
  category_name?: string;
  subcategory?: string;
  brand?: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  condition: 'New' | 'Used' | 'Refurbished';
  quantity: number;
  location: string;
  images: string[];
  status: 'active' | 'sold' | 'hidden';
  is_featured: boolean;
  rating?: number;
  reviews_count?: number;
  has_variations?: boolean;
  variations?: ProductVariation[];
  delivery?: ProductDeliveryInfo;
  payment_methods?: SellerPaymentOption[];
  created_at: string;
  updated_at: string;
  seller?: {
    id: string;
    name: string;
    phone: string;
    location: string;
    avatar: string;
    bio?: string;
    joined: string;
  } | null;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selected_variation?: string;
  advertiser_id: string;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_room?: string;
  items: OrderItem[];
  total_amount: number;
  advertiser_id: string;
  advertiser_name: string;
  payment_method_used: {
    type: 'send_money' | 'till' | 'paybill' | 'other';
    title: string;
    details: string;
  };
  mpesa_transaction_code: string;
  amount_paid: number;
  payment_screenshot?: string;
  delivery_type: 'pickup' | 'delivery';
  delivery_address?: string;
  status: 'payment_submitted' | 'payment_confirmed' | 'processing' | 'ready_for_pickup' | 'delivered' | 'cancelled';
  status_history: {
    status: string;
    note?: string;
    timestamp: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  residence_id: string;
  room_number: string;
  room_type: 'Old Room' | 'New Room';
  price: number;
  billing_period: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MOVING_OUT' | 'RESERVED';
  current_occupant_id: string | null;
  occupant_name: string | null;
  occupant_public_name?: string | null;
  move_out_date: string | null;
  availability_date: string | null;
  description: string;
  amenities: string[];
  images: string[];
  created_at: string;
  updated_at: string;
  vacancy_notice?: VacancyNotice | null;
}

export interface RoomRequest {
  id: string;
  room_id: string;
  room_number: string;
  applicant_id: string;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string;
  preferred_move_in_date: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface VacancyNotice {
  id: string;
  room_id: string;
  room_number: string;
  resident_id: string;
  resident_name: string;
  move_out_date: string;
  message: string;
  images: string[];
  status: 'active' | 'resolved';
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  user_role: string;
  content: string;
  images: string[];
  video_url?: string;
  media_type?: 'text' | 'image' | 'video' | 'mixed';
  product_id?: string | null;
  product_ref?: {
    id: string;
    name: string;
    price: number;
    image: string;
    condition: string;
  } | null;
  room_id?: string | null;
  room_ref?: {
    id: string;
    room_number: string;
    price: number;
    status: string;
    move_out_date?: string;
  } | null;
  likes: string[];
  likes_count: number;
  has_liked?: boolean;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  other_user: {
    id: string;
    name: string;
    avatar: string;
    phone: string;
    role: string;
    room_number?: string | null;
  };
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message_type: 'text' | 'image' | 'product_card' | 'room_card';
  content: string;
  attachment_url?: string;
  product_ref?: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  room_ref?: {
    id: string;
    room_number: string;
    price: number;
    status: string;
  };
  read_at?: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read_at: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reporter_name: string;
  target_type: 'product' | 'post' | 'comment' | 'user' | 'room';
  target_id: string;
  target_title?: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selected_variation?: string;
}
