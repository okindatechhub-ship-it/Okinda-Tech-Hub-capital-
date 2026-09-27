import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import {
  db,
  User,
  Product,
  Room,
  RoomRequest,
  VacancyNotice,
  Post,
  Comment,
  Conversation,
  Message,
  SavedItem,
  Notification,
  Report,
  PaymentMethod,
  AdvertiserApplication,
  Order
} from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'capital-home-residence-secret-key-2026';

export const apiRouter = express.Router();

export interface AuthRequest extends Request {
  user?: User;
}

// Middleware to authenticate JWT
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload: any) => {
    if (err || !payload) {
      return res.status(403).json({ error: 'Invalid or expired session token' });
    }
    const users = db.get('users');
    const user = users.find(u => u.id === payload.id);
    if (!user || user.status === 'suspended') {
      return res.status(403).json({ error: 'User not found or account suspended' });
    }
    req.user = user;
    next();
  });
}

// Optional auth helper
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  jwt.verify(token, JWT_SECRET, (err, payload: any) => {
    if (!err && payload) {
      const users = db.get('users');
      const user = users.find(u => u.id === payload.id);
      if (user && user.status !== 'suspended') {
        req.user = user;
      }
    }
    next();
  });
}

// Require Admin
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  next();
}

function generateToken(user: User) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function sanitizeUser(user: User) {
  const { password_hash, ...rest } = user;
  return rest;
}

export function createNotification(userId: string, type: string, title: string, message: string, link: string) {
  const notifications = db.get('notifications') || [];
  const newNotif: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    type,
    title,
    message,
    link,
    read_at: null,
    created_at: new Date().toISOString()
  };
  notifications.unshift(newNotif);
  db.set('notifications', notifications);
  return newNotif;
}

export function broadcastNotification(type: string, title: string, message: string, link: string, excludeUserId?: string) {
  const users = db.get('users') || [];
  const notifications = db.get('notifications') || [];
  const now = new Date().toISOString();

  users.forEach(u => {
    if (excludeUserId && u.id === excludeUserId) return;
    notifications.unshift({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: u.id,
      type,
      title,
      message,
      link,
      read_at: null,
      created_at: now
    });
  });

  db.set('notifications', notifications);
}

// ==========================================
// 0. LOCAL STORAGE FILE UPLOADS
// ==========================================

apiRouter.post('/upload', (req, res) => {
  try {
    const { file, filename } = req.body;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Check if it's a base64 Data URL (e.g. data:image/png;base64,...)
    const matches = file.match(/^data:([A-Za-z0-9-+./]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1].toLowerCase();
      const base64Data = matches[2];

      let ext = 'jpg';
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('gif')) ext = 'gif';
      else if (mimeType.includes('svg')) ext = 'svg';
      else if (mimeType.includes('mp4')) ext = 'mp4';
      else if (mimeType.includes('webm')) ext = 'webm';
      else if (mimeType.includes('quicktime') || mimeType.includes('mov')) ext = 'mov';

      const cleanBaseName = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, '_') : `asset.${ext}`;
      const finalFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanBaseName}`;
      const filePath = path.join(uploadsDir, finalFilename);

      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      return res.json({
        url: `/uploads/${finalFilename}`,
        filename: finalFilename
      });
    }

    // If it's already an HTTP / local URL
    res.json({ url: file });
  } catch (err: any) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Failed to process file upload' });
  }
});

// ==========================================
// 1. AUTH & USER ROUTES
// ==========================================

// Compulsory Sign Up with Room Selection & Profile Image from local storage
apiRouter.post('/auth/register', (req, res) => {
  const { full_name, phone, email, password, room_number, profile_photo } = req.body;

  if (!full_name || !phone || !email || !password || !room_number) {
    return res.status(400).json({
      error: 'All fields (Full Name, Phone Number, Email, Password, and Room Number) are compulsory.'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const users = db.get('users');
  const cleanEmail = email.toLowerCase().trim();

  if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: 'An account with this email address already exists' });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);
  const now = new Date().toISOString();
  const newUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // Find and assign room
  const rooms = db.get('rooms');
  const selectedRoom = rooms.find(
    r => r.room_number.toLowerCase() === room_number.toLowerCase() || r.id === room_number
  );

  let assignedRoomId: string | null = null;
  let assignedRoomNumber: string = room_number;

  if (selectedRoom) {
    assignedRoomId = selectedRoom.id;
    assignedRoomNumber = selectedRoom.room_number;
    selectedRoom.status = 'OCCUPIED';
    selectedRoom.current_occupant_id = newUserId;
    selectedRoom.occupant_name = full_name.trim();
    selectedRoom.updated_at = now;
    db.set('rooms', rooms);
  }

  const newUser: User = {
    id: newUserId,
    full_name: full_name.trim(),
    phone: phone.trim(),
    email: cleanEmail,
    password_hash,
    profile_photo: profile_photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name)}&backgroundColor=102A43`,
    bio: `Resident at Capital Home Residence (${assignedRoomNumber}).`,
    location: `Capital Home Residence, ${assignedRoomNumber}`,
    role: 'resident',
    is_resident: true,
    resident_room_id: assignedRoomId,
    resident_room_number: assignedRoomNumber,
    status: 'active',
    created_at: now,
    updated_at: now
  };

  users.push(newUser);
  db.set('users', users);

  // Broadcast notification of new resident joining to all registered users
  broadcastNotification(
    'new_resident',
    'New Resident in Residence!',
    `${newUser.full_name} has moved into ${assignedRoomNumber}. Say hello!`,
    '/residence',
    newUserId
  );

  const token = generateToken(newUser);
  res.status(201).json({
    token,
    user: sanitizeUser(newUser),
    message: 'Account registered successfully'
  });
});

