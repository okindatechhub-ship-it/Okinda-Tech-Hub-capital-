import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Room, AdvertiserApplication, PaymentMethod } from '../types';
import { apiRequest } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  residentRoom: Room | null;
  advertiserApplication: AdvertiserApplication | null;
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, phone: string, email: string, password: string, roomNumber: string, profilePhoto?: string) => Promise<void>;
  logout: () => void;
  demoLogin: (role: 'admin' | 'resident' | 'seller' | 'student') => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('chr_token'));
  const [residentRoom, setResidentRoom] = useState<Room | null>(null);
  const [advertiserApplication, setAdvertiserApplication] = useState<AdvertiserApplication | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiRequest<{
        user: User;
        resident_room: Room | null;
        advertiser_application: AdvertiserApplication | null;
        payment_methods: PaymentMethod[];
      }>('/auth/me');

      setUser(data.user);
      setResidentRoom(data.resident_room);
      setAdvertiserApplication(data.advertiser_application);
      setPaymentMethods(data.payment_methods || []);
    } catch (err) {
      console.warn('Authentication token expired or invalid', err);
      localStorage.removeItem('chr_token');
      setToken(null);
      setUser(null);
      setResidentRoom(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [token, fetchProfile]);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('chr_token', res.token);
    setToken(res.token);
    setUser(res.user);
    await fetchProfile();
  };

  const register = async (
    fullName: string,
    phone: string,
    email: string,
    password: string,
    roomNumber: string,
    profilePhoto?: string
  ) => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: fullName,
        phone,
        email,
        password,
        room_number: roomNumber,
        profile_photo: profilePhoto,
      }),
    });
    localStorage.setItem('chr_token', res.token);
    setToken(res.token);
    setUser(res.user);
    await fetchProfile();
  };

  const demoLogin = async (role: 'admin' | 'resident' | 'seller' | 'student') => {
    const res = await apiRequest<{ token: string; user: User }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    localStorage.setItem('chr_token', res.token);
    setToken(res.token);
    setUser(res.user);
    await fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem('chr_token');
    setToken(null);
    setUser(null);
    setResidentRoom(null);
    setAdvertiserApplication(null);
    setPaymentMethods([]);
  };

  const refreshUser = async () => {
    if (token) {
      await fetchProfile();
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    const res = await apiRequest<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setUser(res.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        residentRoom,
        advertiserApplication,
        paymentMethods,
        isLoading,
        login,
        register,
        logout,
        demoLogin,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
