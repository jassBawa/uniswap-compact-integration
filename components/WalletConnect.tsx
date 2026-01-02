'use client';

import { Copy, CreditCard, LogOut, Wallet } from 'lucide-react';
import { useAccount, useBalance, useDisconnect, useConnect, useConnectors } from 'wagmi';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, StatusDot } from '@/components/ui/badge';
import { formatAddress, formatBalance, copyToClipboard } from '@/lib/utils';
import { CHAIN_NAME } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { useCopy } from '@/hooks/useCopy';

export function WalletConnect() {
  const { address, isConnected, chainId, isConnecting } = useAccount();
  const { data: balance } = useBalance({ address });
  const { disconnect } = useDisconnect();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const [copied, copy] = useCopy();

  const isWrongNetwork = chainId !== 11155111 && chainId !== undefined;
  const availableConnector = connectors[0];

  const handleCopyAddress = async () => {
    if (address) {
      await copy(address);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isConnected && !isWrongNetwork
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-secondary border-border'
                  }`}>
                  <Wallet className={`w-5 h-5 ${isConnected && !isWrongNetwork ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                </div>
                {isConnected && !isWrongNetwork && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3">
                    <StatusDot status="online" />
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">Wallet</h3>
                  {isConnected && (
                    <Badge variant={isWrongNetwork ? 'error' : 'success'}>
                      {isWrongNetwork ? `Switch to ${CHAIN_NAME}` : 'Connected'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Connect/Disconnect Button */}
            {isConnected ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => disconnect()}
                icon={<LogOut className="w-4 h-4" />}
                className="shrink-0"
              >
                <span className="hidden sm:inline">Disconnect</span>
                <span className="sm:hidden">Disc.</span>
              </Button>
            ) : (
              <Button
                onClick={() => availableConnector && connect({ connector: availableConnector })}
                loading={isConnecting}
                icon={<Wallet className="w-4 h-4" />}
                size="sm"
                className="shrink-0"
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            )}
          </div>

          {/* Wallet Info Row */}
          {isConnected && address && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg border border-border">
                <span className="font-mono text-sm text-foreground">
                  {formatAddress(address, 6)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  icon={<Copy className="w-3 h-3" />}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg border border-border">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span className="font-mono text-sm text-emerald-600">
                  {balance ? formatBalance(balance.value, 18, 4) : '0.0000'} ETH
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
