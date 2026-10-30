import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
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
import { AIChatBubble } from "@/components/AITeacher/AIChatBubble";
import { FocusModeProvider } from "@/contexts/FocusModeContext";
import { FocusModeExitPill } from "@/components/layout/FocusModeToggle";
import { MobileSideMenuProvider } from "@/contexts/MobileSideMenuContext";
import { MobileSideMenuDrawer } from "@/components/dashboard/MobileSideMenuDrawer";
import { ka } from "@/lib/i18n";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { UserDataSync } from "@/components/UserDataSync";
import "./globals.css";

// Every font is self-hosted (src/fonts/README.md): Turbopack's
// next/font/google download kept failing the Vercel build.
const notoGeorgian = localFont({
  src: [{ path: "../fonts/noto-sans-georgian/NotoSansGeorgian-Variable.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-noto-georgian",
  display: "swap",
});

const sora = localFont({
  src: [{ path: "../fonts/sora/Sora-Variable.woff2", weight: "500 700", style: "normal" }],
  variable: "--font-sora",
  display: "swap",
});

const dmSans = localFont({
  src: [{ path: "../fonts/dm-sans/DMSans-Variable.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: [
    { path: "../fonts/jetbrains-mono/JetBrainsMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/jetbrains-mono/JetBrainsMono-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/jetbrains-mono/JetBrainsMono-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-jetbrains-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

const SITE_URL = "https://www.spaceedu.ge";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SpaceEdu | AI სასწავლო პლატფორმა აბიტურიენტებისა და სტუდენტებისთვის",
    template: "%s | SpaceEdu",
  },
  description:
    "SpaceEdu ქართული AI სასწავლო პლატფორმაა. მოემზადე ეროვნული გამოცდებისთვის, ისწავლე უნივერსიტეტში და მიიღე სასწავლო გეგმა, AI მასწავლებელი, ქვიზები და კონსპექტები ერთ სივრცეში.",
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
    title: "SpaceEdu | AI სასწავლო პლატფორმა აბიტურიენტებისა და სტუდენტებისთვის",
    description:
      "მოემზადე ეროვნული გამოცდებისთვის და ისწავლე უნივერსიტეტში AI-ით მართული სასწავლო გეგმით, ქვიზებით და AI მასწავლებელთან ერთად.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpaceEdu | AI სასწავლო პლატფორმა",
    description: ka.metaDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  // The books on a white tile, so the tab icon reads on light and dark tab
  // strips alike. `src/app/icon.png`, `apple-icon.png` and `favicon.ico`
  // hold the same artwork, so the file-convention tags Next adds agree
  // with these. The SVG goes last: browsers that take it pick the sharpest.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/spaceedu-mark-tile.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon-32x32.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#d81878" },
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
            __html: `(function(){try{var e=document.documentElement;var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);e.classList.toggle('dark',d);if(localStorage.getItem('spaceedu-animations')==='off'){e.classList.add('no-animations');}var p=location.pathname;e.dataset.ground=(p==='/'||p==='/pricing')?'landing':(p==='/about'||p==='/contact'||p==='/checkout'||p.indexOf('/checkout/')===0)?'paper':'app';if(p==='/about'){var l=localStorage.getItem('spaceedu-language');if(l==='en'||l==='ka'){e.lang=l;}}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col overflow-x-hidden bg-[var(--bg-primary)] font-sans text-[var(--text-primary)]">
        <ThemeProvider>
          <LanguageProvider>
            <AIChatPanelProvider>
              <MobileSideMenuProvider>
                <FocusModeProvider>
                  <div className="flex min-h-dvh flex-col">
                    <DocumentGround />
                    <HeaderByPath />
                    <AIChatSidePanel />
                    <AIChatBubble />
                    <MobileSideMenuDrawer />
                    <TrialNotice />
                    <SiteShell>{children}</SiteShell>
                    <FooterByPath />
                    <MobileGlassDockByPath />
                    <FocusModeExitPill />
                    <PwaRegister />
                    <UserDataSync />
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
