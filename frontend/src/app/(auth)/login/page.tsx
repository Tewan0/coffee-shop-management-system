"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, ShieldCheck, AlertCircle, ArrowRight, Store } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, error, loginWithGoogle, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    clearError();
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      router.push("/");
    } catch (err) {
      // Handled in AuthProvider
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-cream-100 via-stone-50 to-amber-50/40 p-4 relative overflow-hidden">
      {/* Decorative background coffee accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-200/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-coffee-300/15 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-coffee-100/80 relative z-10 transition-all">
        {/* Brand Logo & Name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-coffee-800 to-amber-700 text-cream-50 shadow-lg shadow-coffee-900/10 mb-4 ring-4 ring-coffee-100">
            <Coffee className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-coffee-950 font-prompt tracking-tight">
            BrewCraft Coffee
          </h1>
          <p className="mt-2 text-sm text-coffee-600 font-prompt">
            ระบบจัดการร้านกาแฟ & แคชเชียร์หน้าร้าน (Owner Portal)
          </p>
        </div>

        {/* Security / Notice Card */}
        <div className="mb-6 rounded-2xl bg-cream-50 border border-coffee-200/60 p-4 text-xs text-coffee-700 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed">
            ระบบนี้จำกัดสิทธิ์เฉพาะบัญชีเจ้าของร้าน (Owner) ที่ลงทะเบียนไว้เท่านั้น
            โปรดเข้าสู่ระบบด้วยบัญชี Google ที่ได้รับอนุญาต
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-rose-900 mb-0.5">การเข้าสู่ระบบล้มเหลว</p>
              <p className="leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Google Sign-In Button */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={loading || isSubmitting}
          isLoading={isSubmitting || (loading && !user)}
          size="lg"
          className="w-full h-13 bg-white hover:bg-stone-50 text-coffee-900 border-2 border-coffee-200 hover:border-coffee-300 font-semibold shadow-sm hover:shadow transition-all group"
        >
          {/* Official Google 'G' icon */}
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span className="font-prompt text-sm sm:text-base">
            เข้าสู่ระบบด้วย Google
          </span>
        </Button>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-coffee-100 text-center">
          <p className="text-xs text-coffee-400">
            Next.js App Router / Go Gin Backend / Cloud Firestore
          </p>
        </div>
      </div>
    </div>
  );
}