// User & Admin Login
apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const users = db.get('users');
  const cleanEmail = email.toLowerCase().trim();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact administrator.' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: sanitizeUser(user),
    message: 'Logged in successfully'
  });
});

apiRouter.get('/auth/me', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const rooms = db.get('rooms');
  const residentRoom = user.resident_room_id ? rooms.find(r => r.id === user.resident_room_id) : null;
  const applications = db.get('advertiser_applications');
  const userApp = applications.find(a => a.user_id === user.id);
  const paymentMethods = db.get('advertiser_payment_methods').filter(p => p.advertiser_id === user.id && p.is_active);

  res.json({
    user: sanitizeUser(user),
    resident_room: residentRoom || null,
    advertiser_application: userApp || null,
    payment_methods: paymentMethods
  });
});

apiRouter.put('/auth/profile', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const { full_name, phone, bio, location, profile_photo } = req.body;

  const users = db.get('users');
  const targetUser = users.find(u => u.id === user.id);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  if (full_name) targetUser.full_name = full_name.trim();
  if (phone) targetUser.phone = phone.trim();
  if (bio !== undefined) targetUser.bio = bio;
  if (location !== undefined) targetUser.location = location;
  if (profile_photo !== undefined) targetUser.profile_photo = profile_photo;
  targetUser.updated_at = new Date().toISOString();

  db.set('users', users);
  res.json({ user: sanitizeUser(targetUser), message: 'Profile updated' });
});

// Registered users directory for private messaging
apiRouter.get('/users/registered', authenticateToken, (req: AuthRequest, res) => {
  const users = db.get('users');
  const currentUserId = req.user!.id;
  const list = users
    .filter(u => u.id !== currentUserId && u.status === 'active')
    .map(u => ({
      id: u.id,
      full_name: u.full_name,
      role: u.role,
      room_number: u.resident_room_number,
      profile_photo: u.profile_photo,
      location: u.location
    }));
  res.json(list);
});

// ==========================================
// 2. RESIDENCE & ROOMS
// ==========================================

apiRouter.get('/rooms', (req, res) => {
  const { category, status, search, min_price, max_price } = req.query;
  const rooms = db.get('rooms');
  const settings = db.get('settings');

  let filtered = [...rooms];

  if (category && category !== 'all') {
    filtered = filtered.filter(r => r.room_type === category);
  }

  if (status && status !== 'all') {
    filtered = filtered.filter(r => r.status.toLowerCase() === (status as string).toLowerCase());
  }

  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(r =>
      r.room_number.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  }

  if (min_price && !isNaN(Number(min_price))) {
    filtered = filtered.filter(r => r.price >= Number(min_price));
  }

  if (max_price && !isNaN(Number(max_price))) {
    filtered = filtered.filter(r => r.price <= Number(max_price));
  }

  const total = rooms.length;
  const oldRooms = rooms.filter(r => r.room_type === 'Old Room');
  const newRooms = rooms.filter(r => r.room_type === 'New Room');
  const available = rooms.filter(r => r.status === 'AVAILABLE').length;
  const movingOut = rooms.filter(r => r.status === 'MOVING_OUT').length;
  const reserved = rooms.filter(r => r.status === 'RESERVED').length;
  const occupied = rooms.filter(r => r.status === 'OCCUPIED').length;

  res.json({
    rooms: filtered,
    stats: {
      total,
      old_rooms_count: oldRooms.length,
      new_rooms_count: newRooms.length,
      available,
      moving_out: movingOut,
      reserved,
      occupied,
      old_room_price: settings.old_room_price,
      new_room_price: settings.new_room_price
    },
    settings
  });
});

