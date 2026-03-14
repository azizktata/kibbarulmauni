"use client";

import { signIn } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState, type ReactNode } from "react";

interface Props {
  trigger: ReactNode;
}

export function SignInDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Custom trigger wrapper */}
      <span onClick={() => setOpen(true)} className="contents">
        {trigger}
      </span>

      <DialogContent className="sm:max-w-sm text-center font-cairo" dir="rtl">
        <DialogHeader className="items-center">
          {/* Decorative icon */}
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-2 mx-auto">
            <svg className="w-7 h-7 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <DialogTitle className="text-base font-bold text-stone-800">
            سجّل دخولك لتتبع تقدمك
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 leading-relaxed">
            احفظ الدروس التي شاهدتها وتابع تقدمك في كل مقرر ومادة
          </DialogDescription>
        </DialogHeader>

        <button
          onClick={() =>
            signIn("google", { callbackUrl: window.location.href })
          }
          className="mt-2 w-full flex items-center justify-center gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-colors shadow-sm"
        >
          {/* Google G logo */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          تسجيل الدخول عبر Google
        </button>
      </DialogContent>
    </Dialog>
  );
}
