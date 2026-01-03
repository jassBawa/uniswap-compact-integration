"use client";

import { queryClient } from "@/lib/wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { WagmiProviderClient } from "../lib/wagmi-provider";

export default function Providers({ children }: { children: React.ReactNode }) {

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <WagmiProviderClient>
        <QueryClientProvider client={queryClient}>
          <Toaster />
          {children}
        </QueryClientProvider>
      </WagmiProviderClient>
    </ThemeProvider>
  );
}
