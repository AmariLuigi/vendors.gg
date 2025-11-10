import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import { AnimationProvider } from "@/components/providers/AnimationProvider";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";

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
  other: {
    "color-scheme": "dark",
    "msapplication-navbutton-color": "oklch(0.145 0 0)",
    "apple-mobile-web-app-status-bar-style": "black-translucent"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "oklch(0.145 0 0)",
  colorScheme: "dark"
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
        <ReactQueryProvider>
          <SessionProvider>
            <CartProvider>
              <AnimationProvider>
                <LayoutWrapper>
                  <ConditionalLayout>
                    {children}
                  </ConditionalLayout>
                </LayoutWrapper>
              </AnimationProvider>
            </CartProvider>
          </SessionProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
