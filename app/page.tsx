'use client';

import { WalletConnect } from '@/components/WalletConnect';
import { ProtocolTabs } from '@/components/ProtocolTabs';
import { Card } from '@/components/ui/Card';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">Protocol Demo</h1>
          <p className="text-sm text-zinc-500">Sepolia Testnet • Native ETH</p>
        </div>

        <WalletConnect />
        <ProtocolTabs />

        <Card className="mt-6">
          <div className="p-4 text-center">
            <p className="text-xs text-zinc-500">Developer-facing protocol demo. Use at your own risk on testnets.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
