import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  User,
  KeyRound,
  Store,
  Bookmark,
  Bell,
  Calendar,
  PlusCircle,
  Trash2,
  Clock,
  DoorOpen,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Package,
  CheckCircle2,
  Truck,
  AlertCircle,
  X
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Room, Product, Notification } from '../types';

interface AccountPageProps {
  initialTab?: string;
  onSelectRoom: (roomId: string) => void;
  onSelectProduct: (productId: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  initialTab = 'profile',
  onSelectRoom,
  onSelectProduct,
}) => {
  const { user, residentRoom, advertiserApplication, paymentMethods, refreshUser, updateProfile } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Profile form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Move-out notice form (Section 8)
  const [moveOutDate, setMoveOutDate] = useState('');
  const [moveOutMessage, setMoveOutMessage] = useState('');
  const [shareNoticeToCommunity, setShareNoticeToCommunity] = useState(true);
  const [submittingNotice, setSubmittingNotice] = useState(false);

  // Advertiser application form (Section 14)
  const [bizName, setBizName] = useState('');
  const [bizDesc, setBizDesc] = useState('');
  const [bizLocation, setBizLocation] = useState('Capital Home Residence');
  const [intendedProducts, setIntendedProducts] = useState('');
  const [appMpesaPhone, setAppMpesaPhone] = useState('');
  const [appMpesaName, setAppMpesaName] = useState('');
  const [submittingApplication, setSubmittingApplication] = useState(false);

  // Advertiser products & payments (Section 15 & 16)
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdCat, setNewProdCat] = useState('cat-electronics');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCondition, setNewProdCondition] = useState<'New' | 'Used' | 'Refurbished'>('Used');
  const [newProdQty, setNewProdQty] = useState('1');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDelivery, setNewProdDelivery] = useState('Pick up at Capital Home Residence');
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Add payment method modal
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [payType, setPayType] = useState<'mpesa' | 'bank' | 'cash' | 'other'>('mpesa');
  const [payAccName, setPayAccName] = useState('');
  const [payPhone, setPayPhone] = useState('');
  const [payAccNumber, setPayAccNumber] = useState('');
  const [payBankName, setPayBankName] = useState('');
  const [payInstructions, setPayInstructions] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Saved items
  const [savedData, setSavedData] = useState<{ products: Product[]; rooms: Room[]; posts: any[] }>({
    products: [],
    rooms: [],
    posts: [],
  });

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Orders
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const cust = await apiRequest('/orders');
      setCustomerOrders(cust || []);
      const sell = await apiRequest('/seller/orders');
      setSellerOrders(sell || []);
    } catch {
      // ignore
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      await apiRequest(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
      await loadOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setPhone(user.phone);
      setBio(user.bio || '');
      setLocation(user.location || '');
      setProfilePhoto(user.profile_photo || '');
      loadTabContext();
    }
  }, [user, activeTab]);

  const loadTabContext = async () => {
    try {
      if (activeTab === 'saved') {
        const res = await apiRequest('/saved');
        setSavedData(res || { products: [], rooms: [], posts: [] });
      } else if (activeTab === 'notifications') {
        const res = await apiRequest<Notification[]>('/notifications');
        setNotifications(res || []);
      } else if (activeTab === 'orders') {
        await loadOrders();
      } else if (activeTab === 'selling' || activeTab === 'account-selling') {
        if (user?.role === 'advertiser' || user?.role === 'admin') {
          const prods = await apiRequest<{ products: Product[] }>('/products');
          const mine = prods.products?.filter(p => p.advertiser_id === user.id) || [];
          setMyProducts(mine);
        }
      }
    } catch {
      // ignore
    }
  };

  // Save profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await updateProfile({
        full_name: fullName,
        phone,
        bio,
        location,
        profile_photo: profilePhoto,
      });
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Move-out notice (Section 8)
  const handleSubmitMoveOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveOutDate) {
      toast.error('Please specify your expected move-out date');
      return;
    }

    try {
      setSubmittingNotice(true);
      await apiRequest('/residence/move-out-notice', {
        method: 'POST',
        body: JSON.stringify({
          expected_date: moveOutDate,
          notes: moveOutMessage,
          share_to_community: shareNoticeToCommunity,
        }),
      });

      toast.success('Move-out notice posted! Your room is now listed under Upcoming Vacancies.');
      await refreshUser();
      setMoveOutDate('');
      setMoveOutMessage('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post move-out notice');
    } finally {
      setSubmittingNotice(false);
    }
  };

  // Advertiser application (Section 14)
  const handleSubmitAdvertiserApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName || !intendedProducts) {
      toast.error('Store name and intended product types are required');
      return;
    }

    try {
      setSubmittingApplication(true);
      await apiRequest('/advertiser/apply', {
        method: 'POST',
        body: JSON.stringify({
          business_name: bizName,
          business_description: bizDesc,
          location: bizLocation,
          intended_products: intendedProducts,
          payment_methods: appMpesaPhone ? [
            {
              type: 'mpesa',
              account_name: appMpesaName || user?.full_name,
              phone_number: appMpesaPhone,
              instructions: 'Send directly via M-Pesa. Contact seller first.',
            }
          ] : [],
        }),
      });

      toast.success('Advertiser application submitted! Management will review shortly.');
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit application');
    } finally {
      setSubmittingApplication(false);
    }
  };

  // Add Product (Section 16)
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) {
      toast.error('Product title and price are required');
      return;
    }

    try {
      setSubmittingProduct(true);
      await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: newProdName,
          description: newProdDesc,
          category_id: newProdCat,
          price: Number(newProdPrice),
          condition: newProdCondition,
          quantity: Number(newProdQty) || 1,
          location: user?.location || 'Capital Home Residence',
          images: newProdImage ? [newProdImage] : [
            '/src/assets/images/marketplace_item_setup_1790501145428.jpg'
          ],
          delivery_info: newProdDelivery,
        }),
      });

      toast.success('Product created and published!');
      setIsAddProductOpen(false);
      setNewProdName('');
      setNewProdDesc('');
      setNewProdPrice('');
      setNewProdImage('');
      loadTabContext();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create product');
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product listing?')) return;
    try {
      await apiRequest(`/products/${id}`, { method: 'DELETE' });
      toast.success('Product deleted');
      setMyProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  // Add Payment Method (Section 15 & 18)
  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAccName) {
      toast.error('Account name is required');
      return;
    }

    try {
      setSubmittingPayment(true);
      await apiRequest('/advertiser/payment-methods', {
        method: 'POST',
        body: JSON.stringify({
          payment_type: payType,
          account_name: payAccName,
          phone_number: payPhone,
          account_number: payAccNumber,
          bank_name: payBankName,
          instructions: payInstructions,
        }),
      });

      toast.success('Payment method saved');
      setIsAddPaymentOpen(false);
      setPayAccName('');
      setPayPhone('');
      setPayAccNumber('');
      setPayBankName('');
      setPayInstructions('');
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add payment method');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm('Remove this payment method?')) return;
    try {
      await apiRequest(`/advertiser/payment-methods/${id}`, { method: 'DELETE' });
      toast.success('Payment method removed');
      await refreshUser();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove payment method');
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      toast.success('Marked all as read');
    } catch {
      // ignore
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Profile Summary */}
      <div className="bg-white rounded-3xl border border-[#E4E7EC] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={user.profile_photo || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`}
            alt={user.full_name}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl object-cover bg-[#F1F3F5] ring-4 ring-[#E4E7EC] shrink-0"
          />
          <div>
            <h1 className="text-xl font-extrabold text-[#102A43]">
              {user.full_name}
            </h1>
            <p className="text-xs text-[#667085]">{user.email} · {user.phone}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                user.role === 'admin'
                  ? 'bg-rose-100 text-rose-800'
                  : user.role === 'resident'
                  ? 'bg-[#102A43] text-[#D9A441]'
                  : user.role === 'advertiser'
                  ? 'bg-[#fef8eb] text-[#102A43] border border-[#D9A441]/40'
                  : 'bg-[#F1F3F5] text-[#172B4D]'
              }`}>
                {user.role === 'normal_user' ? 'Student Member' : user.role}
              </span>
              {residentRoom && (
                <span className="text-xs font-bold text-[#102A43] bg-[#fef8eb] px-2 py-0.5 rounded-md border border-[#D9A441]/40">
                  {residentRoom.room_number} ({residentRoom.room_type})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-[#E4E7EC] overflow-x-auto gap-2">
        {[
          { id: 'profile', label: 'My Profile', icon: User },
          { id: 'residence', label: 'My Room & Vacancy', icon: KeyRound },
          { id: 'selling', label: 'Seller Hub', icon: Store },
          { id: 'orders', label: 'Orders & Sales', icon: ShoppingBag },
          { id: 'saved', label: 'Saved Items', icon: Bookmark },
          { id: 'notifications', label: 'Notifications', icon: Bell },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id || activeTab === `account-${t.id}`;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition ${
                isActive
                  ? 'border-[#D9A441] text-[#102A43]'
                  : 'border-transparent text-[#667085] hover:text-[#102A43]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Profile Settings */}
      {(activeTab === 'profile') && (
        <div className="bg-white rounded-3xl border border-[#E4E7EC] p-6 max-w-2xl space-y-5">
          <h2 className="text-base font-bold text-[#102A43]">Personal Information</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-[#172B4D] block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441] text-[#172B4D]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#172B4D] block mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441] text-[#172B4D]"
                />
              </div>
              <div>
                <label className="font-semibold text-[#172B4D] block mb-1">Location / Block</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Capital Home Block A, 2nd Floor"
                  className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441] text-[#172B4D]"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#172B4D] block mb-1">Profile Photo URL</label>
              <input
                type="url"
                value={profilePhoto}
                onChange={(e) => setProfilePhoto(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441] text-[#172B4D]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#172B4D] block mb-1">Bio / Notes</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Student details, course, semester..."
                className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441] text-[#172B4D]"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 bg-[#102A43] hover:bg-[#1b3d5e] disabled:opacity-50 text-[#D9A441] rounded-xl font-bold transition"
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: Residence & Moving Out Notice (Section 8) */}
      {(activeTab === 'residence' || activeTab === 'account-residence') && (
        <div className="space-y-6">
          {residentRoom ? (
            <div className="bg-white rounded-3xl border border-[#E4E7EC] p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#D9A441]">
                    Currently Assigned Room
                  </span>
                  <h2 className="text-2xl font-extrabold text-[#102A43]">
                    {residentRoom.room_number}
                  </h2>
                  <p className="text-xs text-[#667085]">
                    {residentRoom.room_type} · KSh {residentRoom.price.toLocaleString()} / semester
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    residentRoom.status === 'MOVING_OUT'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-[#102A43] text-[#D9A441]'
                  }`}>
                    {residentRoom.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => onSelectRoom(residentRoom.id)}
                    className="px-3 py-1.5 bg-[#F1F3F5] hover:bg-[#E4E7EC] text-[#172B4D] rounded-xl text-xs font-semibold"
                  >
                    View Listing
                  </button>
                </div>
              </div>

              {/* MOVING-OUT SYSTEM (Section 8) */}
              <div className="p-5 rounded-2xl bg-[#fef8eb] border border-[#D9A441]/40 space-y-4">
                <div className="flex items-center gap-2 text-[#102A43] font-bold text-sm">
                  <Calendar className="w-5 h-5 text-[#D9A441]" />
                  <span>Notify Other Users: Moving Out / Vacancy Notice</span>
                </div>
                <p className="text-xs text-[#172B4D] leading-relaxed">
                  Are you leaving at the end of the semester? Post a moving-out notice so upcoming students can see your room under <strong>Upcoming Vacancies</strong> and reserve it ahead of time.
                </p>

                <form onSubmit={handleSubmitMoveOut} className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-[#172B4D] block mb-1">
                      Expected Move-Out Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={moveOutDate}
                      onChange={(e) => setMoveOutDate(e.target.value)}
                      className="w-full sm:w-64 px-3 py-2 bg-white border border-[#D9A441]/50 rounded-xl focus:ring-2 focus:ring-[#D9A441]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#172B4D] block mb-1">
                      Message / Room Condition Notes for Incoming Students
                    </label>
                    <textarea
                      rows={3}
                      value={moveOutMessage}
                      onChange={(e) => setMoveOutMessage(e.target.value)}
                      placeholder="e.g. Room is very quiet, on second floor, study desk is clean, Wi-Fi signal is strong..."
                      className="w-full px-3 py-2 bg-white border border-[#D9A441]/50 rounded-xl focus:ring-2 focus:ring-[#D9A441]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="shareNotice"
                      checked={shareNoticeToCommunity}
                      onChange={(e) => setShareNoticeToCommunity(e.target.checked)}
                      className="rounded text-[#D9A441] focus:ring-[#D9A441]"
                    />
                    <label htmlFor="shareNotice" className="text-xs text-[#172B4D] font-medium">
                      Also share this vacancy notice to the Community Social Feed
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingNotice}
                    className="px-5 py-2.5 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl font-bold transition flex items-center gap-2"
                  >
                    <span>{submittingNotice ? 'Publishing...' : 'Publish Move-Out Notice'}</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#E4E7EC] p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#F1F3F5] text-[#102A43] flex items-center justify-center mx-auto">
                <DoorOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#102A43]">You are not assigned to a room</h3>
              <p className="text-xs text-[#667085] max-w-sm mx-auto">
                Once residence administration allocates you a room in Capital Home Residence, your room details and move-out tools will appear here.
              </p>
              <button
                onClick={() => onSelectRoom('old-18')}
                className="px-4 py-2 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl text-xs font-bold"
              >
                Browse Available Vacancies
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Selling / Advertiser Hub (Section 14, 15, 16) */}
      {(activeTab === 'selling' || activeTab === 'account-selling') && (
        <div className="space-y-6">
          {user.role === 'advertiser' || user.role === 'admin' ? (
            /* Approved Advertiser View */
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="bg-[#102A43] rounded-3xl text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#D9A441] uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verified Advertiser Profile</span>
                  </div>
                  <h2 className="text-2xl font-extrabold mt-1 text-white">Marketplace Store & Listings</h2>
                  <p className="text-xs text-slate-300">
                    Manage your student listings and payment methods.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAddPaymentOpen(true)}
                    className="px-4 py-2 bg-[#1b3d5e] hover:bg-[#234b73] border border-[#D9A441]/40 text-[#D9A441] rounded-xl text-xs font-semibold"
                  >
                    Payment Methods ({paymentMethods.length})
                  </button>
                  <button
                    onClick={() => setIsAddProductOpen(true)}
                    className="px-4 py-2 bg-[#D9A441] hover:bg-[#c99532] text-[#102A43] rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {/* Payment Methods Section (Section 15 & 18) */}
              <div className="bg-white rounded-3xl border border-[#E4E7EC] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#102A43]">
                      Configured Payment Methods
                    </h3>
                    <p className="text-xs text-[#667085]">
                      These payment details automatically appear on all your active product listings.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddPaymentOpen(true)}
                    className="text-xs font-bold text-[#102A43] hover:text-[#D9A441]"
                  >
                    + Add Method
                  </button>
                </div>

                {paymentMethods.length === 0 ? (
                  <div className="p-4 bg-[#fef8eb] rounded-2xl border border-[#D9A441]/40 text-xs text-[#172B4D]">
                    You haven't configured any payment methods yet. Add your M-Pesa phone number or bank details so buyers can pay you upon product inspection.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {paymentMethods.map(pm => (
                      <div key={pm.id} className="p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] text-xs space-y-1 relative group">
                        <div className="flex items-center justify-between font-bold text-[#172B4D]">
                          <span className="uppercase text-[#D9A441] font-extrabold text-[10px]">{pm.payment_type}</span>
                          <button
                            onClick={() => handleDeletePaymentMethod(pm.id)}
                            className="text-[#667085] hover:text-[#DC2626] p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="font-semibold text-[#172B4D]">{pm.account_name}</p>
                        {pm.phone_number && <p className="text-[#667085]">Tel: {pm.phone_number}</p>}
                        {pm.bank_name && <p className="text-[#667085]">{pm.bank_name} (Acc: {pm.account_number})</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* My Products List */}
              <div className="bg-white rounded-3xl border border-[#E4E7EC] p-6 space-y-4">
                <h3 className="text-sm font-bold text-[#102A43]">
                  My Active Products ({myProducts.length})
                </h3>

                {myProducts.length === 0 ? (
                  <p className="text-xs text-[#667085] italic">No products published yet.</p>
                ) : (
                  <div className="divide-y divide-[#E4E7EC]">
                    {myProducts.map(p => (
                      <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images[0] || '/src/assets/images/marketplace_item_setup_1790501145428.jpg'}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-[#102A43]">{p.name}</h4>
                            <p className="text-xs font-extrabold text-[#102A43]">
                              KSh {p.price.toLocaleString()} · {p.condition} · Qty: {p.quantity}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectProduct(p.id)}
                            className="p-1.5 text-xs text-[#667085] hover:text-[#102A43]"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-xs text-[#667085] hover:text-[#DC2626]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : advertiserApplication && advertiserApplication.status === 'pending' ? (
            /* Application Pending Review */
            <div className="bg-white rounded-3xl border border-[#E4E7EC] p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#fef8eb] text-[#D9A441] flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#102A43]">Application Under Review</h3>
              <p className="text-xs text-[#667085] max-w-md mx-auto leading-relaxed">
                Your application for <strong>"{advertiserApplication.business_name}"</strong> has been received by Capital Home administration. Once approved, you can add products and manage your student store.
              </p>
            </div>
          ) : (
            /* Apply for Advertiser Form (Section 14) */
            <div className="bg-white rounded-3xl border border-[#E4E7EC] p-6 max-w-2xl space-y-5">
              <div>
                <span className="text-xs font-bold text-[#D9A441] uppercase tracking-wider">
                  Verification Required
                </span>
                <h2 className="text-xl font-extrabold text-[#102A43]">
                  Apply for Marketplace Advertiser Verification
                </h2>
                <p className="text-xs text-[#667085] mt-1">
                  To protect our students from fraud, sellers must be verified by management before listing products.
                </p>
              </div>

              <form onSubmit={handleSubmitAdvertiserApp} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-[#172B4D] block mb-1">Store / Business Name *</label>
                  <input
                    type="text"
                    required
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    placeholder="e.g. Campus Tech & Essentials"
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441] text-[#172B4D]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#172B4D] block mb-1">Business Description</label>
                  <textarea
                    rows={2}
                    value={bizDesc}
                    onChange={(e) => setBizDesc(e.target.value)}
                    placeholder="What kind of goods or services do you offer to students?"
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441] text-[#172B4D]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#172B4D] block mb-1">Business Location</label>
                    <input
                      type="text"
                      value={bizLocation}
                      onChange={(e) => setBizLocation(e.target.value)}
                      placeholder="e.g. Capital Home Block B"
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441] text-[#172B4D]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#172B4D] block mb-1">Intended Product Types *</label>
                    <input
                      type="text"
                      required
                      value={intendedProducts}
                      onChange={(e) => setIntendedProducts(e.target.value)}
                      placeholder="e.g. Laptops, phones, books, furniture"
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441] text-[#172B4D]"
                    />
                  </div>
                </div>

                {/* Initial Payment Method Info (Section 14 & 45: No M-Pesa API, manual details) */}
                <div className="p-4 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] space-y-3">
                  <h4 className="font-bold text-[#102A43] text-xs">Preferred Payment Information</h4>
                  <p className="text-[11px] text-[#667085]">
                    Buyers will pay you directly using these details. Capital Home does not process payments.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-[#172B4D] block mb-1">M-Pesa Phone Number</label>
                      <input
                        type="tel"
                        value={appMpesaPhone}
                        onChange={(e) => setAppMpesaPhone(e.target.value)}
                        placeholder="07XXXXXXXX"
                        className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl bg-white text-[#172B4D]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[#172B4D] block mb-1">M-Pesa Account Name</label>
                      <input
                        type="text"
                        value={appMpesaName}
                        onChange={(e) => setAppMpesaName(e.target.value)}
                        placeholder="Full registered name"
                        className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl bg-white text-[#172B4D]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingApplication}
                  className="px-6 py-2.5 bg-[#102A43] hover:bg-[#1b3d5e] disabled:opacity-50 text-[#D9A441] rounded-xl font-bold transition"
                >
                  {submittingApplication ? 'Submitting...' : 'Submit Application for Approval'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB: Orders & Sales (Manual M-Pesa Verification Workflow) */}
      {activeTab === 'orders' && (
        <div className="space-y-6 text-xs">
          {/* Incoming Seller Orders (For advertisers & admin) */}
          {(user.role === 'advertiser' || user.role === 'admin') && (
            <div className="bg-white rounded-3xl border border-[#E4E7EC] p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#D9A441] uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Seller Verification Hub</span>
                  </div>
                  <h3 className="text-lg font-black text-[#102A43]">
                    Incoming Customer Orders ({sellerOrders.length})
                  </h3>
                  <p className="text-xs text-[#667085]">
                    Verify the M-Pesa transaction code received on your phone, then update order progress.
                  </p>
                </div>
                <button
                  onClick={loadOrders}
                  className="px-3 py-1.5 rounded-xl border border-[#E4E7EC] hover:bg-[#F7F8FA] font-bold text-[#102A43]"
                >
                  Refresh
                </button>
              </div>

              {sellerOrders.length === 0 ? (
                <div className="p-8 text-center bg-[#F7F8FA] rounded-2xl border border-dashed border-[#E4E7EC] space-y-2">
                  <ShoppingBag className="w-8 h-8 text-[#667085] mx-auto" />
                  <p className="text-xs font-semibold text-[#102A43]">No customer orders received yet.</p>
                  <p className="text-[11px] text-[#667085]">When residents purchase your marketplace items, their M-Pesa transaction details will appear here for verification.</p>
                </div>
              ) : (
                <div className="space-y-4 divide-y divide-[#E4E7EC]">
                  {sellerOrders.map(order => (
                    <div key={order.id} className="pt-4 first:pt-0 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-[#102A43] text-sm">{order.id}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              order.status === 'payment_submitted'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : order.status === 'payment_confirmed'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'processing'
                                ? 'bg-purple-100 text-purple-800'
                                : order.status === 'ready_for_pickup'
                                ? 'bg-indigo-100 text-indigo-800'
                                : order.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              {order.status === 'payment_submitted' ? 'Payment Submitted — Awaiting Verification' : order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#667085] mt-0.5">
                            Customer: <strong className="text-[#102A43]">{order.customer_name}</strong> · Phone: {order.customer_phone} · {order.customer_room ? `Room ${order.customer_room}` : 'Lobby'}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-black text-[#102A43]">
                            KSh {order.total_amount.toLocaleString()}
                          </p>
                          <span className="text-[10px] text-[#667085]">
                            {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Payment Verification Box */}
                      <div className="p-3 rounded-2xl bg-[#fef8eb] border border-[#D9A441]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-[#D9A441] uppercase">Submitted M-PESA Code</span>
                          <p className="font-mono text-sm font-black text-[#102A43] tracking-wider">
                            {order.mpesa_transaction_code}
                          </p>
                          <p className="text-[10px] text-[#667085]">
                            Amount Claimed: <strong>KSh {order.amount_paid.toLocaleString()}</strong> · Method: {order.payment_method_used?.title || 'M-PESA'}
                          </p>
                        </div>

                        {/* Order status progression buttons */}
                        <div className="flex flex-wrap gap-1.5 shrink-0">
                          {order.status === 'payment_submitted' && (
                            <button
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleUpdateOrderStatus(order.id, 'payment_confirmed')}
                              className="px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803d] text-white rounded-xl font-bold shadow-xs transition"
                            >
                              Confirm Payment
                            </button>
                          )}
                          {order.status === 'payment_confirmed' && (
                            <button
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                              className="px-3 py-1.5 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl font-bold transition"
                            >
                              Start Processing
                            </button>
                          )}
                          {order.status === 'processing' && (
                            <button
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleUpdateOrderStatus(order.id, 'ready_for_pickup')}
                              className="px-3 py-1.5 bg-[#102A43] hover:bg-[#1b3d5e] text-white rounded-xl font-bold transition"
                            >
                              Ready for Pickup / Shipped
                            </button>
                          )}
                          {order.status === 'ready_for_pickup' && (
                            <button
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                              className="px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803d] text-white rounded-xl font-bold transition"
                            >
                              Mark Delivered
                            </button>
                          )}
                          {order.status === 'delivered' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A] px-2.5 py-1 rounded-lg bg-emerald-50">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Delivered & Closed</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-1.5 pl-2">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] text-[#667085]">
                            <span className="truncate">
                              {item.quantity}x {item.name} {item.selected_variation ? `(${item.selected_variation})` : ''}
                            </span>
                            <span className="font-bold text-[#102A43]">
                              KSh {(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* My Purchases (Customer Orders) */}
          <div className="bg-white rounded-3xl border border-[#E4E7EC] p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-[#102A43]">
              My Marketplace Purchases ({customerOrders.length})
            </h3>

            {customerOrders.length === 0 ? (
              <div className="p-8 text-center bg-[#F7F8FA] rounded-2xl border border-dashed border-[#E4E7EC] space-y-2">
                <ShoppingBag className="w-8 h-8 text-[#667085] mx-auto" />
                <p className="text-xs font-semibold text-[#102A43]">You haven't placed any orders yet.</p>
                <p className="text-[11px] text-[#667085]">Visit the Capital Home Marketplace to buy study essentials, electronics, or room furniture.</p>
              </div>
            ) : (
              <div className="space-y-3 divide-y divide-[#E4E7EC]">
                {customerOrders.map(order => (
                  <div key={order.id} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#102A43]">{order.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            order.status === 'payment_submitted'
                              ? 'bg-amber-100 text-amber-800'
                              : order.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {order.status === 'payment_submitted' ? 'Payment Submitted — Awaiting Verification' : order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#667085] mt-0.5">
                          Seller: <strong>{order.advertiser_name}</strong> · M-Pesa Code: <span className="font-mono font-bold text-[#102A43]">{order.mpesa_transaction_code}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-black text-sm text-[#102A43]">
                          KSh {order.total_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 pl-2">
                      {order.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-[11px] text-[#667085]">
                          <span>{it.quantity}x {it.name} {it.selected_variation ? `(${it.selected_variation})` : ''}</span>
                          <span className="font-bold text-[#102A43]">KSh {(it.price * it.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Saved Items */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#E4E7EC] p-6 space-y-4">
            <h3 className="text-base font-bold text-[#102A43]">
              Saved Rooms ({savedData.rooms.length})
            </h3>
            {savedData.rooms.length === 0 ? (
              <p className="text-xs text-[#667085]">No rooms saved yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {savedData.rooms.map(r => (
                  <div
                    key={r.id}
                    onClick={() => onSelectRoom(r.id)}
                    className="p-3 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] hover:border-[#D9A441] cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-[#102A43]">{r.room_number}</h4>
                      <p className="text-[11px] text-[#102A43] font-bold">KSh {r.price.toLocaleString()} / sem</p>
                    </div>
                    <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded border border-[#E4E7EC] text-[#172B4D]">
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-[#E4E7EC] p-6 space-y-4">
            <h3 className="text-base font-bold text-[#102A43]">
              Saved Products ({savedData.products.length})
            </h3>
            {savedData.products.length === 0 ? (
              <p className="text-xs text-[#667085]">No products saved yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {savedData.products.map(p => (
                  <div
                    key={p.id}
                    onClick={() => onSelectProduct(p.id)}
                    className="p-3 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] hover:border-[#D9A441] cursor-pointer transition flex items-center justify-between"
                  >
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-[#102A43] truncate">{p.name}</h4>
                      <p className="text-[11px] text-[#102A43] font-bold">KSh {p.price.toLocaleString()}</p>
                    </div>
                    <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded border border-[#E4E7EC] shrink-0 ml-2 text-[#172B4D]">
                      {p.condition}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl border border-[#E4E7EC] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#102A43]">
              Notification Activity
            </h3>
            {notifications.some(n => !n.read_at) && (
              <button
                onClick={handleMarkAllNotifsRead}
                className="text-xs text-[#D9A441] font-bold hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-[#667085] italic py-6 text-center">No notifications yet.</p>
          ) : (
            <div className="divide-y divide-[#E4E7EC]">
              {notifications.map(n => (
                <div key={n.id} className={`py-3 flex items-start justify-between gap-3 ${!n.read_at ? 'bg-[#fef8eb] p-2 rounded-xl' : ''}`}>
                  <div>
                    <h4 className="text-xs font-bold text-[#102A43]">{n.title}</h4>
                    <p className="text-xs text-[#667085] mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-[#667085]">
                      {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Product Modal (Section 16) */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center flex items-center justify-center">
            <div className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-xs" onClick={() => setIsAddProductOpen(false)} />
            <div className="inline-block w-full max-w-lg p-6 my-8 text-left align-middle bg-white shadow-2xl rounded-3xl relative z-10 border border-[#E4E7EC]">
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="absolute top-5 right-5 text-[#667085] hover:text-[#102A43] p-1.5 rounded-xl hover:bg-[#F1F3F5]"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-[#102A43] mb-1">
                Add Product Advertisement
              </h3>
              <p className="text-xs text-[#667085] mb-4">
                Your payment details will automatically be attached to this listing.
              </p>

              <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-[#172B4D] block mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. HP EliteBook 840 G6"
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441] text-[#172B4D]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#172B4D] block mb-1">Category</label>
                    <select
                      value={newProdCat}
                      onChange={(e) => setNewProdCat(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl bg-white text-[#172B4D]"
                    >
                      <option value="cat-computers">Computers & Laptops</option>
                      <option value="cat-phones">Phones & Tablets</option>
                      <option value="cat-electronics">Electronics</option>
                      <option value="cat-furniture">Furniture & Decor</option>
                      <option value="cat-books">Books & Stationery</option>
                      <option value="cat-household">Household Items</option>
                      <option value="cat-clothing">Clothing & Shoes</option>
                      <option value="cat-services">Student Services</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-[#172B4D] block mb-1">Price (KSh) *</label>
                    <input
                      type="number"
                      required
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      placeholder="e.g. 35000"
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-[#172B4D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#172B4D] block mb-1">Condition</label>
                    <select
                      value={newProdCondition}
                      onChange={(e) => setNewProdCondition(e.target.value as any)}
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl bg-white text-[#172B4D]"
                    >
                      <option value="Used">Used</option>
                      <option value="New">New</option>
                      <option value="Refurbished">Refurbished</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-[#172B4D] block mb-1">Quantity / Stock</label>
                    <input
                      type="number"
                      value={newProdQty}
                      onChange={(e) => setNewProdQty(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-[#172B4D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#172B4D] block mb-1">Image URL</label>
                  <input
                    type="url"
                    value={newProdImage}
                    onChange={(e) => setNewProdImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-[#172B4D]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#172B4D] block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    placeholder="Specs, usage history, included accessories..."
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-[#172B4D]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(false)}
                    className="flex-1 py-2 bg-[#F1F3F5] rounded-xl font-semibold text-[#172B4D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProduct}
                    className="flex-2 py-2 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl font-bold"
                  >
                    {submittingProduct ? 'Publishing...' : 'Publish Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal (Section 15 & 18) */}
      {isAddPaymentOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center flex items-center justify-center">
            <div className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-xs" onClick={() => setIsAddPaymentOpen(false)} />
            <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle bg-white shadow-2xl rounded-3xl relative z-10 border border-[#E4E7EC]">
              <button
                onClick={() => setIsAddPaymentOpen(false)}
                className="absolute top-5 right-5 text-[#667085] hover:text-[#102A43] p-1.5 rounded-xl hover:bg-[#F1F3F5]"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-[#102A43] mb-1">
                Configure Seller Payment Method
              </h3>
              <p className="text-xs text-[#667085] mb-4">
                Manual payment instructions for buyers. (No automated API).
              </p>

              <form onSubmit={handleAddPaymentMethod} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-[#172B4D] block mb-1">Payment Method Type</label>
                  <select
                    value={payType}
                    onChange={(e) => setPayType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl bg-white text-[#172B4D]"
                  >
                    <option value="mpesa">M-Pesa (Send Money / Till)</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cash">Cash on Collection</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#172B4D] block mb-1">Account / Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={payAccName}
                    onChange={(e) => setPayAccName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-[#172B4D]"
                  />
                </div>

                {payType === 'mpesa' && (
                  <div>
                    <label className="font-semibold text-[#172B4D] block mb-1">Phone / Till Number</label>
                    <input
                      type="tel"
                      value={payPhone}
                      onChange={(e) => setPayPhone(e.target.value)}
                      placeholder="07XXXXXXXX"
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-[#172B4D]"
                    />
                  </div>
                )}

                {payType === 'bank' && (
                  <>
                    <div>
                      <label className="font-semibold text-[#172B4D] block mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={payBankName}
                        onChange={(e) => setPayBankName(e.target.value)}
                        placeholder="e.g. Equity Bank / KCB"
                        className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-[#172B4D]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[#172B4D] block mb-1">Account Number</label>
                      <input
                        type="text"
                        value={payAccNumber}
                        onChange={(e) => setPayAccNumber(e.target.value)}
                        placeholder="e.g. 1234567890"
                        className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-[#172B4D]"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="font-semibold text-[#172B4D] block mb-1">Instructions for Buyer</label>
                  <textarea
                    rows={2}
                    value={payInstructions}
                    onChange={(e) => setPayInstructions(e.target.value)}
                    placeholder="e.g. Chat with seller and inspect goods before making payment."
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl text-[#172B4D]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddPaymentOpen(false)}
                    className="flex-1 py-2 bg-[#F1F3F5] rounded-xl font-semibold text-[#172B4D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="flex-2 py-2 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl font-bold"
                  >
                    {submittingPayment ? 'Saving...' : 'Save Payment Method'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
