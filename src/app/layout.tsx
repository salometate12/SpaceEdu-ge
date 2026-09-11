import type { Metadata, Viewport } from "next";
import {
  DM_Sans,
  JetBrains_Mono,
  Noto_Sans_Georgian,
  Sora,
} from "next/font/google";
import { HeaderByPath } from "@/components/layout/Header";
import { DocumentGround } from "@/components/layout/DocumentGround";
import { TrialNotice } from "@/components/layout/TrialNotice";
import { MobileGlassDockByPath } from "@/components/layout/MobileGlassDock";
import { FooterByPath } from "@/components/layout/FooterByPath";
import { SiteShell } from "@/components/layout/SiteShell";
import { SiteThemeAccess } from "@/components/layout/SiteThemeAccess";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { AIChatPanelProvider } from "@/contexts/AIChatPanelContext";
import { AIChatSidePanel } from "@/components/AITeacher/AIChatSidePanel";
import { FocusModeProvider } from "@/contexts/FocusModeContext";
import { FocusModeExitPill } from "@/components/layout/FocusModeToggle";
import { MobileSideMenuProvider } from "@/contexts/MobileSideMenuContext";
import { MobileSideMenuDrawer } from "@/components/dashboard/MobileSideMenuDrawer";
import { ka } from "@/lib/i18n";
import "./globals.css";

const notoGeorgian = Noto_Sans_Georgian({
  variable: "--font-noto-georgian",
  subsets: ["georgian", "latin"],
  weight: ["400", "500", "600", "700"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const SITE_URL = "https://www.spaceedu.ge";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SpaceEdu — AI სასწავლო პლატფორმა აბიტურიენტებისთვის და სტუდენტებისთვის",
    template: "%s | SpaceEdu",
  },
  description:
    "SpaceEdu — ქართული AI სასწავლო პლატფორმა: მოემზადე ეროვნული გამოცდებისთვის, ისწავლე უნივერსიტეტში და მიიღე პერსონალური სასწავლო გეგმა, AI მასწავლებელი, ქვიზები და კონსპექტები ერთ სივრცეში.",
  keywords: [
    "SpaceEdu",
    "სასწავლო პლატფორმა",
    "აბიტურიენტი",
    "აბიტურიენტის დამხმარე საიტი",
    "ეროვნული გამოცდები",
    "ეროვნულების მოსამზადებელი",
    "საგამოცდო მასალები",
    "Mock exam საქართველო",
    "უნივერსიტეტის სასწავლო პლატფორმა",
    "AI მასწავლებელი",
    "სასწავლო გეგმა",
    "ონლაინ სწავლება საქართველოში",
  ],
  applicationName: "SpaceEdu",
  authors: [{ name: "SpaceEdu" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SpaceEdu",
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "ka_GE",
    url: SITE_URL,
    siteName: "SpaceEdu",
    title: "SpaceEdu — AI სასწავლო პლატფორმა აბიტურიენტებისთვის და სტუდენტებისთვის",
    description:
      "მოემზადე ეროვნული გამოცდებისთვის და ისწავლე უნივერსიტეტში AI-ით მართული სასწავლო გეგმით, ქვიზებით და AI მასწავლებელთან ერთად.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpaceEdu — AI სასწავლო პლატფორმა",
    description: ka.metaDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192x192.png", sizes: "192x192" }],
    shortcut: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7c3aed" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ka"
      suppressHydrationWarning
      className={`${notoGeorgian.variable} ${sora.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var e=document.documentElement;var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);e.classList.toggle('dark',d);var p=location.pathname;e.dataset.ground=p==='/'?'landing':(p==='/about'||p==='/select-space'||p==='/checkout'||p.indexOf('/checkout/')===0)?'paper':'app';if(p==='/about'){var l=localStorage.getItem('spaceedu-language');if(l==='en'||l==='ka'){e.lang=l;}}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col overflow-x-hidden bg-[var(--bg-primary)] font-sans text-[var(--text-primary)]">
        <ThemeProvider>
          <LanguageProvider>
            <AIChatPanelProvider>
              <MobileSideMenuProvider>
                <FocusModeProvider>
                  <div className="flex min-h-screen flex-col">
                    <DocumentGround />
                    <HeaderByPath />
                    <AIChatSidePanel />
                    <MobileSideMenuDrawer />
                    <TrialNotice />
                    <SiteShell>{children}</SiteShell>
                    <FooterByPath />
                    <MobileGlassDockByPath />
                    <FocusModeExitPill />
                  </div>
                  <SiteThemeAccess />
                </FocusModeProvider>
              </MobileSideMenuProvider>
            </AIChatPanelProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
