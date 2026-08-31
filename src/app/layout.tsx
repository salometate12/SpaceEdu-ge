import type { Metadata } from "next";
import {
  DM_Sans,
  JetBrains_Mono,
  Noto_Sans_Georgian,
  Sora,
} from "next/font/google";
import { HeaderByPath } from "@/components/layout/Header";
import { MobileGlassDockByPath } from "@/components/layout/MobileGlassDock";
import { FooterByPath } from "@/components/layout/FooterByPath";
import { SiteShell } from "@/components/layout/SiteShell";
import { SiteThemeAccess } from "@/components/layout/SiteThemeAccess";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AIChatPanelProvider } from "@/contexts/AIChatPanelContext";
import { AIChatSidePanel } from "@/components/AITeacher/AIChatSidePanel";
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

export const metadata: Metadata = {
  title: "SpaceEdu — ერთიანი საგანმანათლებლო პლატფორმა",
  description: ka.metaDescription,
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
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col overflow-x-hidden bg-[var(--bg-primary)] font-sans text-[var(--text-primary)]">
        <ThemeProvider>
          <AIChatPanelProvider>
            <MobileSideMenuProvider>
              <div className="flex min-h-screen flex-col">
                <HeaderByPath />
                <AIChatSidePanel />
                <MobileSideMenuDrawer />
                <SiteShell>{children}</SiteShell>
                <FooterByPath />
                <MobileGlassDockByPath />
              </div>
              <SiteThemeAccess />
            </MobileSideMenuProvider>
          </AIChatPanelProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
