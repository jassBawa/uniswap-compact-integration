"use client"
import { Card } from '@/components/ui/card';
import { WalletConnect } from '@/components/WalletConnect';
import { ProtocolTabs } from '@/components/ProtocolTabs';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-[#0f1419] text-foreground">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-2xl">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-foreground">Protocol Demo</h1>
            <ThemeToggle />
          </div>
          <p className="text-sm text-muted-foreground">Sepolia Testnet • Native ETH</p>
        </div>

        <WalletConnect />
        <ProtocolTabs />

        <Card className="mt-6">
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Developer-facing protocol demo. Use at your own risk on testnets.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
