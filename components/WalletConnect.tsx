'use client';

import { useEffect } from 'react';
import { useAccount, useBalance, useDisconnect, useConnect, useConnectors } from 'wagmi';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusDot } from '@/components/ui/Badge';
import { formatAddress, formatBalance } from '@/lib/utils';
import { CHAIN_NAME } from '@/lib/constants';

export function WalletConnect() {
  const { address, isConnected, chainId, isConnecting } = useAccount();
  const { data: balance } = useBalance({ address });
  const { disconnect } = useDisconnect();
  const { connect } = useConnect();
  const connectors = useConnectors();

  const isWrongNetwork = chainId !== 11155111 && chainId !== undefined;

  // Get the first available connector (metaMask, injected, coinbase)
  const availableConnector = connectors[0];

  return (
    <Card className="mb-6">
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                isConnected && !isWrongNetwork
                  ? 'bg-emerald-500/20 border-emerald-500'
                  : 'bg-zinc-800 border-zinc-700'
              }`}>
                <svg className={`w-5 h-5 ${isConnected && !isWrongNetwork ? 'text-emerald-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              {isConnected && !isWrongNetwork && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3">
                  <StatusDot status="online" />
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-zinc-200">Wallet</h3>
                {isConnected && (
                  <Badge variant={isWrongNetwork ? 'error' : 'success'}>
                    {isWrongNetwork ? `Switch to ${CHAIN_NAME}` : 'Connected'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isConnected && address && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <span className="font-mono text-sm text-zinc-300">
                    {formatAddress(address, 6)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(address)}
                    className="h-6 px-2 text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Copy
                  </Button>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <span className="font-mono text-sm text-emerald-400">
                    {balance ? formatBalance(balance.value, 18, 4) : '0.0000'} ETH
                  </span>
                </div>
              </>
            )}

            {isConnected ? (
              <Button variant="secondary" size="sm" onClick={() => disconnect()}>
                Disconnect
              </Button>
            ) : (
              <Button
                onClick={() => availableConnector && connect({ connector: availableConnector })}
                isLoading={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