apiRouter.get('/rooms/:id', (req, res) => {
  const rooms = db.get('rooms');
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const notices = db.get('vacancy_notices');
  const activeNotice = notices.find(n => n.room_id === room.id && n.status === 'active');

  res.json({
    ...room,
    occupant_public_name: room.occupant_name ? room.occupant_name.split(' ')[0] : null,
    vacancy_notice: activeNotice || null
  });
});

// Resident Announces Moving Out with Vacancy Broadcast
apiRouter.post('/residence/move-out-notice', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const { expected_date, notes, share_to_community, images } = req.body;

  if (!expected_date) {
    return res.status(400).json({ error: 'Expected move-out date is required' });
  }

  const rooms = db.get('rooms');
  const room = rooms.find(r => r.id === user.resident_room_id || r.current_occupant_id === user.id);

  if (!room && user.role !== 'admin') {
    return res.status(400).json({ error: 'You are not assigned to a room in the residence' });
  }

  const targetRoom = room || rooms[0];
  const now = new Date().toISOString();

  targetRoom.status = 'MOVING_OUT';
  targetRoom.move_out_date = expected_date;
  targetRoom.availability_date = expected_date;
  targetRoom.updated_at = now;
  db.set('rooms', rooms);

  const vacancyNotices = db.get('vacancy_notices');
  const newNotice: VacancyNotice = {
    id: `notice-${Date.now()}`,
    room_id: targetRoom.id,
    room_number: targetRoom.room_number,
    resident_id: user.id,
    resident_name: user.full_name,
    move_out_date: expected_date,
    message: notes || `Resident moving out on ${expected_date}.`,
    images: Array.isArray(images) && images.length ? images : (targetRoom.images || []),
    status: 'active',
    created_at: now
  };
  vacancyNotices.push(newNotice);
  db.set('vacancy_notices', vacancyNotices);

  if (share_to_community) {
    const posts = db.get('posts');
    posts.unshift({
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: user.id,
      user_name: user.full_name,
      user_avatar: user.profile_photo,
      user_role: user.role,
      content: `🏠 Upcoming Vacancy: ${targetRoom.room_number} (${targetRoom.room_type}) will be available from ${expected_date}.\n${notes || ''}`,
      images: Array.isArray(images) && images.length ? images : targetRoom.images.slice(0, 1),
      room_id: targetRoom.id,
      room_ref: {
        id: targetRoom.id,
        room_number: targetRoom.room_number,
        price: targetRoom.price,
        status: 'MOVING_OUT',
        move_out_date: expected_date
      },
      likes: [],
      comments_count: 0,
      created_at: now,
      updated_at: now
    });
    db.set('posts', posts);
  }

  // Broadcast push notification to every registered user
  broadcastNotification(
    'room_vacancy',
    'Upcoming Room Vacancy Announced!',
    `${targetRoom.room_number} is becoming available from ${expected_date}. Reserve early!`,
    `/residence`,
    user.id
  );

  res.json({ message: 'Move-out notice published successfully', room: targetRoom, notice: newNotice });
});

// Admin room price updater
apiRouter.put('/admin/settings/prices', authenticateToken, requireAdmin, (req, res) => {
  const { old_room_price, new_room_price } = req.body;
  const settings = db.get('settings');
  const rooms = db.get('rooms');

  if (old_room_price && !isNaN(Number(old_room_price))) {
    const price = Number(old_room_price);
    settings.old_room_price = price;
    rooms.forEach(r => {
      if (r.room_type === 'Old Room') r.price = price;
    });
  }

  if (new_room_price && !isNaN(Number(new_room_price))) {
    const price = Number(new_room_price);
    settings.new_room_price = price;
    rooms.forEach(r => {
      if (r.room_type === 'New Room') r.price = price;
    });
  }

  db.set('settings', settings);
  db.set('rooms', rooms);
  res.json({
    message: 'Room prices updated across the residence system',
    old_room_price: settings.old_room_price,
    new_room_price: settings.new_room_price
  });
});

