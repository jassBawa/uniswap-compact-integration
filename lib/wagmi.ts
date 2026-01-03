'use client';

import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { QueryClient } from '@tanstack/react-query';

// Phantom wallet detection helper
function getPhantomProvider() {
  if (typeof window !== 'undefined') {
    // Phantom Ethereum provider
    return (window as any).phantom?.ethereum ||
           (window as any).ethereum?.isPhantom ? (window as any).ethereum : undefined;
  }
  return undefined;
}

const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY!;

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(`https://sepolia.infura.io/v3/${INFURA_API_KEY}`, {
      timeout: 30000, // 30 second timeout
    }),
  },
  connectors: [
    // Phantom via generic injected (after it's detected)
    injected({
      target() {
        if (typeof window === 'undefined') return undefined;
        const phantom = getPhantomProvider();
        if (phantom) {
          return {
            id: 'phantom',
            name: 'Phantom',
            provider: phantom,
          };
        }
        return undefined;
      },
    }),

  ],
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
