import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  DoorOpen,
  Store,
  FileText,
  AlertTriangle,
  Settings,
  Search,
  Check,
  X,
  UserPlus,
  RefreshCw,
  Eye,
  DollarSign
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Room, RoomRequest, AdvertiserApplication, Product, Report } from '../types';

interface AdminPageProps {
  onSelectRoom: (roomId: string) => void;
  onSelectProduct: (productId: string) => void;
  onOpenChatWithUser?: (userId: string, initialMessage?: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onSelectRoom,
  onSelectProduct,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'rooms' | 'requests' | 'advertisers' | 'products' | 'reports' | 'settings'>('rooms');
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // 1. Rooms state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomCategoryFilter, setRoomCategoryFilter] = useState<'all' | 'Old Room' | 'New Room'>('all');
  const [roomStatusFilter, setRoomStatusFilter] = useState<string>('all');
  const [roomSearch, setRoomSearch] = useState('');
  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState<Room | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStatus, setEditStatus] = useState<Room['status']>('AVAILABLE');
  const [editOccupantName, setEditOccupantName] = useState('');
  const [editMoveOutDate, setEditMoveOutDate] = useState('');
  const [savingRoom, setSavingRoom] = useState(false);

  // Batch price updater
  const [batchOldPrice, setBatchOldPrice] = useState('15000');
  const [batchNewPrice, setBatchNewPrice] = useState('25000');
  const [savingBatchPrices, setSavingBatchPrices] = useState(false);

  // 2. Room Requests state
  const [roomRequests, setRoomRequests] = useState<RoomRequest[]>([]);

  // 3. Advertiser Applications state
  const [advertisers, setAdvertisers] = useState<any[]>([]);

  // 4. Products state
  const [products, setProducts] = useState<Product[]>([]);

  // 5. Reports state
  const [reports, setReports] = useState<Report[]>([]);