// ==========================================
// 3. MARKETPLACE & COMBINED SELLER PRODUCT SETUP
// ==========================================

apiRouter.get('/products', (req, res) => {
  const { category, condition, search, min_price, max_price, sort } = req.query;
  const products = db.get('products') || [];
  const users = db.get('users') || [];
  const categories = db.get('categories') || [];

  let activeProducts = products.filter(p => p.status === 'active');

  if (category && category !== 'all') {
    activeProducts = activeProducts.filter(p => p.category_id === category);
  }

  if (condition && condition !== 'all') {
    activeProducts = activeProducts.filter(p => p.condition.toLowerCase() === (condition as string).toLowerCase());
  }

  if (search) {
    const q = (search as string).toLowerCase();
    activeProducts = activeProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  }

  if (min_price && !isNaN(Number(min_price))) {
    activeProducts = activeProducts.filter(p => p.price >= Number(min_price));
  }

  if (max_price && !isNaN(Number(max_price))) {
    activeProducts = activeProducts.filter(p => p.price <= Number(max_price));
  }

  // Sorting
  if (sort === 'price_asc') {
    activeProducts.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    activeProducts.sort((a, b) => b.price - a.price);
  } else {
    activeProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const enriched = activeProducts.map(prod => {
    const seller = users.find(u => u.id === prod.advertiser_id);
    const cat = categories.find(c => c.id === prod.category_id);
    return {
      ...prod,
      category_name: cat ? cat.name : 'General',
      seller: seller ? {
        id: seller.id,
        name: seller.full_name,
        phone: seller.phone,
        location: seller.location,
        avatar: seller.profile_photo
      } : null
    };
  });

  res.json({ products: enriched, total: enriched.length, categories });
});

apiRouter.get('/products/:id', (req, res) => {
  const products = db.get('products') || [];
  const prod = products.find(p => p.id === req.params.id);
  if (!prod) return res.status(404).json({ error: 'Product not found' });

  const users = db.get('users') || [];
  const seller = users.find(u => u.id === prod.advertiser_id);
  const categories = db.get('categories') || [];
  const cat = categories.find(c => c.id === prod.category_id);

  const otherProducts = products
    .filter(p => p.advertiser_id === prod.advertiser_id && p.id !== prod.id && p.status === 'active')
    .slice(0, 4);

  res.json({
    ...prod,
    category_name: cat ? cat.name : 'General',
    seller: seller ? {
      id: seller.id,
      name: seller.full_name,
      phone: seller.phone,
      location: seller.location,
      avatar: seller.profile_photo,
      bio: seller.bio,
      joined: seller.created_at
    } : null,
    other_products: otherProducts
  });
});

// Combined Seller Product Setup (Product info, Variations, Delivery, Payment Methods)
apiRouter.post('/products', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const {
    name,
    category_id,
    subcategory,
    brand,
    description,
    images,
    price,
    discount_price,
    quantity,
    condition,
    has_variations,
    variations,
    delivery,
    payment_methods
  } = req.body;

  if (!name || !price || !category_id) {
    return res.status(400).json({ error: 'Product name, category and price are required' });
  }

  // Ensure user has advertiser privileges
  if (user.role === 'normal_user') {
    const users = db.get('users');
    const u = users.find(usr => usr.id === user.id);
    if (u) {
      u.role = 'advertiser';
      db.set('users', users);
    }
  }

  const now = new Date().toISOString();
  const products = db.get('products') || [];

  const newProduct: Product = {
    id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    advertiser_id: user.id,
    advertiser_name: user.full_name,
    category_id,
    subcategory: subcategory || undefined,
    brand: brand || undefined,
    name: name.trim(),
    description: description || '',
    price: Number(price),
    discount_price: discount_price ? Number(discount_price) : undefined,
    condition: condition || 'Used',
    quantity: Number(quantity) || 1,
    location: user.location || 'Capital Home Residence',
    images: Array.isArray(images) && images.length ? images : ['/src/assets/images/marketplace_item_setup_1790501145428.jpg'],
    status: 'active',
    is_featured: false,
    rating: 4.8,
    reviews_count: 1,
    has_variations: Boolean(has_variations),
    variations: has_variations && Array.isArray(variations) ? variations : undefined,
    delivery: delivery || {
      pickup_available: true,
      delivery_available: true,
      delivery_locations: 'Capital Home Residence & Main Campus'
    },
    payment_methods: Array.isArray(payment_methods) && payment_methods.length ? payment_methods : [
      {
        type: 'send_money',
        phone_number: user.phone,
        recipient_name: user.full_name,
        is_default: true
      }
    ],
    created_at: now,
    updated_at: now
  };

  products.unshift(newProduct);
  db.set('products', products);

  // Broadcast push notification to all registered users
  broadcastNotification(
    'product_listed',
    'New Campus Marketplace Deal!',
    `${user.full_name} listed "${newProduct.name}" for KSh ${newProduct.price.toLocaleString()}.`,
    `/marketplace`,
    user.id
  );

  res.status(201).json({
    message: 'Product published successfully',
    product: newProduct
  });
});

