"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { fetchCurrentUser, ApiError } from "@/lib/api";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getFriendlyErrorMessage = (err: any): string => {
    if (err instanceof ApiError && err.status === 403) {
      return "บัญชี Google นี้ไม่ได้รับอนุญาตให้เข้าใช้งานระบบ (เฉพาะเจ้าของร้านที่กำหนดใน OWNER_EMAIL เท่านั้น)";
    }
    if (err?.code === "auth/operation-not-allowed") {
      return "ยังไม่ได้เปิดใช้งาน Google Sign-In ใน Firebase Console (ไปที่ Firebase Console -> Authentication -> Sign-in method -> เปิดใช้งาน Google)";
    }
    if (err?.code === "auth/popup-closed-by-user") {
      return "หน้าต่างเข้าสู่ระบบ Google ถูกปิดก่อนทำรายการเสร็จ";
    }
    if (err?.code === "auth/popup-blocked") {
      return "บราวเซอร์บล็อกป๊อปอัป กรุณาอนุญาตป๊อปอัปสำหรับหน้านี้แล้วลองใหม่อีกครั้ง";
    }
    if (err?.code === "auth/unauthorized-domain") {
      return "โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Authentication (ไปที่ Firebase Console -> Authentication -> Settings -> Authorized domains)";
    }
    if (err?.message?.includes("Failed to fetch") || err?.message?.includes("NetworkError")) {
      return "ไม่สามารถเชื่อมต่อกับ Go Backend ได้ (กรุณาตรวจสอบว่ารัน 'go run ./cmd/server/main.go' ที่พอร์ต 8080 อยู่หรือไม่)";
    }
    return err?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
  };

  useEffect(() => {
    // Listen to Firebase client auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          setToken(idToken);
          setFirebaseUser(fbUser);

          // Verify with Go backend and sync profile
          const profile = await fetchCurrentUser(idToken);
          setUser(profile);
          setError(null);
        } catch (err: any) {
          console.error("Auth verification with Go backend failed:", err);
          setError(getFriendlyErrorMessage(err));
          // Reset states upon authorization failure
          await firebaseSignOut(auth).catch(() => {});
          setUser(null);
          setToken(null);
          setFirebaseUser(null);
        }
      } else {
        setUser(null);
        setToken(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      setFirebaseUser(result.user);

      // Verify with Go Backend
      const profile = await fetchCurrentUser(idToken);
      setUser(profile);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(getFriendlyErrorMessage(err));
      await firebaseSignOut(auth).catch(() => {});
      setUser(null);
      setToken(null);
      setFirebaseUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setFirebaseUser(null);
      setToken(null);
      setError(null);
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        token,
        loading,
        error,
        loginWithGoogle,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

