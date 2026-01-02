'use client';

import { AlertTriangle, ExternalLink } from "lucide-react";
import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { parseEther, isAddress } from 'viem';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge, StatusDot } from '@/components/ui/badge';
import { EXPLORER_URL, DEFAULT_LOCK_TAG } from '@/lib/constants';
import { useClaim } from '@/lib/hooks/useCompactProtocol';
import { Button } from '@/components/ui/button';

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
      const effectiveLockTag = isWithdrawMode ? DEFAULT_LOCK_TAG : lockTag;

      await claim({
        id: BigInt(claimId),
        amount: parseEther(amount),
        lockTag: effectiveLockTag as `0x${string}`,
        recipient: finalRecipient as `0x${string}`,
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
    if (address) {
      setRecipient(address);
    }
  }, [address]);

  return (
    <Card className="p-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Claim</h3>
            <p className="text-sm text-muted-foreground mt-1">
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
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${!isWithdrawMode
                ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                : 'bg-secondary text-muted-foreground border border-border hover:bg-muted'
                }`}
            >
              Transfer
            </button>
            <button
              type="button"
              onClick={() => setIsWithdrawMode(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isWithdrawMode
                ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                : 'bg-secondary text-muted-foreground border border-border hover:bg-muted'
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
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-600">Withdraw Mode</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Withdrawing converts ERC-6909 tokens back to underlying tokens (ETH or ERC-20).
              Tokens are sent directly to the recipient address.
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Token ID (ERC-6909)</label>
          <Input
            type="text"
            placeholder="0"
            value={claimId}
            onChange={(e) => setClaimId(e.target.value)}
            disabled={!isConnected || isPending}
            className="font-mono"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            The ERC-6909 token ID you want to claim
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-muted-foreground">Amount</label>
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
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Recipient Address
            {address && !recipient && (
              <button
                type="button"
                onClick={handleFillFromBalance}
                className="ml-2 text-xs text-emerald-600 hover:text-emerald-500 transition-colors"
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
            className={`font-mono ${recipient && !isAddress(recipient) ? 'border-red-500' : ''}`}
          />
          {recipient && !isAddress(recipient) && (
            <p className="mt-1 text-xs text-red-500">Invalid address</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {isWithdrawMode
              ? 'Underlying tokens will be sent to this address'
              : 'ERC-6909 tokens will be transferred to this address'
            }
          </p>
        </div>

        {!isWithdrawMode && (
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Lock Tag (optional)</label>
            <Input
              type="text"
              placeholder="0x..."
              value={lockTag}
              onChange={(e) => setLockTag(e.target.value)}
              disabled={!isConnected || isPending}
              className="font-mono text-xs"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Leave empty to use the same lockTag from the original deposit
            </p>
          </div>
        )}

        <div className="p-3 bg-secondary/50 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-2">
            <span className="font-medium text-amber-600">Demo Mode Notice:</span>
          </p>
          <p className="text-xs text-muted-foreground">
            This is a simplified demo. For real claims, you need:
          </p>
          <ul className="text-xs text-muted-foreground mt-1 ml-4 list-disc">
            <li>Valid sponsor signature (EIP-712)</li>
            <li>Valid allocator authorization</li>
            <li>Valid nonce and expiration</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-3">
        {error && (
          <div className="w-full p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {hash && (
          <div className="w-full p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <StatusDot status={isPending ? 'pending' : txSuccess ? 'online' : 'error'} />
              <span className="text-sm font-medium text-emerald-600">
                {isPending ? 'Transaction Pending' : txSuccess ? 'Transaction Confirmed' : 'Transaction Failed'}
              </span>
            </div>
            <a
              href={`${EXPLORER_URL}/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
            >
              {hash.slice(0, 10)}...{hash.slice(-8)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <Button
          onClick={handleClaim}
          disabled={!isConnected || isPending || !claimId || !amount}
          loading={isPending}
          className=""
          variant={isWithdrawMode ? 'default' : 'default'}
        >
          {isPending
            ? 'Processing...'
            : isWithdrawMode
              ? 'Withdraw Tokens'
              : 'Submit Claim'
          }
        </Button>
      </CardFooter>
    </Card>
  );
}