apiRouter.delete('/products/:id', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const products = db.get('products') || [];
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  if (products[idx].advertiser_id !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized to delete this product' });
  }

  products.splice(idx, 1);
  db.set('products', products);
  res.json({ message: 'Product deleted successfully' });
});

// ==========================================
// 4. CHECKOUT & ORDERS (Manual M-Pesa Verification)
// ==========================================

apiRouter.post('/orders', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const {
    items,
    total_amount,
    advertiser_id,
    advertiser_name,
    payment_method_used,
    mpesa_transaction_code,
    amount_paid,
    payment_screenshot,
    delivery_type,
    delivery_address
  } = req.body;

  if (!items || !items.length || !total_amount || !mpesa_transaction_code) {
    return res.status(400).json({ error: 'Items, total amount and M-Pesa transaction code are required' });
  }

  const orders = db.get('orders') || [];
  const now = new Date().toISOString();
  const orderId = `ORD-${Date.now().toString().slice(-6)}`;

  const newOrder: Order = {
    id: orderId,
    customer_id: user.id,
    customer_name: user.full_name,
    customer_phone: user.phone,
    customer_room: user.resident_room_number || undefined,
    items,
    total_amount: Number(total_amount),
    advertiser_id: advertiser_id || items[0]?.advertiser_id || 'user-admin-okinda',
    advertiser_name: advertiser_name || 'Campus Seller',
    payment_method_used: payment_method_used || {
      type: 'send_money',
      title: 'M-PESA Send Money',
      details: 'Direct payment to seller'
    },
    mpesa_transaction_code: mpesa_transaction_code.toUpperCase().trim(),
    amount_paid: Number(amount_paid || total_amount),
    payment_screenshot: payment_screenshot || undefined,
    delivery_type: delivery_type || 'pickup',
    delivery_address: delivery_address || `Room ${user.resident_room_number || 'Lobby'}`,
    status: 'payment_submitted',
    status_history: [
      {
        status: 'payment_submitted',
        note: `Customer submitted payment code ${mpesa_transaction_code.toUpperCase().trim()}. Awaiting seller verification.`,
        timestamp: now
      }
    ],
    created_at: now,
    updated_at: now
  };

  orders.unshift(newOrder);
  db.set('orders', orders);

  // Notify seller
  createNotification(
    newOrder.advertiser_id,
    'new_order',
    `New Order #${orderId} Received!`,
    `${user.full_name} paid KSh ${newOrder.amount_paid.toLocaleString()} via M-Pesa (${newOrder.mpesa_transaction_code}). Verify now!`,
    `/account/orders`
  );

  // Notify customer
  createNotification(
    user.id,
    'order_submitted',
    `Order #${orderId} Submitted`,
    `Payment code ${newOrder.mpesa_transaction_code} submitted. Seller is verifying your transaction.`,
    `/account/orders`
  );

  res.status(201).json({
    message: 'Order created successfully. Awaiting seller payment verification.',
    order: newOrder
  });
});

// Customer's orders
apiRouter.get('/orders', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const orders = db.get('orders') || [];
  const myOrders = orders.filter(o => o.customer_id === user.id);
  res.json(myOrders);
});

// Seller's received orders
apiRouter.get('/seller/orders', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const orders = db.get('orders') || [];
  const sellerOrders = user.role === 'admin'
    ? orders
    : orders.filter(o => o.advertiser_id === user.id);
  res.json(sellerOrders);
});

