'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { zeroAddress } from 'viem';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatBalance } from '@/lib/utils';
import { SEPOLIA_TOKENS } from '@/lib/abis/protocol';
import { useERC6909Balance, useLockDetails } from '@/lib/hooks/useCompactProtocol';
import { ResetPeriod, Scope } from '@/lib/types/compact';

// Sample token IDs to check based on common configurations
const SAMPLE_TOKEN_IDS = [
  0n,      // Native ETH - 1 day, chain-specific, default allocator
  256n,    // Native ETH - 1 day, multichain
  65792n,  // LINK - 1 day, chain-specific
  66048n,  // LINK - 1 day, multichain
  131328n, // USDC - 1 day, chain-specific
];

interface TokenBalance {
  id: bigint;
  balance: bigint;
  lockDetails?: {
    token: string;
    allocator: string;
    resetPeriod: number;
    scope: number;
    lockTag: string;
  };
}

export function BalancesTab() {
  const { address, isConnected } = useAccount();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch balances using wagmi's useReadContract - batches automatically via TanStack Query
  useEffect(() => {
    if (!address) {
      setLoading(false);
      setBalances([]);
      return;
    }

    setLoading(true);

    // Load saved deposit IDs from localStorage
    const savedIds = loadSavedDepositIds(address);
    const idsToCheck = [...new Set([...SAMPLE_TOKEN_IDS, ...savedIds])];

    // For now, we'll query the sample IDs
    // In production, you'd use an event indexer to get actual IDs
    const results: TokenBalance[] = [];

    // Store IDs that have positive balance for display
    idsToCheck.forEach(id => {
      // We'll use the hooks below for each ID
    });

    setLoading(false);
  }, [address]);

  // Use wagmi's useReadContract for batched queries
  const balanceQueries = SAMPLE_TOKEN_IDS.map((id) =>
    useERC6909Balance(address ? id : undefined)
  );

  // Collect balances with positive amounts
  useEffect(() => {
    if (!address) return;

    const results: TokenBalance[] = [];

    SAMPLE_TOKEN_IDS.forEach((id, index) => {
      const balance = balanceQueries[index].data as bigint | undefined;
      if (balance && balance > 0n) {
        results.push({ id, balance });
      }
    });

    setBalances(results);
    setLoading(false);
  }, [address, balanceQueries]);

  // Get lock details for each balance
  const lockDetailQueries = balances.map((b) =>
    useLockDetails(b.balance > 0n ? b.id : undefined)
  );

  // Merge lock details into balances
  useEffect(() => {
    if (balances.length === 0) return;

    const updated = balances.map((b, index) => {
      const details = lockDetailQueries[index].data as any;
      if (details) {
        // Parse getLockDetails return: (token, allocator, resetPeriod, scope)
        const lockDetails = {
          token: details[0] || zeroAddress,
          allocator: details[1] || zeroAddress,
          resetPeriod: Number(details[2]) || 5,
          scope: Number(details[3]) || 1,
          lockTag: buildLockTag(Number(details[3]), Number(details[2]), details[1])
        };
        return { ...b, lockDetails };
      }
      return b;
    });

    // Only update if details changed
    if (JSON.stringify(updated) !== JSON.stringify(balances)) {
      setBalances(updated);
    }
  }, [balances.length, lockDetailQueries]);

  return (
    <div className="space-y-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">Your Balances</h3>
            <p className="text-sm text-zinc-500 mt-1">ERC-6909 token balances</p>
          </div>
          <Badge variant="info">
            {loading ? 'Loading...' : `${balances.length} Active`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-500">
              Fetching balances...
            </p>
          </div>
        ) : balances.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-sm text-zinc-500">No balances found</p>
            <p className="text-xs text-zinc-600 mt-1">
              Deposit tokens to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {balances.map((item) => (
              <BalanceRow
                key={item.id.toString()}
                tokenId={item.id}
                balance={item.balance}
                lockDetails={item.lockDetails}
                onWithdraw={() => {
                  // Handle withdraw - will be implemented
                  console.log('Withdraw:', item.id);
                }}
              />
            ))}
          </div>
        )}

        {!isConnected && !loading && (
          <div className="mt-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800 text-center">
            <p className="text-sm text-zinc-500">Connect your wallet to view balances</p>
          </div>
        )}
      </CardContent>

      {balances.length > 0 && (
        <CardFooter>
          <div className="w-full p-3 bg-zinc-800/30 rounded-lg border border-zinc-800">
            <p className="text-xs text-zinc-500">
              Tip: Token IDs are derived from: token address + allocator + scope + reset period.
            </p>
          </div>
        </CardFooter>
      )}
    </div>
  );
}

