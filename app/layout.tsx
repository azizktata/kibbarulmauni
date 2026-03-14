import type { Metadata } from "next";
import { Cairo, Amiri } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { WatchedProvider } from "@/lib/watchedContext";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cairo",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
});

export const metadata: Metadata = {
  title: "جامعة كبار العلماء",
  description: "منهج الدراسة لكلية الشريعة وفق جامعة محمد بن سعود الإسلامية",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${amiri.variable}`}>
      <body className="antialiased font-cairo bg-stone-50 text-stone-900">
        <SessionProvider session={session}>
          <WatchedProvider isLoggedIn={!!session?.user?.id}>
            <Navbar />
            {children}
          </WatchedProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
