import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/lib/wagmi";
import { WagmiProviderClient } from "@/lib/wagmi-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Protocol Demo",
  description: "Developer-facing protocol demo on Sepolia testnet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <WagmiProviderClient>
            <QueryClientProvider client={queryClient}>
              <Toaster />
              {children}
            </QueryClientProvider>
          </WagmiProviderClient>
        </ThemeProvider>
      </body>
    </html>
  );
}
