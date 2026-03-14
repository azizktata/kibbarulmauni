import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "جامعة كبار العلماء",
  description: "منهج الدراسة لكلية الشريعة وفق جامعة محمد بن سعود الإسلامية",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="antialiased font-cairo bg-stone-50 text-stone-900">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
