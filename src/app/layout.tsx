import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MasterDataProvider } from "@/lib/master-data-context";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Production Monitor",
  description: "Monitor and track production efficiency",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <MasterDataProvider>
          <AuthProvider>
            <SidebarProvider>
              <main className="w-full bg-background min-h-screen transition-colors duration-300 ease-in-out">
                <div className="p-4 h-16 flex items-center justify-between border-b border-border bg-white dark:bg-zinc-950 sticky top-0 z-40 shadow-sm relative">
                  <div className="flex items-center gap-3">
                    <img src="/logo.jpg" alt="KCF Logo" className="h-10 w-auto object-contain rounded-sm" />
                    <div className="p-2">
                      <span className="font-bold text-lg tracking-tight text-foreground">KOVAI INVENTORY</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <SidebarTrigger />
                  </div>
                </div>
                <div className="p-4 md:p-6 max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
              <AppSidebar side="right" />
              <Toaster />
            </SidebarProvider>
          </AuthProvider>
        </MasterDataProvider>
      </body>
    </html >
  );
}
