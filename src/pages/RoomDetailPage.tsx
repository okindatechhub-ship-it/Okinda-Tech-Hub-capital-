import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  DoorOpen,
  Calendar,
  CheckCircle2,
  Bookmark,
  Share2,
  MessageSquare,
  ArrowLeft,
  Building2,
  Droplets,
  Zap,
  Wifi,
  X
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { Room } from '../types';

interface RoomDetailPageProps {
  roomId: string;
  onBack: () => void;
  openAuthModal: (mode: 'login' | 'register') => void;
  onOpenChatWithUser?: (userId: string, initialMessage?: string, roomRef?: any) => void;
  setCurrentTab: (tab: string) => void;
}

export const RoomDetailPage: React.FC<RoomDetailPageProps> = ({
  roomId,
  onBack,
  openAuthModal,
  onOpenChatWithUser,
  setCurrentTab,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);

  // Request modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    loadRoomDetails();
    if (user) {
      checkSavedStatus();
    }
  }, [roomId, user]);

  const loadRoomDetails = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Room>(`/rooms/${roomId}`);
      setRoom(data);
      if (data.images && data.images.length > 0) {
        setActiveImage(data.images[0]);
      }
    } catch (err: any) {
      toast.error('Failed to load room details');
    } finally {
      setLoading(false);
    }
  };

  const checkSavedStatus = async () => {
    try {
      const res = await apiRequest('/saved');
      if (res.rooms) {
        setIsSaved(res.rooms.some((r: Room) => r.id === roomId));
      }
    } catch {
      // ignore
    }
  };

  const handleToggleSave = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await apiRequest('/saved/toggle', {
        method: 'POST',
        body: JSON.stringify({ item_type: 'room', item_id: roomId }),
      });
      setIsSaved(res.saved);
      toast.success(res.saved ? 'Room saved to your account!' : 'Room removed from saved');
    } catch (err: any) {
      toast.error('Failed to update saved status');
    }
  };

  const handleShareToCommunity = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!room) return;
    try {
      await apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: `Hey everyone! Check out ${room.room_number} (${room.room_type}) at Capital Home Residence. Price is KSh ${room.price.toLocaleString()} / semester. Status: ${room.status}.`,
          room_id: room.id,
          images: room.images.slice(0, 1),
        }),
      });
      toast.success('Room shared to Community Feed!');
      setCurrentTab('community');
    } catch (err: any) {
      toast.error('Failed to share to community');
    }
  };

  const handleChat = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!room) return;

    const recipientId = room.current_occupant_id || 'user-admin-1';
    const initialText = `Hello! I am inquiring about ${room.room_number} (${room.room_type}) priced at KSh ${room.price.toLocaleString()} / semester. Is it available for inspection?`;

    if (onOpenChatWithUser) {
      onOpenChatWithUser(recipientId, initialText, room);
    }
  };

  const openRequest = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setApplicantName(user.full_name || '');
    setApplicantPhone(user.phone || '');
    setApplicantEmail(user.email || '');
    setPreferredDate(room?.move_out_date || 'Next Semester Start');
    setRequestMessage(`Hello, I would like to reserve ${room?.room_number} for the upcoming semester.`);
    setIsRequestModalOpen(true);
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    try {
      setSubmittingRequest(true);
      await apiRequest(`/rooms/${room.id}/request`, {
        method: 'POST',
        body: JSON.stringify({
          applicant_name: applicantName,
          applicant_phone: applicantPhone,
          applicant_email: applicantEmail,
          preferred_move_in_date: preferredDate,
          message: requestMessage,
        }),
      });
      toast.success(`Request for ${room.room_number} submitted!`);
      setIsRequestModalOpen(false);
      loadRoomDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit room request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded" />
        <div className="h-96 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <h3 className="text-lg font-bold text-[#102A43]">Room not found</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#102A43] text-[#D9A441] rounded-xl text-xs font-bold"
        >
          Back to Residence
        </button>
      </div>
    );
  }

  const isCurrentOccupant = user && (user.resident_room_id === room.id || room.current_occupant_id === user.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top back navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#667085] hover:text-[#172B4D] transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Residence Listing</span>
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="aspect-4/3 rounded-3xl overflow-hidden bg-slate-100 border border-[#E4E7EC] shadow-sm relative">
            <img
              src={activeImage || room.images[0] || '/src/assets/images/room_interior_capital_1790501134217.jpg'}
              alt={room.room_number}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-md ${
                room.status === 'AVAILABLE'
                  ? 'bg-[#16A34A] text-white'
                  : room.status === 'MOVING_OUT'
                  ? 'bg-[#D97706] text-white'
                  : room.status === 'RESERVED'
                  ? 'bg-[#DC2626] text-white'
                  : 'bg-[#102A43] text-white'
              }`}>
                {room.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {room.images && room.images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {room.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                    activeImage === img ? 'border-[#D9A441] scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`thumb-${idx}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-[#E4E7EC] p-6 shadow-xs space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#667085] mb-1">
                <span>Capital Home Residence</span>
                <span className="px-2 py-0.5 rounded bg-[#F1F3F5] text-[#102A43] font-bold">{room.room_type}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43]">
                {room.room_number}
              </h1>

              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#102A43]">
                  KSh {room.price.toLocaleString()}
                </span>
                <span className="text-xs text-[#667085]">/ semester</span>
              </div>
            </div>

            {/* Moving out notice card */}
            {room.status === 'MOVING_OUT' && (
              <div className="p-4 rounded-2xl bg-[#fef8eb] border border-[#D9A441]/40 text-[#102A43] space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#D97706] text-xs">
                  <Calendar className="w-4 h-4 text-[#D97706]" />
                  <span>Upcoming Vacancy Announcement</span>
                </div>
                <p className="text-xs text-[#102A43] leading-relaxed">
                  Expected Available From: <strong>{room.move_out_date || 'End of Semester'}</strong>
                </p>
                {room.move_out_date && (
                  <p className="text-[11px] text-[#667085]">
                    Current resident will vacate at semester end. Submit request to reserve.
                  </p>
                )}
              </div>
            )}

            {/* Resident Prompt to post moving out notice if this is their room */}
            {isCurrentOccupant && room.status === 'OCCUPIED' && (
              <div className="p-4 rounded-2xl bg-[#fef8eb] border border-[#D9A441]/40 text-[#102A43] space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-[#102A43]">
                  <DoorOpen className="w-4 h-4 text-[#D9A441]" />
                  <span>Your Assigned Room</span>
                </div>
                <p className="text-xs text-[#667085]">
                  Planning to leave at the end of semester? Post a moving-out notice to alert incoming students.
                </p>
                <button
                  onClick={() => setCurrentTab('account-residence')}
                  className="w-full py-2 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl text-xs font-bold transition"
                >
                  Manage Move-Out Notice
                </button>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="space-y-2.5 pt-2 border-t border-[#E4E7EC]">
              {(room.status === 'AVAILABLE' || room.status === 'MOVING_OUT') && (
                <button
                  onClick={openRequest}
                  className="w-full py-3.5 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-2xl text-sm font-bold shadow transition flex items-center justify-center gap-2"
                >
                  <DoorOpen className="w-4 h-4 text-[#D9A441]" />
                  <span>Request / Reserve Room</span>
                </button>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleChat}
                  className="flex-1 py-2.5 bg-[#F1F3F5] hover:bg-[#E4E7EC] text-[#172B4D] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4 text-[#102A43]" />
                  <span>Chat Inquiry</span>
                </button>

                <button
                  onClick={handleToggleSave}
                  className="p-2.5 rounded-xl border border-[#E4E7EC] hover:bg-[#F1F3F5] text-[#172B4D] transition"
                  title="Save room"
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'text-[#D9A441] fill-[#D9A441]' : 'text-[#667085]'}`} />
                </button>

                <button
                  onClick={handleShareToCommunity}
                  className="p-2.5 rounded-xl border border-[#E4E7EC] hover:bg-[#F1F3F5] text-[#172B4D] transition"
                  title="Share to community feed"
                >
                  <Share2 className="w-4 h-4 text-[#667085]" />
                </button>
              </div>
            </div>

            {/* Caretaker Desk Note */}
            <div className="p-3 bg-[#F7F8FA] rounded-xl text-[11px] text-[#667085] space-y-1 border border-[#E4E7EC]">
              <p className="font-bold text-[#102A43]">Official Residence Notice:</p>
              <p>Room allocations and reservations are processed by the caretaker office. Direct payment upon room inspection.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Amenities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E4E7EC] p-6 space-y-4">
          <h3 className="text-base font-bold text-[#102A43]">Room Overview</h3>
          <p className="text-xs sm:text-sm text-[#172B4D] leading-relaxed whitespace-pre-line">
            {room.description}
          </p>

          <div className="pt-4 border-t border-[#E4E7EC]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-3">
              Included Amenities & Utilities
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              {(room.amenities || [
                'Study Desk & Chair',
                'Built-in Wardrobe',
                '24/7 Borehole Water',
                'Solar Backup Power',
                'CCTV Security',
                'High-Speed Wi-Fi'
              ]).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-[#172B4D]">
                  <CheckCircle2 className="w-4 h-4 text-[#D9A441] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E4E7EC] p-6 space-y-4">
          <h3 className="text-base font-bold text-[#102A43]">Property Perks</h3>
          <div className="space-y-3 text-xs text-[#667085]">
            <div className="flex items-start gap-2.5">
              <Droplets className="w-4 h-4 text-[#D9A441] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#102A43] block">Clean Running Water 24/7</strong>
                Dedicated borehole and storage tanks ensure steady supply throughout the semester.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-[#D9A441] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#102A43] block">Solar Lighting Backup</strong>
                Automatic corridor and room lighting switchover during power interruptions.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Wifi className="w-4 h-4 text-[#D9A441] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#102A43] block">Fiber Optic Campus Internet</strong>
                High-speed connectivity configured for student research, online classes, and projects.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center flex items-center justify-center">
            <div
              className="fixed inset-0 bg-[#102A43]/60 backdrop-blur-sm"
              onClick={() => setIsRequestModalOpen(false)}
            />
            <div className="inline-block w-full max-w-lg p-6 my-8 text-left align-middle bg-white shadow-2xl rounded-3xl relative z-10 border border-[#E4E7EC]">
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="absolute top-5 right-5 text-[#667085] hover:text-[#172B4D] transition p-1.5 rounded-xl hover:bg-[#F1F3F5]"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-[#102A43] mb-1">
                Request {room.room_number}
              </h3>
              <p className="text-xs text-[#667085] mb-4">
                KSh {room.price.toLocaleString()} / semester · {room.room_type}
              </p>

              <form onSubmit={submitRequest} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-[#172B4D] block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-[#172B4D] block mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#172B4D] block mb-1">Preferred Move-in Date</label>
                    <input
                      type="text"
                      required
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441]"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-[#172B4D] block mb-1">Message</label>
                  <textarea
                    rows={3}
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441]"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="flex-1 py-2 bg-[#F1F3F5] rounded-xl font-semibold text-[#172B4D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="flex-2 py-2 bg-[#102A43] hover:bg-[#1b3d5e] text-[#D9A441] rounded-xl font-bold transition shadow"
                  >
                    {submittingRequest ? 'Submitting...' : 'Submit Request'}
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
