import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Toaster } from "sonner"
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { Providers } from "./providers";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
import i18n from "@/i18n/config";
import { ThemeProvider } from "next-themes";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IPFS-X",
  description: "Decentralized social media platform based on IPFS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {/* Mobile menu */}
            <div className="md:hidden">
              <Navbar />
            </div>
            
            <div className="flex">
              {/* Left sidebar - only visible on tablet and desktop */}
              <div className="hidden md:block w-64 shrink-0">
                <Sidebar />
              </div>
              
              {/* Main content area */}
              <div className="flex-1 min-h-screen pl-8">
                {children}
              </div>
            </div>
            
            {/* Bottom navigation for mobile */}
            <BottomNav />
            
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
