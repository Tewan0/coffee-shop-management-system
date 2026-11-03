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
          if (err instanceof ApiError && err.status === 403) {
            setError(
              "บัญชีนี้ไม่ได้รับอนุญาตให้เข้าใช้งานระบบ (เฉพาะเจ้าของร้านที่กำหนดใน OWNER_EMAIL เท่านั้น)"
            );
          } else {
            setError(
              err.message || "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์กับเซิร์ฟเวอร์ Go"
            );
          }
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
      if (err instanceof ApiError && err.status === 403) {
        setError(
          "บัญชีนี้ไม่ได้รับอนุญาตให้เข้าใช้งานระบบ (เฉพาะเจ้าของร้านที่กำหนดใน OWNER_EMAIL เท่านั้น)"
        );
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("การเข้าสู่ระบบถูกยกเลิก");
      } else {
        setError(
          err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ Firebase / Go Backend"
        );
      }
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
