import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  X,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  Building2,
  ArrowRight,
  ShieldCheck,
  DoorOpen,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ALL_ROOM_NUMBERS } from '../constants/rooms';
import { uploadLocalFile } from '../api/upload';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  initialMode?: 'login' | 'register';
  isForcedAuth?: boolean; // When user must sign up/login first before accessing the app
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'register',
  isForcedAuth = false
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoFileName, setPhotoFileName] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { login, register } = useAuth();
  const toast = useToast();

  if (!isOpen) return null;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      setPhotoFileName(file.name);
      const uploadedUrl = await uploadLocalFile(file);
      setProfilePhoto(uploadedUrl);
      toast.success('Profile photo uploaded from device storage!');
    } catch (err: any) {
      toast.error('Failed to read image from device');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFillAdmin = () => {
    setMode('login');
    setEmail('okindatechhub@gmail.com');
    setPassword('Okinda3078');
    toast.info('Admin credentials entered');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email || !password) {
          toast.error('Email and password are required');
          setLoading(false);
          return;
        }
        await login(email, password);
        toast.success('Welcome back to Capital Home Residence!');
      } else {
        // Sign-up validations (all compulsory!)
        if (!fullName.trim()) {
          toast.error('Full Name is compulsory');
          setLoading(false);
          return;
        }
        if (!phone.trim()) {
          toast.error('Phone Number is compulsory');
          setLoading(false);
          return;
        }
        if (!email.trim()) {
          toast.error('Email Address is compulsory');
          setLoading(false);
          return;
        }
        if (!password || password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        if (!roomNumber) {
          toast.error('Room Number selection is compulsory');
          setLoading(false);
          return;
        }
        if (!profilePhoto) {
          toast.error('Profile photo from local storage is compulsory');
          setLoading(false);
          return;
        }

        await register(fullName, phone, email, password, roomNumber, profilePhoto);
        toast.success(`Welcome to Capital Home Residence! Assigned to ${roomNumber}.`);
      }
      if (onClose) onClose();
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 text-center flex items-center justify-center py-6">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-[#102A43]/75 backdrop-blur-sm transition-opacity"
          onClick={() => {
            if (!isForcedAuth && onClose) onClose();
          }}
        />

        <div className="inline-block w-full max-w-md p-6 sm:p-8 my-4 text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl relative z-10 border border-[#E4E7EC]">
          {/* Close button (only when not forced auth) */}
          {!isForcedAuth && onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-[#667085] hover:text-[#172B4D] transition p-1.5 rounded-xl hover:bg-[#F1F3F5]"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#102A43] border border-[#D9A441]/40 text-[#D9A441] flex items-center justify-center mx-auto mb-3 shadow-md">
              <Building2 className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-[#102A43] tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Resident Sign Up'}
            </h3>
            <p className="text-xs text-[#667085] mt-1 font-medium">
              Capital Home Residence — <span className="text-[#D9A441] font-bold">Live. Connect. Buy. Sell.</span>
            </p>
            {isForcedAuth && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef8eb] border border-[#D9A441]/40 text-[#102A43] text-[11px] font-semibold">
                <AlertCircle className="w-3.5 h-3.5 text-[#D9A441] shrink-0" />
                <span>Please sign up or log in once to access the residence app.</span>
              </div>
            )}
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 bg-[#F1F3F5] rounded-2xl mb-5 border border-[#E4E7EC]">
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'register' ? 'bg-[#102A43] text-[#D9A441] shadow-xs' : 'text-[#667085] hover:text-[#102A43]'
              }`}
            >
              Sign Up (New Resident)
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'login' ? 'bg-[#102A43] text-[#D9A441] shadow-xs' : 'text-[#667085] hover:text-[#102A43]'
              }`}
            >
              Sign In (Existing / Admin)
            </button>
          </div>

          {/* Admin Fast Credentials Banner */}
          {mode === 'login' && (
            <div className="mb-5 p-3 rounded-2xl bg-[#fef8eb] border border-[#D9A441]/40 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-[#102A43]">
                  <ShieldCheck className="w-4 h-4 text-[#D9A441]" />
                  <span>Admin Login Available</span>
                </div>
                <p className="text-[11px] text-[#667085] truncate mt-0.5">
                  Email: <strong>okindatechhub@gmail.com</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={handleFillAdmin}
                className="px-3 py-1.5 bg-[#102A43] text-[#D9A441] font-bold text-[11px] rounded-xl hover:bg-[#1b3d5e] transition shrink-0"
              >
                Use Admin
              </button>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                {/* Profile Photo from Local Storage (Compulsory) */}
                <div>
                  <label className="block text-xs font-bold text-[#172B4D] mb-1.5">
                    Profile Photo (From Local Device Storage) *
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-2xl bg-[#F1F3F5] border-2 border-dashed border-[#D9A441]/60 flex items-center justify-center overflow-hidden shrink-0">
                      {profilePhoto ? (
                        <img
                          src={profilePhoto}
                          alt="Profile Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-6 h-6 text-[#667085]" />
                      )}
                      {uploadingPhoto && (
                        <div className="absolute inset-0 bg-[#102A43]/70 flex items-center justify-center text-white text-[9px] font-bold">
                          Uploading...
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 px-3 border border-[#E4E7EC] rounded-xl text-xs font-bold text-[#102A43] bg-[#F7F8FA] hover:bg-[#E4E7EC] flex items-center justify-center gap-1.5 transition"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#D9A441]" />
                        <span>{profilePhoto ? 'Change Image from Storage' : 'Upload Image from Device Storage'}</span>
                      </button>
                      <p className="text-[10px] text-[#667085] mt-1 truncate">
                        {photoFileName ? `Selected: ${photoFileName}` : 'Select a picture from your phone or PC storage (compulsory).'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-[#172B4D] mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-[#667085] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441] focus:outline-none bg-white text-[#172B4D]"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-[#172B4D] mb-1">
                    Phone Number (M-Pesa registered) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#667085] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07XXXXXXXX or +254..."
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441] focus:outline-none bg-white text-[#172B4D]"
                    />
                  </div>
                </div>

                {/* Room Number Dropdown (Compulsory 82 rooms) */}
                <div>
                  <label className="block text-xs font-bold text-[#172B4D] mb-1">
                    Select Your Room Number * (Compulsory)
                  </label>
                  <div className="relative">
                    <DoorOpen className="w-4 h-4 text-[#667085] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      required
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441] focus:outline-none bg-white text-[#172B4D]"
                    >
                      <option value="">-- Choose your assigned room (82 Rooms) --</option>
                      <optgroup label="Classic Wing — 54 Old Rooms (KSh 15,000 / sem)">
                        {ALL_ROOM_NUMBERS.filter(r => r.startsWith('Old')).map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Modern Executive Wing — 28 New Rooms (KSh 25,000 / sem)">
                        {ALL_ROOM_NUMBERS.filter(r => r.startsWith('New')).map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <p className="text-[10px] text-[#667085] mt-1">
                    All residents must link their room number upon account creation.
                  </p>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-[#172B4D] mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#667085] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441] focus:outline-none bg-white text-[#172B4D]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#172B4D] mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#667085] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-[#E4E7EC] rounded-xl focus:ring-2 focus:ring-[#D9A441] focus:outline-none bg-white text-[#172B4D]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || uploadingPhoto}
              className="w-full py-3 bg-[#102A43] hover:bg-[#1b3d5e] disabled:opacity-50 text-[#D9A441] rounded-2xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Please wait...' : mode === 'login' ? 'Sign In to App' : 'Create Resident Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footnote */}
          <div className="mt-5 text-center text-[11px] text-[#667085]">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-bold text-[#102A43] hover:underline"
                >
                  Sign Up with Room Number
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-[#102A43] hover:underline"
                >
                  Sign In instead
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
