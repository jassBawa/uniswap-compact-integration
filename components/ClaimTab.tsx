'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { parseEther, isAddress } from 'viem';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge, StatusDot } from '@/components/ui/Badge';
import { ExternalLink } from '@/components/ui/Tabs';
import { EXPLORER_URL } from '@/lib/constants';
import { useClaim } from '@/lib/hooks/useCompactProtocol';

const DEFAULT_LOCK_TAG = '0x000000000000000000000000' as const;

export function ClaimTab() {
  const { address, isConnected } = useAccount();
  const { claim, hash, isWriting, isConfirming, isConfirmed, writeError } = useClaim();

  const [claimId, setClaimId] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [lockTag, setLockTag] = useState<string>(DEFAULT_LOCK_TAG);
  const [isWithdrawMode, setIsWithdrawMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPending = isWriting || isConfirming;
  const txSuccess = isConfirmed;

  const handleClaim = useCallback(async () => {
    setError(null);

    if (!address) {
      setError('Wallet not connected');
      return;
    }

    if (!claimId || parseFloat(claimId) < 0) {
      setError('Invalid token ID');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Invalid amount');
      return;
    }

    const finalRecipient = recipient || address;
    if (!isAddress(finalRecipient)) {
      setError('Invalid recipient address');
      return;
    }

    try {
      // For withdraw mode, use bytes12(0) as lockTag
      // For transfer mode, use the provided lockTag
      const effectiveLockTag = isWithdrawMode ? DEFAULT_LOCK_TAG : lockTag;

      await claim({
        id: BigInt(claimId),
        amount: parseEther(amount),
        lockTag: effectiveLockTag as `0x${string}`,
        recipient: finalRecipient as `0x${string}`,
        // Demo mode: signatures will be empty placeholders
        // In production, these would need proper signatures from sponsor and allocator
        allocatorData: undefined,
        sponsorSignature: undefined,
        sponsor: undefined,
        nonce: undefined,
        expires: undefined
      });
    } catch (err: any) {
      setError(err.message || 'Claim failed. Make sure you have proper signatures.');
    }
  }, [address, claimId, amount, recipient, lockTag, isWithdrawMode, claim]);

  const handleFillFromBalance = useCallback(() => {
    // This could be used to pre-fill from a selected balance
    // For now, just set a placeholder
    if (address) {
      setRecipient(address);
    }
  }, [address]);

  const toggleMode = useCallback(() => {
    setIsWithdrawMode(!isWithdrawMode);
    // Set lockTag based on mode
    setLockTag(!isWithdrawMode ? DEFAULT_LOCK_TAG : '0x000000000000000000000001');
  }, [isWithdrawMode]);

  return (
    <div className="space-y-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">Claim</h3>
            <p className="text-sm text-zinc-500 mt-1">
              {isWithdrawMode
                ? 'Withdraw underlying tokens to recipient'
                : 'Claim ERC-6909 tokens or transfer to another address'
              }
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsWithdrawMode(false)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                !isWithdrawMode
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              Transfer
            </button>
            <button
              type="button"
              onClick={() => setIsWithdrawMode(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                isWithdrawMode
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              Withdraw
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isWithdrawMode && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-amber-400">Withdraw Mode</p>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Withdrawing converts ERC-6909 tokens back to underlying tokens (ETH or ERC-20).
              Tokens are sent directly to the recipient address.
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">Token ID (ERC-6909)</label>
          <Input
            type="text"
            placeholder="0"
            value={claimId}
            onChange={(e) => setClaimId(e.target.value)}
            disabled={!isConnected || isPending}
            className="font-mono"
          />
          <p className="mt-1 text-xs text-zinc-500">
            The ERC-6909 token ID you want to claim
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-zinc-400">Amount</label>
          </div>
          <Input
            type="text"
            placeholder="0.0000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!isConnected || isPending}
            className="font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">
            Recipient Address
            {address && !recipient && (
              <button
                type="button"
                onClick={handleFillFromBalance}
                className="ml-2 text-xs text-emerald-400 hover:text-emerald-300"
              >
                (use my address)
              </button>
            )}
          </label>
          <Input
            type="text"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={!isConnected || isPending}
            error={recipient && !isAddress(recipient) ? 'Invalid address' : undefined}
            className="font-mono"
          />
          {isWithdrawMode ? (
            <p className="mt-1 text-xs text-zinc-500">
              Underlying tokens will be sent to this address
            </p>
          ) : (
            <p className="mt-1 text-xs text-zinc-500">
              ERC-6909 tokens will be transferred to this address
            </p>
          )}
        </div>

        {!isWithdrawMode && (
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Lock Tag (optional)</label>
            <Input
              type="text"
              placeholder="0x..."
              value={lockTag}
              onChange={(e) => setLockTag(e.target.value)}
              disabled={!isConnected || isPending}
              className="font-mono text-xs"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Leave empty to use the same lockTag from the original deposit
            </p>
          </div>
        )}

        <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800">
          <p className="text-xs text-zinc-500 mb-2">
            <span className="font-medium text-amber-400">Demo Mode Notice:</span>
          </p>
          <p className="text-xs text-zinc-500">
            This is a simplified demo. For real claims, you need:
          </p>
          <ul className="text-xs text-zinc-500 mt-1 ml-4 list-disc">
            <li>Valid sponsor signature (EIP-712)</li>
            <li>Valid allocator authorization</li>
            <li>Valid nonce and expiration</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-3">
        {error && (
          <div className="w-full p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {hash && (
          <div className="w-full p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <StatusDot status={isPending ? 'pending' : txSuccess ? 'online' : 'error'} />
              <span className="text-sm font-medium text-emerald-400">
                {isPending ? 'Transaction Pending' : txSuccess ? 'Transaction Confirmed' : 'Transaction Failed'}
              </span>
            </div>
            <ExternalLink href={`${EXPLORER_URL}/tx/${hash}`}>
              {hash}
            </ExternalLink>
          </div>
        )}

        <Button
          onClick={handleClaim}
          disabled={!isConnected || isPending || !claimId || !amount}
          isLoading={isPending}
          className="w-full"
          variant={isWithdrawMode ? 'danger' : 'primary'}
        >
          {isPending
            ? 'Processing...'
            : isWithdrawMode
              ? 'Withdraw Tokens'
              : 'Submit Claim'
          }
        </Button>
      </CardFooter>
    </div>
  );
}
