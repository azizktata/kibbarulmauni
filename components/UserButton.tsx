"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { SignInDialog } from "./SignInDialog";
import { ProfileDialog } from "./ProfileDialog";

export function UserButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse shrink-0" />
    );
  }

  if (session?.user) {
    const { name, image } = session.user;
    const initials = (name ?? "؟")[0];

    return (
      <ProfileDialog
        userName={name}
        userImage={image}
        trigger={
          <button
            className="shrink-0 w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/20 hover:ring-white/50 transition-all"
            title="الملف الشخصي"
          >
            {image ? (
              <Image
                src={image}
                alt={name ?? ""}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            )}
          </button>
        }
      />
    );
  }

  return (
    <SignInDialog
      trigger={
        <button className="text-xs text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
          دخول
        </button>
      }
    />
  );
}
