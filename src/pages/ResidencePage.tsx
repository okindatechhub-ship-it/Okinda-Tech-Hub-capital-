import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  DoorOpen,
  Search,
  Filter,
  Calendar,
  MessageSquare,
  Bookmark,
  Building2,
  Info,
  X,
  Phone,
  UserCheck
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Room } from '../types';

interface ResidencePageProps {
  onSelectRoom: (roomId: string) => void;
  openAuthModal: (mode: 'login' | 'register') => void;
  onOpenChatWithUser?: (userId: string, initialMessage?: string, roomRef?: any) => void;
}

export const ResidencePage: React.FC<ResidencePageProps> = ({
  onSelectRoom,
  openAuthModal,
  onOpenChatWithUser,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Old Room' | 'New Room'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Request Room Modal State
  const [selectedRoomForRequest, setSelectedRoomForRequest] = useState<Room | null>(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Saved items tracking
  const [savedRoomIds, setSavedRoomIds] = useState<string[]>([]);

  useEffect(() => {
    loadRooms();
    if (user) {
      loadSavedRooms();
    }
  }, [categoryFilter, statusFilter, user]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await apiRequest(`/rooms?${params.toString()}`);
      if (res?.rooms) {
        setRooms(res.rooms);
        setStats(res.stats);
      }
    } catch (err: any) {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedRooms = async () => {
    try {
      const res = await apiRequest('/saved');
      if (res?.rooms) {
        setSavedRoomIds(res.rooms.map((r: Room) => r.id));
      }
    } catch {
      // ignore
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRooms();
  };

  const handleToggleSave = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal('login');
      return;
    }

    try {
      const res = await apiRequest('/saved/toggle', {
        method: 'POST',
        body: JSON.stringify({ item_type: 'room', item_id: roomId }),
      });
      if (res.saved) {
        setSavedRoomIds(prev => [...prev, roomId]);
        toast.success('Room saved to your account!');
      } else {
        setSavedRoomIds(prev => prev.filter(id => id !== roomId));
        toast.info('Room removed from saved');
      }
    } catch (err: any) {
      toast.error('Failed to update saved rooms');
    }
  };

  const openRequestModal = (room: Room, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal('login');
      return;
    }
    setSelectedRoomForRequest(room);
    setApplicantName(user.full_name || '');
    setApplicantPhone(user.phone || '');
    setApplicantEmail(user.email || '');
    setPreferredDate(room.availability_date || 'Immediate');
    setRequestMessage('');
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomForRequest) return;

    try {
      setSubmittingRequest(true);
      await apiRequest(`/rooms/${selectedRoomForRequest.id}/request`, {
        method: 'POST',
        body: JSON.stringify({
          preferred_move_in_date: preferredDate,
          message: requestMessage,
          applicant_phone: applicantPhone,
          applicant_email: applicantEmail,
          applicant_name: applicantName
        }),
      });

      toast.success(`Request for ${selectedRoomForRequest.room_number} submitted! Administration has been notified.`);
      setSelectedRoomForRequest(null);
      loadRooms();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit room request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleChatWithOccupant = (room: Room, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (onOpenChatWithUser && room.current_occupant_id) {
      onOpenChatWithUser(
        room.current_occupant_id,
        `Hi! I saw your move-out notice for ${room.room_number}. Is it still on track for ${room.move_out_date || 'the upcoming date'}?`,
        room
      );
    }
  };

  const getStatusBadge = (status: Room['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#16A34A]/15 text-[#16A34A] flex items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
            Available Now
          </span>
        );
      case 'MOVING_OUT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#D97706]/15 text-[#D97706] flex items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            Moving Out Soon
          </span>
        );
      case 'RESERVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#DC2626]/15 text-[#DC2626] flex items-center gap-1.5 shadow-xs">
            Reserved
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F1F3F5] text-[#667085] flex items-center gap-1.5">
            Occupied
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-[#102A43] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b3d5e] border border-[#D9A441]/40 text-[#D9A441] text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Residence Wing Management</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            Capital Home Residence Rooms
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            All 82 property rooms configured in the official residence registry (54 Old Rooms @ KSh 15,000 / semester, 28 New Rooms @ KSh 25,000 / semester). Browse available vacancies, upcoming move-out notices, and reserve your room directly.
          </p>

          {/* Quick Counter Metrics */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3 rounded-2xl bg-[#1b3d5e] border border-white/10">
                <span className="text-[10px] text-slate-300 font-bold uppercase">Total Rooms</span>
                <p className="text-xl font-extrabold text-white mt-0.5 tabular-nums">{stats.total}</p>
                <span className="text-[10px] text-[#D9A441]">54 Old · 28 New</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#1b3d5e] border border-white/10">
                <span className="text-[10px] text-[#16A34A] font-bold uppercase">Available Now</span>
                <p className="text-xl font-extrabold text-[#16A34A] mt-0.5 tabular-nums">{stats.available}</p>
                <span className="text-[10px] text-slate-300">Ready for move-in</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#1b3d5e] border border-white/10">
                <span className="text-[10px] text-[#D97706] font-bold uppercase">Upcoming Vacancies</span>
                <p className="text-xl font-extrabold text-[#D97706] mt-0.5 tabular-nums">{stats.moving_out}</p>
                <span className="text-[10px] text-slate-300">Move-out notice posted</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#1b3d5e] border border-white/10">
                <span className="text-[10px] text-slate-300 font-bold uppercase">Pricing</span>
                <p className="text-xs font-bold text-white mt-1">Old: KSh 15,000</p>
                <p className="text-xs font-bold text-[#D9A441]">New: KSh 25,000</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs: All, Old Rooms (54), New Rooms (28) */}
          <div className="flex flex-wrap p-1 bg-[#F1F3F5] rounded-xl gap-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                categoryFilter === 'all'
                  ? 'bg-white text-[#102A43] shadow-xs'
                  : 'text-[#667085] hover:text-[#172B4D]'
              }`}
            >
              All Rooms ({stats?.total || 82})
            </button>
            <button
              onClick={() => setCategoryFilter('Old Room')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                categoryFilter === 'Old Room'
                  ? 'bg-[#102A43] text-[#D9A441] shadow-xs'
                  : 'text-[#667085] hover:text-[#172B4D]'
              }`}
            >
              Old Rooms (54) · KSh 15,000/sem
            </button>
            <button
              onClick={() => setCategoryFilter('New Room')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                categoryFilter === 'New Room'
                  ? 'bg-[#102A43] text-[#D9A441] shadow-xs'
                  : 'text-[#667085] hover:text-[#172B4D]'
              }`}
            >
              New Rooms (28) · KSh 25,000/sem
            </button>
          </div>

          {/* Search box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:max-w-xs">
            <Search className="w-4 h-4 text-[#667085] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room (e.g. Old Room 18)..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#E4E7EC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441]"
            />
          </form>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E4E7EC]">
          <span className="text-xs font-bold text-[#667085] mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#D9A441]" /> Filter by Status:
          </span>
          {[
            { id: 'all', label: 'All Statuses' },
            { id: 'available', label: '🟢 Available' },
            { id: 'moving_out', label: '🟡 Moving Out' },
            { id: 'reserved', label: '🔴 Reserved' },
            { id: 'occupied', label: '⚪ Occupied' },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                statusFilter === st.id
                  ? 'bg-[#102A43] text-[#D9A441] shadow-xs'
                  : 'bg-[#F1F3F5] hover:bg-[#E4E7EC] text-[#172B4D]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Rooms Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E4E7EC] p-8 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#F1F3F5] text-[#667085] flex items-center justify-center mx-auto">
            <DoorOpen className="w-8 h-8 text-[#102A43]" />
          </div>
          <h3 className="text-base font-bold text-[#102A43]">No rooms match your filter</h3>
          <p className="text-xs text-[#667085] max-w-sm mx-auto">
            Try adjusting your category or status filters to view other rooms in Capital Home Residence.
          </p>
          <button
            onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}
            className="px-4 py-2 bg-[#102A43] text-[#D9A441] rounded-xl text-xs font-bold hover:bg-[#1b3d5e] transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {rooms.map(room => {
            const isSaved = savedRoomIds.includes(room.id);
            const isCanRequest = room.status === 'AVAILABLE' || room.status === 'MOVING_OUT';

            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className="group bg-white rounded-2xl border border-[#E4E7EC] hover:border-[#D9A441]/60 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
              >
                {/* Image */}
                <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                  <img
                    src={room.images[0] || '/src/assets/images/room_interior_capital_1790501134217.jpg'}
                    alt={room.room_number}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Status Indicator */}
                  <div className="absolute top-2.5 left-2.5">
                    {getStatusBadge(room.status)}
                  </div>

                  {/* Save button */}
                  <button
                    onClick={(e) => handleToggleSave(room.id, e)}
                    className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-[#102A43]/70 hover:bg-[#102A43] text-white backdrop-blur-xs transition"
                    title={isSaved ? 'Remove from saved' : 'Save room'}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? 'text-[#D9A441] fill-[#D9A441]' : 'text-white'}`} />
                  </button>

                  {/* Category */}
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-[#102A43]/90 text-white text-[11px] font-bold">
                    {room.room_type}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-base font-extrabold text-[#102A43] group-hover:text-[#D9A441] transition">
                      {room.room_number}
                    </h3>

                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-[#102A43]">
                        KSh {room.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-[#667085]">/ semester</span>
                    </div>

                    {/* Upcoming vacancy move-out banner */}
                    {room.status === 'MOVING_OUT' && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-[#fef8eb] border border-[#D9A441]/40 text-[11px] text-[#102A43] space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[#D97706]">
                          <Calendar className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                          <span>Vacating: {room.move_out_date || 'End of Semester'}</span>
                        </div>
                        {room.occupant_name && (
                          <p className="text-[10px] text-[#667085]">
                            Current resident: {room.occupant_name}
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-[#667085] line-clamp-2 leading-relaxed mt-2">
                      {room.description}
                    </p>

                    {/* Amenities chips */}
                    {room.amenities && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {room.amenities.slice(0, 2).map((a, idx) => (
                          <span key={idx} className="text-[10px] bg-[#F1F3F5] text-[#172B4D] px-2 py-0.5 rounded-md font-medium">
                            {a}
                          </span>
                        ))}
                        {room.amenities.length > 2 && (
                          <span className="text-[10px] bg-[#F1F3F5] text-[#667085] px-1.5 py-0.5 rounded-md font-medium">
                            +{room.amenities.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#E4E7EC] flex items-center gap-2">
                    {isCanRequest ? (
                      <button
                        onClick={(e) => openRequestModal(room, e)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] text-xs font-bold text-center transition shadow-xs"
                      >
                        Request Room
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectRoom(room.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#F1F3F5] hover:bg-[#E4E7EC] text-[#172B4D] text-xs font-semibold text-center transition"
                      >
                        View Details
                      </button>
                    )}

                    {room.status === 'MOVING_OUT' && room.current_occupant_id && (
                      <button
                        onClick={(e) => handleChatWithOccupant(room, e)}
                        className="p-2 rounded-xl bg-[#fef8eb] hover:bg-[#fdeece] text-[#102A43] border border-[#D9A441]/40 transition"
                        title="Chat with current resident"
                      >
                        <MessageSquare className="w-4 h-4 text-[#D9A441]" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Room Request Modal */}
      {selectedRoomForRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center flex items-center justify-center">
            <div
              className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-sm transition-opacity"
              onClick={() => setSelectedRoomForRequest(null)}
            />

            <div className="inline-block w-full max-w-lg p-6 my-8 text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl relative z-10 border border-[#E4E7EC]">
              <button
                onClick={() => setSelectedRoomForRequest(null)}
                className="absolute top-5 right-5 text-[#667085] hover:text-[#172B4D] transition p-1.5 rounded-xl hover:bg-[#F1F3F5]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fef8eb] border border-[#D9A441]/40 text-[#102A43] text-[11px] font-bold uppercase mb-2">
                  <DoorOpen className="w-3.5 h-3.5 text-[#D9A441]" /> Room Reservation Request
                </div>
                <h3 className="text-xl font-extrabold text-[#102A43]">
                  Request {selectedRoomForRequest.room_number}
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  {selectedRoomForRequest.room_type} · KSh {selectedRoomForRequest.price.toLocaleString()} / semester
                </p>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">Applicant Name</label>
                    <input
                      type="text"
                      required
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#172B4D] mb-1">Preferred Move-in Date</label>
                    <input
                      type="text"
                      required
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      placeholder="e.g. 2026-12-05 or Semester Start"
                      className="w-full px-3 py-2 text-xs border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">Optional Message / Note to Caretaker</label>
                  <textarea
                    rows={3}
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="e.g. Course of study, year, special requirements..."
                    className="w-full px-3 py-2 text-xs border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441]"
                  />
                </div>

                <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E4E7EC] text-[11px] text-[#667085] flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#D9A441] shrink-0 mt-0.5" />
                  <p>
                    Upon approval by Capital Home administration, the room status changes to <strong>RESERVED</strong>. Official check-in and payment take place at the caretaker desk.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRoomForRequest(null)}
                    className="flex-1 py-2.5 bg-[#F1F3F5] hover:bg-[#E4E7EC] text-[#172B4D] rounded-xl text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="flex-2 py-2.5 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow"
                  >
                    {submittingRequest ? 'Submitting...' : 'Submit Room Request'}
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