// Update order status (Seller/Admin verifies transaction code)
apiRouter.put('/orders/:id/status', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const { status, note } = req.body;
  const orders = db.get('orders') || [];
  const order = orders.find(o => o.id === req.params.id);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (order.advertiser_id !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the seller or administrator can update order status' });
  }

  const now = new Date().toISOString();
  order.status = status;
  order.updated_at = now;
  order.status_history.push({
    status,
    note: note || `Order updated to ${status.replace(/_/g, ' ')}`,
    timestamp: now
  });

  db.set('orders', orders);

  // Notify customer
  createNotification(
    order.customer_id,
    'order_status',
    `Order #${order.id} Updated`,
    `Your order status is now: ${status.replace(/_/g, ' ').toUpperCase()}`,
    `/account/orders`
  );

  res.json({ message: 'Order status updated', order });
});

// ==========================================
// 5. POSTS / COMMUNITY FEED (Public, Images/Videos, Downloadable)
// ==========================================

apiRouter.get('/posts', optionalAuth, (req: AuthRequest, res) => {
  const posts = db.get('posts') || [];
  const currentUserId = req.user ? req.user.id : null;

  const enriched = posts.map(p => ({
    ...p,
    has_liked: currentUserId ? p.likes.includes(currentUserId) : false,
    likes_count: p.likes.length
  }));

  res.json(enriched);
});

apiRouter.post('/posts', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const { content, images, video_url, media_type, product_id, room_id } = req.body;

  if (!content && (!images || !images.length) && !video_url) {
    return res.status(400).json({ error: 'Post must contain text, image, or video' });
  }

  const posts = db.get('posts') || [];
  const now = new Date().toISOString();

  let productRef = null;
  if (product_id) {
    const prod = (db.get('products') || []).find(p => p.id === product_id);
    if (prod) {
      productRef = {
        id: prod.id,
        name: prod.name,
        price: prod.price,
        image: prod.images[0] || '',
        condition: prod.condition
      };
    }
  }

  let roomRef = null;
  if (room_id) {
    const room = (db.get('rooms') || []).find(r => r.id === room_id);
    if (room) {
      roomRef = {
        id: room.id,
        room_number: room.room_number,
        price: room.price,
        status: room.status
      };
    }
  }

  const newPost: Post = {
    id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: user.id,
    user_name: user.full_name,
    user_avatar: user.profile_photo,
    user_role: user.role,
    content: content || '',
    images: Array.isArray(images) ? images : [],
    video_url: video_url || undefined,
    media_type: media_type || (video_url ? 'video' : images?.length ? 'image' : 'text'),
    product_id: product_id || null,
    product_ref: productRef,
    room_id: room_id || null,
    room_ref: roomRef,
    likes: [],
    comments_count: 0,
    created_at: now,
    updated_at: now
  };

  posts.unshift(newPost);
  db.set('posts', posts);

  // Broadcast push notification to all registered users
  broadcastNotification(
    'new_post',
    'New Post in Community Feed',
    `${user.full_name} shared: "${(content || 'a photo/video').substring(0, 50)}..."`,
    `/posts`,
    user.id
  );

  res.status(201).json({
    message: 'Post created successfully',
    post: { ...newPost, has_liked: false, likes_count: 0 }
  });
});

apiRouter.post('/posts/:id/like', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const posts = db.get('posts') || [];
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const idx = post.likes.indexOf(user.id);
  let liked = false;
  if (idx === -1) {
    post.likes.push(user.id);
    liked = true;
  } else {
    post.likes.splice(idx, 1);
    liked = false;
  }

  db.set('posts', posts);
  res.json({ liked, likes_count: post.likes.length });
});

apiRouter.get('/posts/:id/comments', (req, res) => {
  const comments = (db.get('comments') || []).filter(c => c.post_id === req.params.id);
  res.json(comments);
});

apiRouter.post('/posts/:id/comments', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Comment content is required' });

  const posts = db.get('posts') || [];
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comments = db.get('comments') || [];
  const newComment: Comment = {
    id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    post_id: post.id,
    user_id: user.id,
    user_name: user.full_name,
    user_avatar: user.profile_photo,
    content: content.trim(),
    created_at: new Date().toISOString()
  };

  comments.push(newComment);
  db.set('comments', comments);

  post.comments_count = (post.comments_count || 0) + 1;
  db.set('posts', posts);

  res.status(201).json(newComment);
});

apiRouter.delete('/posts/:id', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const posts = db.get('posts') || [];
  const idx = posts.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });

  if (posts[idx].user_id !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized to delete this post' });
  }

  posts.splice(idx, 1);
  db.set('posts', posts);
  res.json({ message: 'Post deleted' });
});

