import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { AnimationProvider } from "@/components/providers/AnimationProvider";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import ConditionalLayout from "@/components/layout/ConditionalLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "vendors.gg - Trusted Gaming Marketplace",
  description: "The most secure and trusted marketplace for gaming items, accounts, and services. Protected by escrow and verified sellers.",
  themeColor: "oklch(0.145 0 0)",
  viewport: {
    width: "device-width",
    initialScale: 1,
    colorScheme: "dark"
  },
  other: {
    "color-scheme": "dark",
    "theme-color": "oklch(0.145 0 0)",
    "msapplication-navbutton-color": "oklch(0.145 0 0)",
    "apple-mobile-web-app-status-bar-style": "black-translucent"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className="bg-background"
      style={{ backgroundColor: 'oklch(0.145 0 0)', colorScheme: 'dark' }}
    >
      <head>
            <style>{`html,body{background:oklch(0.145 0 0)!important;color-scheme:dark!important}`}</style>
            <meta name="theme-color" content="oklch(0.145 0 0)" />
            <meta name="msapplication-navbutton-color" content="oklch(0.145 0 0)" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="color-scheme" content="dark" />
          </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: 'oklch(0.145 0 0)', margin: 0, padding: 0, minHeight: '100vh' }}
      >
        <SessionProvider>
          <AnimationProvider>
            <LayoutWrapper>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </LayoutWrapper>
          </AnimationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