  // 6. Settings state
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadStats();
      loadActiveTabData();
    }
  }, [user, activeTab]);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const data = await apiRequest('/admin/stats');
      setStats(data);
    } catch (err: any) {
      toast.error('Failed to load admin stats');
    } finally {
      setLoadingStats(false);
    }
  };

  const loadActiveTabData = async () => {
    try {
      if (activeTab === 'rooms') {
        const res = await apiRequest('/rooms');
        setRooms(res.rooms || []);
      } else if (activeTab === 'requests') {
        const res = await apiRequest('/admin/room-requests');
        setRoomRequests(res || []);
      } else if (activeTab === 'advertisers') {
        const res = await apiRequest('/admin/advertisers');
        setAdvertisers(res || []);
      } else if (activeTab === 'products') {
        const res = await apiRequest('/products');
        setProducts(res.products || []);
      } else if (activeTab === 'reports') {
        const res = await apiRequest('/admin/reports');
        setReports(res || []);
      } else if (activeTab === 'settings') {
        const res = await apiRequest('/admin/settings');
        setPlatformSettings(res);
      }
    } catch (err: any) {
      toast.error('Failed to load tab data');
    }
  };

  // ROOM MANAGEMENT
  const openEditRoomModal = (room: Room) => {
    setSelectedRoomForEdit(room);
    setEditPrice(room.price.toString());
    setEditStatus(room.status);
    setEditOccupantName(room.occupant_name || '');
    setEditMoveOutDate(room.move_out_date || '');
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomForEdit) return;

    try {
      setSavingRoom(true);
      await apiRequest(`/admin/rooms/${selectedRoomForEdit.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          price: Number(editPrice),
          status: editStatus,
          occupant_name: editOccupantName.trim() || null,
          move_out_date: editMoveOutDate || null,
        }),
      });

      toast.success(`Updated ${selectedRoomForEdit.room_number}`);
      setSelectedRoomForEdit(null);
      loadActiveTabData();
      loadStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update room');
    } finally {
      setSavingRoom(false);
    }
  };

  const handleBatchUpdatePrices = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingBatchPrices(true);
      await apiRequest('/admin/rooms/batch-pricing', {
        method: 'PUT',
        body: JSON.stringify({
          old_room_price: Number(batchOldPrice),
          new_room_price: Number(batchNewPrice),
        }),
      });
      toast.success('Updated semester prices for all 82 rooms!');
      loadActiveTabData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update batch prices');
    } finally {
      setSavingBatchPrices(false);
    }
  };

  // ROOM REQUESTS
  const handleReviewRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await apiRequest(`/admin/room-requests/${requestId}/review`, {
        method: 'PUT',
        body: JSON.stringify({ action }),
      });
      toast.success(`Request ${action}d!`);
      loadActiveTabData();
      loadStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to review request');
    }
  };

  // ADVERTISER APPLICATIONS
  const handleReviewAdvertiser = async (appId: string, action: 'approve' | 'reject' | 'suspend') => {
    try {
      await apiRequest(`/admin/advertisers/${appId}/review`, {
        method: 'PUT',
        body: JSON.stringify({ action }),
      });
      toast.success(`Advertiser application ${action}d!`);
      loadActiveTabData();
      loadStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to review advertiser');
    }
  };

  // PRODUCT MODERATION
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to remove this product listing?')) return;
    try {
      await apiRequest(`/products/${id}`, { method: 'DELETE' });
      toast.success('Product deleted');
      loadActiveTabData();
      loadStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  // REPORTS
  const handleResolveReport = async (reportId: string, action_taken?: string) => {
    try {
      await apiRequest(`/admin/reports/${reportId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'resolved', action_taken }),
      });
      toast.success(`Report resolved ${action_taken ? `(${action_taken})` : ''}`);
      loadActiveTabData();
      loadStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve report');
    }
  };

  // PLATFORM SETTINGS
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await apiRequest('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(platformSettings),
      });
      toast.success('Platform settings saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white p-8 rounded-3xl border border-[#E4E7EC] shadow-sm space-y-3">
        <AlertTriangle className="w-12 h-12 text-[#DC2626] mx-auto" />
        <h2 className="text-xl font-bold text-[#102A43]">Administrator Restricted</h2>
        <p className="text-xs text-[#667085]">
          This dashboard requires administrator authorization. Use the top demo bar to switch to the Admin role.
        </p>
      </div>
    );
  }

  // Filtered rooms
  const filteredRooms = rooms.filter(r => {
    if (roomCategoryFilter !== 'all' && r.room_type !== roomCategoryFilter) return false;
    if (roomStatusFilter !== 'all' && r.status.toLowerCase() !== roomStatusFilter.toLowerCase()) return false;
    if (roomSearch && !r.room_number.toLowerCase().includes(roomSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Header */}
      <div className="bg-[#102A43] text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b3d5e] border border-[#D9A441]/40 text-[#D9A441] text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Master Property & Community Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Capital Home Residence Administration
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Overseeing all 82 rooms (54 Old Rooms @ KSh 15,000 & 28 New Rooms @ KSh 25,000), student marketplace verification, vacancies, and moderation.
          </p>
        </div>

        <button
          onClick={() => { loadStats(); loadActiveTabData(); }}
          className="self-start md:self-center px-4 py-2 bg-[#1b3d5e] hover:bg-[#234b73] text-[#D9A441] rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-[#D9A441]/30"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-white border border-[#E4E7EC] shadow-xs">
            <span className="text-[10px] font-bold text-[#667085] uppercase">Total Rooms</span>
            <p className="text-xl font-extrabold text-[#102A43] mt-0.5 tabular-nums">{stats.total_rooms}</p>
            <span className="text-[10px] text-[#16A34A] font-semibold">{stats.available_rooms} Available</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#fef8eb] border border-[#D9A441]/40 shadow-xs">
            <span className="text-[10px] font-bold text-[#D97706] uppercase">Moving Out</span>
            <p className="text-xl font-extrabold text-[#102A43] mt-0.5 tabular-nums">{stats.moving_out_rooms}</p>
            <span className="text-[10px] text-[#D97706] font-semibold">Vacancies upcoming</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 shadow-xs">
            <span className="text-[10px] font-bold text-[#DC2626] uppercase">Reserved Rooms</span>
            <p className="text-xl font-extrabold text-[#DC2626] mt-0.5 tabular-nums">{stats.reserved_rooms}</p>
            <span className="text-[10px] text-[#667085] font-semibold">{stats.pending_room_requests} pending reqs</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-[#E4E7EC] shadow-xs">
            <span className="text-[10px] font-bold text-[#667085] uppercase">Advertisers</span>
            <p className="text-xl font-extrabold text-[#102A43] mt-0.5 tabular-nums">{stats.total_advertisers}</p>
            <span className="text-[10px] text-[#D97706] font-semibold">{stats.pending_applications} pending review</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-[#E4E7EC] shadow-xs">
            <span className="text-[10px] font-bold text-[#667085] uppercase">Marketplace</span>
            <p className="text-xl font-extrabold text-[#102A43] mt-0.5 tabular-nums">{stats.active_products}</p>
            <span className="text-[10px] text-[#667085] font-semibold">{stats.total_products} listed</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-[#E4E7EC] shadow-xs">
            <span className="text-[10px] font-bold text-[#667085] uppercase">Reports</span>
            <p className="text-xl font-extrabold text-[#DC2626] mt-0.5 tabular-nums">{stats.pending_reports}</p>
            <span className="text-[10px] text-[#667085] font-semibold">Flagged items</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#E4E7EC] gap-2 overflow-x-auto">
        {[
          { id: 'rooms', label: 'All 82 Rooms', icon: DoorOpen },
          { id: 'requests', label: `Room Requests (${stats?.pending_room_requests || 0})`, icon: UserPlus },
          { id: 'advertisers', label: `Advertisers (${stats?.pending_applications || 0} Pending)`, icon: Store },
          { id: 'products', label: 'Product Moderation', icon: FileText },
          { id: 'reports', label: `Reports (${stats?.pending_reports || 0})`, icon: AlertTriangle },
          { id: 'settings', label: 'Residence Settings & Pricing', icon: Settings },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
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

      {/* TAB 1: ALL 82 ROOMS MANAGEMENT */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {/* Batch Price Updater */}
          <div className="bg-[#0C2033] text-white rounded-3xl p-5 border border-[#1b3d5e] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#D9A441]" />
                <h3 className="text-sm font-bold text-white">
                  Dynamic Semester Pricing Configuration
                </h3>
              </div>
              <span className="text-[11px] text-slate-300">
                Updates all 54 Old Rooms and 28 New Rooms across the system
              </span>
            </div>

            <form onSubmit={handleBatchUpdatePrices} className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">54 Old Rooms Price:</span>
                <input
                  type="number"
                  value={batchOldPrice}
                  onChange={(e) => setBatchOldPrice(e.target.value)}
                  className="w-28 px-3 py-1.5 bg-[#102A43] border border-[#1b3d5e] rounded-xl text-[#D9A441] font-bold"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">28 New Rooms Price:</span>
                <input
                  type="number"
                  value={batchNewPrice}
                  onChange={(e) => setBatchNewPrice(e.target.value)}
                  className="w-28 px-3 py-1.5 bg-[#102A43] border border-[#1b3d5e] rounded-xl text-[#D9A441] font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={savingBatchPrices}
                className="px-4 py-1.5 bg-[#D9A441] hover:bg-[#c49132] text-[#102A43] rounded-xl font-extrabold transition shadow"
              >
                {savingBatchPrices ? 'Updating...' : 'Apply Prices'}
              </button>
            </form>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-[#E4E7EC] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap gap-1 p-1 bg-[#F1F3F5] rounded-xl">
              <button
                onClick={() => setRoomCategoryFilter('all')}
                className={`px-3 py-1 font-bold rounded-lg ${roomCategoryFilter === 'all' ? 'bg-white text-[#102A43] shadow-xs' : 'text-[#667085]'}`}
              >
                All 82 Rooms
              </button>
              <button
                onClick={() => setRoomCategoryFilter('Old Room')}
                className={`px-3 py-1 font-bold rounded-lg ${roomCategoryFilter === 'Old Room' ? 'bg-[#102A43] text-[#D9A441]' : 'text-[#667085]'}`}
              >
                54 Old Rooms
              </button>
              <button
                onClick={() => setRoomCategoryFilter('New Room')}
                className={`px-3 py-1 font-bold rounded-lg ${roomCategoryFilter === 'New Room' ? 'bg-[#102A43] text-[#D9A441]' : 'text-[#667085]'}`}
              >
                28 New Rooms
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roomStatusFilter}
                onChange={(e) => setRoomStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 border border-[#E4E7EC] rounded-xl bg-white text-[#172B4D]"
              >
                <option value="all">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="MOVING_OUT">Moving Out</option>
                <option value="RESERVED">Reserved</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#667085] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  placeholder="Filter room number..."
                  className="pl-8 pr-3 py-1.5 border border-[#E4E7EC] rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Rooms Table */}
          <div className="bg-white rounded-3xl border border-[#E4E7EC] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F8FA] border-b border-[#E4E7EC] text-[#667085] font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Room #</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Price / Sem</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Current Occupant</th>
                    <th className="py-3 px-4">Move-out Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC]">
                  {filteredRooms.map(room => (
                    <tr key={room.id} className="hover:bg-[#F7F8FA] transition">
                      <td className="py-3 px-4 font-bold text-[#102A43]">{room.room_number}</td>
                      <td className="py-3 px-4 text-[#667085]">{room.room_type}</td>
                      <td className="py-3 px-4 font-extrabold text-[#102A43]">KSh {room.price.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          room.status === 'AVAILABLE'
                            ? 'bg-[#16A34A]/15 text-[#16A34A]'
                            : room.status === 'MOVING_OUT'
                            ? 'bg-[#D97706]/15 text-[#D97706]'
                            : room.status === 'RESERVED'
                            ? 'bg-[#DC2626]/15 text-[#DC2626]'
                            : 'bg-[#F1F3F5] text-[#667085]'
                        }`}>
                          {room.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#172B4D]">
                        {room.occupant_name || <span className="text-[#667085] italic">None (Empty)</span>}
                      </td>
                      <td className="py-3 px-4 text-[#667085]">
                        {room.move_out_date || '—'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => openEditRoomModal(room)}
                          className="px-2.5 py-1 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-lg font-bold transition"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => onSelectRoom(room.id)}
                          className="p-1 text-[#667085] hover:text-[#102A43]"
                          title="View public page"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROOM REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-[#E4E7EC] p-6 space-y-4">
          <h3 className="text-base font-bold text-[#102A43]">
            Room Reservation Requests ({roomRequests.length})
          </h3>

          {roomRequests.length === 0 ? (
            <p className="text-xs text-[#667085] italic py-6 text-center">No pending room requests.</p>
          ) : (
            <div className="divide-y divide-[#E4E7EC]">
              {roomRequests.map(req => (
                <div key={req.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#102A43]">{req.room_number}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        req.status === 'approved' ? 'bg-[#16A34A]/15 text-[#16A34A]' : req.status === 'rejected' ? 'bg-[#DC2626]/15 text-[#DC2626]' : 'bg-[#D97706]/15 text-[#D97706]'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#172B4D]">
                      Applicant: <strong>{req.applicant_name}</strong> · Tel: {req.applicant_phone} · Email: {req.applicant_email}
                    </p>

                    <p className="text-xs text-[#667085]">
                      Preferred Move-in: <strong>{req.preferred_move_in_date}</strong>
                    </p>

                    {req.message && (
                      <p className="text-xs text-[#172B4D] bg-[#F7F8FA] p-2 rounded-xl border border-[#E4E7EC] mt-1">
                        "{req.message}"
                      </p>
                    )}
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleReviewRequest(req.id, 'approve')}
                        className="px-3.5 py-1.5 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl text-xs font-bold transition flex items-center gap-1 shadow"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Reserve</span>
                      </button>

                      <button
                        onClick={() => handleReviewRequest(req.id, 'reject')}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#DC2626] rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADVERTISER APPLICATIONS */}
      {activeTab === 'advertisers' && (
        <div className="bg-white rounded-3xl border border-[#E4E7EC] p-6 space-y-4">
          <h3 className="text-base font-bold text-[#102A43]">
            Advertiser Applications & Stores ({advertisers.length})
          </h3>

          {advertisers.length === 0 ? (
            <p className="text-xs text-[#667085] italic py-6 text-center">No advertiser applications submitted yet.</p>
          ) : (
            <div className="divide-y divide-[#E4E7EC]">
              {advertisers.map(app => (
                <div key={app.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#102A43]">{app.business_name}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        app.status === 'approved' ? 'bg-[#16A34A]/15 text-[#16A34A]' : app.status === 'rejected' ? 'bg-[#DC2626]/15 text-[#DC2626]' : 'bg-[#D97706]/15 text-[#D97706]'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#172B4D]">
                      Applicant: <strong>{app.applicant?.full_name}</strong> · Tel: {app.applicant?.phone} · Location: {app.location}
                    </p>

                    <p className="text-xs text-[#667085]">
                      Intended Goods: {app.intended_products}
                    </p>

                    {app.payment_methods && app.payment_methods.length > 0 && (
                      <div className="text-[11px] text-[#172B4D] bg-[#F7F8FA] p-2 rounded-xl mt-1">
                        <strong>Specified Payment:</strong> {app.payment_methods.map((pm: any) => `${pm.type.toUpperCase()}: ${pm.phone_number || pm.account_number} (${pm.account_name})`).join(' | ')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {app.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleReviewAdvertiser(app.id, 'approve')}
                          className="px-3.5 py-1.5 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl text-xs font-bold transition shadow"
                        >
                          Approve Advertiser
                        </button>
                        <button
                          onClick={() => handleReviewAdvertiser(app.id, 'reject')}
                          className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#DC2626] rounded-xl text-xs font-bold transition"
                        >
                          Reject
                        </button>
                      </>
                    ) : app.status === 'approved' ? (
                      <button
                        onClick={() => handleReviewAdvertiser(app.id, 'suspend')}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-[#DC2626] rounded-xl text-xs font-semibold transition"
                      >
                        Suspend Store
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PRODUCT MODERATION */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-[#E4E7EC] p-6 space-y-4">
          <h3 className="text-base font-bold text-[#102A43]">
            Marketplace Products Moderation ({products.length})
          </h3>

          <div className="divide-y divide-[#E4E7EC]">
            {products.map(p => (
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
                    <p className="text-xs text-[#102A43] font-bold">KSh {p.price.toLocaleString()} · {p.condition}</p>
                    <p className="text-[10px] text-[#667085]">Seller: {p.seller?.name || 'Verified Vendor'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectProduct(p.id)}
                    className="p-1.5 text-xs text-[#667085] hover:text-[#102A43]"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="p-1.5 text-xs text-[#DC2626] hover:text-rose-800"
                    title="Delete product"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS & CONTENT MODERATION */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-[#E4E7EC] p-6 space-y-4">
          <h3 className="text-base font-bold text-[#102A43]">
            Reported Content ({reports.length})
          </h3>

          {reports.length === 0 ? (
            <p className="text-xs text-[#667085] italic py-6 text-center">No reported content to inspect.</p>
          ) : (
            <div className="divide-y divide-[#E4E7EC]">
              {reports.map(rep => (
                <div key={rep.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase bg-rose-100 text-[#DC2626] px-2 py-0.5 rounded">
                        {rep.target_type}: {rep.reason}
                      </span>
                      <span className="text-xs font-bold text-[#102A43]">{rep.target_title || rep.target_id}</span>
                    </div>

                    <p className="text-xs text-[#667085]">
                      Reported by: <strong>{rep.reporter_name}</strong>
                    </p>

                    <p className="text-xs text-[#172B4D] bg-rose-50 p-2 rounded-xl border border-rose-100">
                      "{rep.description}"
                    </p>
                  </div>

                  {rep.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleResolveReport(rep.id, 'dismissed')}
                        className="px-3 py-1.5 bg-[#F1F3F5] hover:bg-[#E4E7EC] text-[#172B4D] rounded-xl text-xs font-semibold"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleResolveReport(rep.id, 'delete_item')}
                        className="px-3 py-1.5 bg-[#DC2626] hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                      >
                        Delete Item & Resolve
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === 'settings' && platformSettings && (
        <div className="bg-white rounded-3xl border border-[#E4E7EC] p-6 max-w-2xl space-y-4">
          <h3 className="text-base font-bold text-[#102A43]">
            Platform Settings & Rules
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-[#172B4D] block mb-1">Residence Name</label>
              <input
                type="text"
                value={platformSettings.residence_name}
                onChange={(e) => setPlatformSettings({ ...platformSettings, residence_name: e.target.value })}
                className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#172B4D] block mb-1">Office Contact Phone</label>
                <input
                  type="text"
                  value={platformSettings.contact_phone}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, contact_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl"
                />
              </div>
              <div>
                <label className="font-semibold text-[#172B4D] block mb-1">Office Email</label>
                <input
                  type="email"
                  value={platformSettings.contact_email}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, contact_email: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#172B4D] block mb-1">Marketplace Guidelines / Policy</label>
              <textarea
                rows={3}
                value={platformSettings.advertisement_guidelines}
                onChange={(e) => setPlatformSettings({ ...platformSettings, advertisement_guidelines: e.target.value })}
                className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl font-bold transition shadow"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}

      {/* Edit Room Modal */}
      {selectedRoomForEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center flex items-center justify-center">
            <div className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-sm" onClick={() => setSelectedRoomForEdit(null)} />
            <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle bg-white shadow-2xl rounded-3xl relative z-10 border border-[#E4E7EC]">
              <button
                onClick={() => setSelectedRoomForEdit(null)}
                className="absolute top-5 right-5 text-[#667085] hover:text-[#172B4D] p-1.5 rounded-xl hover:bg-[#F1F3F5]"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-bold text-[#102A43] mb-1">
                Manage {selectedRoomForEdit.room_number}
              </h3>
              <p className="text-xs text-[#667085] mb-4">{selectedRoomForEdit.room_type}</p>

              <form onSubmit={handleSaveRoom} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-[#172B4D] block mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl bg-white font-bold text-[#172B4D]"
                  >
                    <option value="AVAILABLE">AVAILABLE (🟢 Empty / Ready)</option>
                    <option value="OCCUPIED">OCCUPIED (🔵 Has resident)</option>
                    <option value="MOVING_OUT">MOVING OUT (🟡 Leaving end of sem)</option>
                    <option value="RESERVED">RESERVED (🔴 Approved applicant)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#172B4D] block mb-1">Semester Price (KSh)</label>
                  <input
                    type="number"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl font-bold text-[#102A43]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#172B4D] block mb-1">Current Occupant Name</label>
                  <input
                    type="text"
                    value={editOccupantName}
                    onChange={(e) => setEditOccupantName(e.target.value)}
                    placeholder="Student name (leave empty if available)"
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#172B4D] block mb-1">Expected Move-out Date</label>
                  <input
                    type="date"
                    value={editMoveOutDate}
                    onChange={(e) => setEditMoveOutDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRoomForEdit(null)}
                    className="flex-1 py-2 bg-[#F1F3F5] rounded-xl font-semibold text-[#172B4D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingRoom}
                    className="flex-2 py-2 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl font-bold transition shadow"
                  >
                    {savingRoom ? 'Saving...' : 'Save Room Record'}
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