// ==========================================
// 6. PRIVATE MESSAGING (Registered Users Only)
// ==========================================

apiRouter.get('/conversations', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const conversations = (db.get('conversations') || []).filter(c => c.participant_ids.includes(user.id));
  const users = db.get('users') || [];
  const messages = db.get('messages') || [];

  const enriched = conversations.map(c => {
    const otherId = c.participant_ids.find(id => id !== user.id) || user.id;
    const otherUser = users.find(u => u.id === otherId);
    const unread = messages.filter(
      m => m.conversation_id === c.id && m.receiver_id === user.id && !m.read_at
    ).length;

    return {
      ...c,
      other_user: otherUser ? {
        id: otherUser.id,
        name: otherUser.full_name,
        avatar: otherUser.profile_photo,
        phone: otherUser.phone,
        role: otherUser.role,
        room_number: otherUser.resident_room_number
      } : { id: otherId, name: 'Residence Member', avatar: '', phone: '', role: 'normal_user' },
      unread_count: unread
    };
  });

  enriched.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  res.json(enriched);
});

apiRouter.get('/conversations/:id/messages', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const conversations = db.get('conversations') || [];
  const conv = conversations.find(c => c.id === req.params.id);
  if (!conv || !conv.participant_ids.includes(user.id)) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const messages = db.get('messages') || [];
  const convMessages = messages.filter(m => m.conversation_id === conv.id);

  // Automatically mark incoming messages as read
  let updated = false;
  const now = new Date().toISOString();
  convMessages.forEach(m => {
    if (m.receiver_id === user.id && !m.read_at) {
      m.read_at = now;
      updated = true;
    }
  });

  if (updated) {
    db.set('messages', messages);
  }

  res.json(convMessages);
});

apiRouter.post('/conversations/:id/read', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const messages = db.get('messages') || [];
  let updated = false;
  const now = new Date().toISOString();

  messages.forEach(m => {
    if (m.conversation_id === req.params.id && m.receiver_id === user.id && !m.read_at) {
      m.read_at = now;
      updated = true;
    }
  });

  if (updated) {
    db.set('messages', messages);
  }

  res.json({ message: 'Marked as read' });
});

apiRouter.post('/conversations', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const { recipient_id, initial_message, message_type, product_ref, room_ref } = req.body;

  if (!recipient_id) {
    return res.status(400).json({ error: 'Recipient ID is required' });
  }

  if (recipient_id === user.id) {
    return res.status(400).json({ error: 'You cannot message yourself' });
  }

  // Ensure recipient is a registered user
  const users = db.get('users') || [];
  const recipient = users.find(u => u.id === recipient_id);
  if (!recipient) {
    return res.status(404).json({ error: 'Recipient is not a registered user' });
  }

  const conversations = db.get('conversations') || [];
  let conv = conversations.find(c =>
    c.participant_ids.includes(user.id) && c.participant_ids.includes(recipient_id)
  );

  const now = new Date().toISOString();

  if (!conv) {
    conv = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      participant_ids: [user.id, recipient_id],
      created_at: now,
      updated_at: now
    };
    conversations.unshift(conv);
    db.set('conversations', conversations);
  }

  if (initial_message || product_ref || room_ref) {
    const messages = db.get('messages') || [];
    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      conversation_id: conv.id,
      sender_id: user.id,
      receiver_id: recipient_id,
      message_type: message_type || (product_ref ? 'product_card' : room_ref ? 'room_card' : 'text'),
      content: initial_message || (product_ref ? `Inquiring about ${product_ref.name}` : `Inquiring about ${room_ref?.room_number}`),
      product_ref: product_ref || undefined,
      room_ref: room_ref || undefined,
      read_at: null,
      created_at: now
    };

    messages.push(newMsg);
    db.set('messages', messages);

    conv.last_message = {
      content: newMsg.content,
      sender_id: user.id,
      created_at: now
    };
    conv.updated_at = now;
    db.set('conversations', conversations);

    createNotification(
      recipient_id,
      'new_message',
      `New Message from ${user.full_name}`,
      newMsg.content,
      `/messages?conv=${conv.id}`
    );
  }

  res.json({ conversation: conv });
});

