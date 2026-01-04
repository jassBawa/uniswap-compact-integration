'use client';

import { createConfig, http, } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { QueryClient } from '@tanstack/react-query';


const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY!;

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(`https://sepolia.infura.io/v3/${INFURA_API_KEY}`),
  },
  connectors: [
    injected({
      shimDisconnect: true, // ✅ important
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
