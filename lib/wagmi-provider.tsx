'use client';

import { useState, useEffect, ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { config } from './wagmi';

export function WagmiProviderClient({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return <WagmiProvider config={config}>{children}</WagmiProvider>;
}
