import type { Metadata } from "next";
import { Cairo, Amiri } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { WatchedProvider } from "@/lib/watchedContext";
import { NotesProvider } from "@/lib/notesContext";
import { Navbar } from "@/components/Navbar";
import { NotesSidebar } from "@/components/NotesSidebar";
import { NoteEditor } from "@/components/NoteEditor";
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
      <body className="antialiased font-cairo bg-stone-50 dark:bg-[#111111] text-stone-900 dark:text-stone-100">
        <SessionProvider session={session}>
          <NotesProvider isLoggedIn={!!session?.user?.id}>
            <WatchedProvider isLoggedIn={!!session?.user?.id}>
              <Navbar />
              <NotesSidebar />
              <NoteEditor />
              {children}
            </WatchedProvider>
          </NotesProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
