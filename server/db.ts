import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  password_hash: string;
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
  discount_price?: number; // original/strikethrough price
  condition: 'New' | 'Used' | 'Refurbished';
  quantity: number;
  location: string;
  images: string[]; // [0] is main image, others are additional
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
  move_out_date: string | null;
  availability_date: string | null;
  description: string;
  amenities: string[];
  images: string[];
  created_at: string;
  updated_at: string;
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
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
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

export interface SavedItem {
  id: string;
  user_id: string;
  item_type: 'product' | 'room' | 'post';
  item_id: string;
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

export interface PlatformSettings {
  residence_name: string;
  tagline: string;
  old_room_price: number;
  new_room_price: number;
  contact_phone: string;
  contact_email: string;
  address: string;
  advertisement_guidelines: string;
}

export interface DatabaseSchema {
  users: User[];
  advertiser_applications: AdvertiserApplication[];
  advertiser_payment_methods: PaymentMethod[];
  categories: Category[];
  products: Product[];
  rooms: Room[];
  room_requests: RoomRequest[];
  vacancy_notices: VacancyNotice[];
  posts: Post[];
  comments: Comment[];
  conversations: Conversation[];
  messages: Message[];
  saved_items: SavedItem[];
  notifications: Notification[];
  reports: Report[];
  orders: Order[];
  settings: PlatformSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function generateInitialRooms(oldPrice = 15000, newPrice = 25000): Room[] {
  const rooms: Room[] = [];
  const now = new Date().toISOString();

  const sampleImagesOld = [
    '/src/assets/images/room_interior_capital_1790501134217.jpg',
    '/src/assets/images/hero_capital_residence_1790501121492.jpg'
  ];

  const sampleImagesNew = [
    '/src/assets/images/hero_capital_residence_1790501121492.jpg',
    '/src/assets/images/room_interior_capital_1790501134217.jpg'
  ];

  // 54 Old Rooms
  for (let i = 1; i <= 54; i++) {
    const numPadded = i < 10 ? `0${i}` : `${i}`;
    const roomNumber = `Old Room ${numPadded}`;

    rooms.push({
      id: `old-${numPadded}`,
      residence_id: 'res-capital-home',
      room_number: roomNumber,
      room_type: 'Old Room',
      price: oldPrice,
      billing_period: 'per semester',
      status: 'AVAILABLE',
      current_occupant_id: null,
      occupant_name: null,
      move_out_date: null,
      availability_date: 'Immediate',
      description: `Spacious standard student room in the classic wing of Capital Home Residence. Features a dedicated study desk, heavy-duty wardrobe, quiet corridor location, and access to clean shared sanitation facilities with 24/7 borehole water and backup solar lighting.`,
      amenities: [
        'Study Desk & Chair',
        'Built-in Wardrobe',
        '24/7 Borehole Water',
        'Solar Backup Power',
        'Perimeter Security & CCTV',
        'High-Speed Wi-Fi'
      ],
      images: sampleImagesOld,
      created_at: now,
      updated_at: now
    });
  }

  // 28 New Rooms
  for (let i = 1; i <= 28; i++) {
    const numPadded = i < 10 ? `0${i}` : `${i}`;
    const roomNumber = `New Room ${numPadded}`;

    rooms.push({
      id: `new-${numPadded}`,
      residence_id: 'res-capital-home',
      room_number: roomNumber,
      room_type: 'New Room',
      price: newPrice,
      billing_period: 'per semester',
      status: 'AVAILABLE',
      current_occupant_id: null,
      occupant_name: null,
      move_out_date: null,
      availability_date: 'Immediate',
      description: `Executive self-contained room in the newly constructed modern block of Capital Home Residence. Includes an en-suite hot-water shower, private kitchenette counter, tiled modern flooring, acoustic soundproof windows, and private balcony space.`,
      amenities: [
        'En-suite Tiled Bathroom',
        'Instant Hot Water Shower',
        'Kitchenette Counter & Sink',
        'Private Balcony',
        'Modern Ceramic Tiles',
        'Study Station with Book Rack',
        '24/7 Monitored CCTV Security',
        'Ultra-Fast Optical Fiber Wi-Fi'
      ],
      images: sampleImagesNew,
      created_at: now,
      updated_at: now
    });
  }

  return rooms;
}

export function getInitialDatabase(): DatabaseSchema {
  const now = new Date().toISOString();
  const salt = bcrypt.genSaltSync(10);

  // Single default Admin user with credentials okindatechhub@gmail.com / Okinda3078
  const initialUsers: User[] = [
    {
      id: 'user-admin-okinda',
      full_name: 'Okinda Tech Hub (Admin)',
      phone: '+254700003078',
      email: 'okindatechhub@gmail.com',
      password_hash: bcrypt.hashSync('Okinda3078', salt),
      profile_photo: '/src/assets/images/hero_capital_residence_1790501121492.jpg',
      bio: 'Capital Home Residence Chief Administrator. Managing room vacancies, seller approvals, and campus safety.',
      location: 'Capital Home Office, Block A',
      role: 'admin',
      is_resident: false,
      resident_room_id: null,
      resident_room_number: null,
      status: 'active',
      created_at: now,
      updated_at: now
    }
  ];

  const initialCategories: Category[] = [
    { id: 'cat-electronics', name: 'Electronics', description: 'Gadgets, chargers, audio & kitchen gear', icon: 'Tv', status: 'active' },
    { id: 'cat-computers', name: 'Computers & Laptops', description: 'HP, Dell, Lenovo, MacBooks & PC accessories', icon: 'Laptop', status: 'active' },
    { id: 'cat-phones', name: 'Phones & Tablets', description: 'Smartphones, iPhones, tablets and accessories', icon: 'Smartphone', status: 'active' },
    { id: 'cat-furniture', name: 'Furniture & Decor', description: 'Desks, chairs, mattresses, wardrobes & lamps', icon: 'Armchair', status: 'active' },
    { id: 'cat-books', name: 'Books & Stationery', description: 'Academic textbooks, novels and stationery', icon: 'BookOpen', status: 'active' },
    { id: 'cat-household', name: 'Household Items', description: 'Kettles, heaters, utensils, buckets, curtains', icon: 'Home', status: 'active' },
    { id: 'cat-clothing', name: 'Clothing & Shoes', description: 'Fashion, hoodies, shoes and apparel', icon: 'Shirt', status: 'active' },
    { id: 'cat-services', name: 'Student Services', description: 'Printing, laundry, repair & typing services', icon: 'Wrench', status: 'active' }
  ];

  return {
    users: initialUsers,
    advertiser_applications: [],
    advertiser_payment_methods: [],
    categories: initialCategories,
    products: [],
    rooms: generateInitialRooms(15000, 25000),
    room_requests: [],
    vacancy_notices: [],
    posts: [],
    comments: [],
    conversations: [],
    messages: [],
    saved_items: [],
    notifications: [],
    reports: [],
    orders: [],
    settings: {
      residence_name: 'Capital Home Residence',
      tagline: 'Live. Connect. Buy. Sell.',
      old_room_price: 15000,
      new_room_price: 25000,
      contact_phone: '+254 700 003 078',
      contact_email: 'okindatechhub@gmail.com',
      address: 'Maseno, Along Kisumu - Busia Highway, Opposite Campus Gate B',
      advertisement_guidelines: 'Only approved student/local advertisers may list products. Payment details must be verified by the buyer directly with the seller before cash or mobile transfer. No advance payments for uninspected goods.'
    }
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all required fields exist
        if (!parsed.orders) parsed.orders = [];
        if (!parsed.rooms || parsed.rooms.length !== 82) {
          const fresh = getInitialDatabase();
          parsed.rooms = fresh.rooms;
        }
        // Ensure admin user exists with requested credentials
        const hasAdmin = parsed.users && parsed.users.some((u: User) => u.email === 'okindatechhub@gmail.com');
        if (!hasAdmin) {
          const fresh = getInitialDatabase();
          parsed.users = fresh.users;
          parsed.products = fresh.products;
          parsed.posts = fresh.posts;
          parsed.conversations = fresh.conversations;
          parsed.messages = fresh.messages;
        }
        this.persist(parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load database, creating fresh one:', e);
    }
    const fresh = getInitialDatabase();
    this.persist(fresh);
    return fresh;
  }

  private persist(data: DatabaseSchema) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  public get<K extends keyof DatabaseSchema>(key: K): DatabaseSchema[K] {
    return this.data[key];
  }

  public set<K extends keyof DatabaseSchema>(key: K, value: DatabaseSchema[K]) {
    this.data[key] = value;
    this.persist(this.data);
  }

  public save() {
    this.persist(this.data);
  }

  public raw(): DatabaseSchema {
    return this.data;
  }
}

export const db = new Database();
