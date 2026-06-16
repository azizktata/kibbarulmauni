import type { Metadata, Viewport } from "next";
import { Cairo, Amiri, Aref_Ruqaa } from "next/font/google";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { WatchedProvider } from "@/lib/watchedContext";
import { NotesProvider } from "@/lib/notesContext";
import { Navbar } from "@/components/Navbar";
import { NotesSidebar } from "@/components/NotesSidebar";
import { NoteEditor } from "@/components/NoteEditor";
import { SITE_URL, SITE_NAME, SITE_NAME_EN, buildKeywords, absoluteUrl } from "@/lib/seo";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-7HD33ZKPMK";

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

const arefRuqaa = Aref_Ruqaa({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-aref-ruqaa",
});

const description =
  "جامعة كبار العلماء — منصة لطلب العلم الشرعي عن بعد، تقدم منهجًا متكاملًا لكلية الشريعة بصوتيات كبار العلماء كالشيخ محمد بن صالح العثيمين والشيخ صالح الفوزان، مخصصة لطالب العلم المبتدئ والمتقدم.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | كلية شريعة عن بعد لطلب العلم الشرعي`,
    template: `%s | ${SITE_NAME}`,
  },
  description,
  keywords: buildKeywords(),
  authors: [{ name: SITE_NAME }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | كلية شريعة عن بعد لطلب العلم الشرعي`,
    description,
    images: [
      {
        url: absoluteUrl("/og-image.png"),
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | كلية شريعة عن بعد لطلب العلم الشرعي`,
    description,
    images: [absoluteUrl("/og-image.png")],
  },
  icons: {
    icon: "/favicon.ico",
  },
  // TODO: once verified in Google Search Console, paste the verification
  // string here, e.g. verification: { google: "abc123..." }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: SITE_NAME,
  alternateName: SITE_NAME_EN,
  url: SITE_URL,
  logo: absoluteUrl("/logo.png"),
  description,
  sameAs: ["https://www.youtube.com/@kibbarulmauni", "https://www.kibbarulmauni.com"],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "ar",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${amiri.variable} ${arefRuqaa.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="antialiased font-cairo bg-stone-50 dark:bg-[#111111] text-stone-900 dark:text-stone-100">
        <Script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
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
