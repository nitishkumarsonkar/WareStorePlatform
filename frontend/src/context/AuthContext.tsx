'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithOtp: (identifier: string, otp: string, type: 'phone' | 'email', role: UserRole) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchPersona: (role: UserRole, phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const userData = await api.getMe();
      setUser({
        id: userData.id,
        role: userData.role,
        phoneNumber: userData.phoneNumber,
        phoneVerified: userData.phoneVerified,
        email: userData.email,
        emailVerified: userData.emailVerified,
        status: userData.status,
        profile: userData.profile,
        profileId: userData.profile?.id,
        profileName: userData.role === 'builder'
          ? (userData.profile ? `${userData.profile.firstName} ${userData.profile.lastName}` : null)
          : (userData.profile ? userData.profile.businessName : null),
        kycCompleted: !!userData.profile,
      });
    } catch (err) {
      console.warn('No active session or token expired.');
      api.clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginWithOtp = async (identifier: string, otp: string, type: 'phone' | 'email', role: UserRole) => {
    const res = await api.verifyOtp(identifier, otp, type, role);
    await refreshUser();
    return res;
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  // Helper for quick testing seeded accounts
  const switchPersona = async (role: UserRole, phone: string) => {
    setLoading(true);
    try {
      // Send OTP to get devOtp
      const otpRes = await api.sendOtp(phone, 'phone', role);
      if (otpRes.devOtp) {
        await api.verifyOtp(phone, otpRes.devOtp, 'phone', role);
        await refreshUser();
      }
    } catch (err: any) {
      console.error('Failed to switch persona:', err.message);
      alert('Failed to switch persona: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithOtp, logout, refreshUser, switchPersona }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