apiRouter.post('/conversations/:id/messages', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const convId = req.params.id;
  const { content, message_type, attachment_url, product_ref, room_ref } = req.body;

  const conversations = db.get('conversations') || [];
  const conv = conversations.find(c => c.id === convId);
  if (!conv || !conv.participant_ids.includes(user.id)) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const recipientId = conv.participant_ids.find(id => id !== user.id)!;
  const now = new Date().toISOString();

  const messages = db.get('messages') || [];
  const newMsg: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    conversation_id: conv.id,
    sender_id: user.id,
    receiver_id: recipientId,
    message_type: message_type || (attachment_url ? 'image' : 'text'),
    content: content || '',
    attachment_url: attachment_url || undefined,
    product_ref: product_ref || undefined,
    room_ref: room_ref || undefined,
    read_at: null,
    created_at: now
  };

  messages.push(newMsg);
  db.set('messages', messages);

  conv.last_message = {
    content: newMsg.content || (attachment_url ? 'Sent an attachment' : 'Card shared'),
    sender_id: user.id,
    created_at: now
  };
  conv.updated_at = now;
  db.set('conversations', conversations);

  // Notify recipient immediately
  createNotification(
    recipientId,
    'new_message',
    `Message from ${user.full_name}`,
    newMsg.content || 'Sent an attachment',
    `/messages?conv=${conv.id}`
  );

  res.status(201).json(newMsg);
});

// ==========================================
// 7. NOTIFICATIONS & SAVED ITEMS
// ==========================================

apiRouter.get('/notifications', authenticateToken, (req: AuthRequest, res) => {
  const notifs = (db.get('notifications') || []).filter(n => n.user_id === req.user!.id);
  res.json(notifs);
});

apiRouter.put('/notifications/read-all', authenticateToken, (req: AuthRequest, res) => {
  const notifs = db.get('notifications') || [];
  const now = new Date().toISOString();
  notifs.forEach(n => {
    if (n.user_id === req.user!.id && !n.read_at) n.read_at = now;
  });
  db.set('notifications', notifs);
  res.json({ message: 'All notifications marked as read' });
});

apiRouter.get('/saved', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const saved = (db.get('saved_items') || []).filter(s => s.user_id === user.id);
  const products = db.get('products') || [];
  const rooms = db.get('rooms') || [];
  const posts = db.get('posts') || [];

  const savedProducts = saved
    .filter(s => s.item_type === 'product')
    .map(s => products.find(p => p.id === s.item_id))
    .filter(Boolean);

  const savedRooms = saved
    .filter(s => s.item_type === 'room')
    .map(s => rooms.find(r => r.id === s.item_id))
    .filter(Boolean);

  const savedPosts = saved
    .filter(s => s.item_type === 'post')
    .map(s => posts.find(p => p.id === s.item_id))
    .filter(Boolean);

  res.json({
    products: savedProducts,
    rooms: savedRooms,
    posts: savedPosts
  });
});

apiRouter.post('/saved/toggle', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;
  const { item_type, item_id } = req.body;

  if (!item_type || !item_id) {
    return res.status(400).json({ error: 'Item type and ID required' });
  }

  const saved = db.get('saved_items') || [];
  const idx = saved.findIndex(s => s.user_id === user.id && s.item_type === item_type && s.item_id === item_id);

  let isSaved = false;
  if (idx === -1) {
    saved.push({
      id: `save-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: user.id,
      item_type,
      item_id,
      created_at: new Date().toISOString()
    });
    isSaved = true;
  } else {
    saved.splice(idx, 1);
    isSaved = false;
  }

  db.set('saved_items', saved);
  res.json({ is_saved: isSaved });
});

// Categories & Settings
apiRouter.get('/categories', (req, res) => {
  res.json(db.get('categories') || []);
});

apiRouter.get('/settings', (req, res) => {
  res.json(db.get('settings') || {});
});

// Admin stats
apiRouter.get('/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  const users = db.get('users') || [];
  const products = db.get('products') || [];
  const posts = db.get('posts') || [];
  const rooms = db.get('rooms') || [];
  const orders = db.get('orders') || [];

  res.json({
    total_users: users.length,
    total_products: products.length,
    active_products: products.filter(p => p.status === 'active').length,
    total_posts: posts.length,
    total_rooms: rooms.length,
    available_rooms: rooms.filter(r => r.status === 'AVAILABLE').length,
    occupied_rooms: rooms.filter(r => r.status === 'OCCUPIED').length,
    moving_out_rooms: rooms.filter(r => r.status === 'MOVING_OUT').length,
    total_orders: orders.length,
    pending_orders: orders.filter(o => o.status === 'payment_submitted').length
  });
});
