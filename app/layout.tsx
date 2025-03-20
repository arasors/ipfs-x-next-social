import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Toaster } from "sonner"
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
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
  description: "IPFS tabanlı merkeziyetsiz sosyal medya platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
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
            {/* Mobil menü */}
            <div className="md:hidden">
              <Navbar />
            </div>
            
            <div className="flex">
              {/* Sol sidebar - sadece tablet ve masaüstünde görünür */}
              <div className="hidden md:block w-64 shrink-0">
                <Sidebar />
              </div>
              
              {/* Ana içerik alanı */}
              <div className="flex-1 min-h-screen pl-8">
                {children}
              </div>
            </div>
            
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