interface BalanceRowProps {
  tokenId: bigint;
  balance: bigint;
  lockDetails?: {
    token: string;
    allocator: string;
    resetPeriod: number;
    scope: number;
    lockTag: string;
  };
  onWithdraw: (id: bigint) => void;
}

function BalanceRow({ tokenId, balance, lockDetails, onWithdraw }: BalanceRowProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Get token info from lock details or guess based on ID
  const getTokenInfo = useCallback(() => {
    if (lockDetails?.token && lockDetails.token !== zeroAddress) {
      const token = SEPOLIA_TOKENS.find(t => t.address.toLowerCase() === lockDetails.token.toLowerCase());
      if (token) {
        return { symbol: token.symbol, decimals: token.decimals, isNative: false };
      }
      return { symbol: 'ERC-20', decimals: 18, isNative: false };
    }
    return { symbol: 'ETH', decimals: 18, isNative: true };
  }, [lockDetails]);

  const tokenInfo = getTokenInfo();
  const formattedBalance = formatBalance(balance, tokenInfo.decimals, 4);

  const getScopeLabel = (scope: number) => {
    return scope === 0 ? 'Multichain' : 'Chain';
  };

  const getResetPeriodLabel = (period: number) => {
    const labels: Record<number, string> = {
      0: '1s',
      1: '15s',
      2: '1m',
      3: '10m',
      4: '1h5m',
      5: '1d',
      6: '7d1h',
      7: '30d'
    };
    return labels[period] || `${period}`;
  };

  return (
    <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            tokenInfo.isNative
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-blue-500/20 text-blue-400'
          }`}>
            <span className="font-mono text-sm font-bold">
              {tokenInfo.symbol.slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-100">
              {formattedBalance} <span className="text-zinc-400">{tokenInfo.symbol}</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="neutral" size="sm">
                #{tokenId.toString()}
              </Badge>
              {lockDetails && (
                <>
                  <Badge variant="neutral" size="sm">
                    {getScopeLabel(lockDetails.scope)}
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    RP: {getResetPeriodLabel(lockDetails.resetPeriod)}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => onWithdraw(tokenId)}>
            Withdraw
          </Button>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {showDetails && lockDetails && (
        <div className="mt-4 pt-4 border-t border-zinc-700 space-y-2">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-zinc-500">Token Address</span>
              <p className="font-mono text-zinc-300 break-all">
                {lockDetails.token === zeroAddress ? 'Native ETH' : lockDetails.token}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Allocator</span>
              <p className="font-mono text-zinc-300 break-all">
                {lockDetails.allocator.slice(0, 6)}...{lockDetails.allocator.slice(-4)}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-zinc-500">Lock Tag</span>
              <p className="font-mono text-zinc-300 break-all text-xs">
                {lockDetails.lockTag}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: Build lockTag from scope, resetPeriod, and allocator
function buildLockTag(scope: number, resetPeriod: number, allocator: string): string {
  const firstByte = ((scope & 0xf) << 4) | (resetPeriod & 0xf);
  const firstByteHex = firstByte.toString(16).padStart(2, "0");
  // Take last 10 bytes (20 hex chars) of allocator for lockTag (bytes12 = 12 bytes total)
  const allocHex = allocator.replace(/^0x/, "").slice(-20).padStart(20, "0");
  return `0x${firstByteHex}${allocHex}`;
}

// LocalStorage helpers for deposit IDs
export function loadSavedDepositIds(address: string): bigint[] {
  try {
    const stored = localStorage.getItem(`depositIds_${address.toLowerCase()}`);
    if (stored) {
      return JSON.parse(stored).map((id: string) => BigInt(id));
    }
  } catch {
    // Ignore localStorage errors
  }
  return [];
}

export function saveDepositId(address: string, lockId: bigint) {
  try {
    const existing = loadSavedDepositIds(address);
    if (!existing.includes(lockId)) {
      const updated = [...existing, lockId];
      localStorage.setItem(`depositIds_${address.toLowerCase()}`, JSON.stringify(updated.map(id => id.toString())));
    }
  } catch {
    // Ignore localStorage errors
  }
}
