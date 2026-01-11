'use client';

import { useCompactClaim } from "@/hooks/useCompactClaim";
import { EXPLORER_URL } from "@/lib/constants";
import { AlertTriangle, ExternalLink, User } from "lucide-react";
import { useCallback, useEffect, useState } from 'react';
import { isAddress, parseEther } from 'viem';
import { useConnection, useWaitForTransactionReceipt } from 'wagmi';
import { Button, Card, CardContent, CardFooter, CardHeader, Input, StatusDot } from "@/components/ui";

interface ClaimFormData {
  id: string;
  amount: string;
  recipient: string;
  sponsor: string;
  nonce: string;
  expires: string;
}

export function ClaimTab() {
  const { address, isConnected } = useConnection();
  const { handleClaim, hash: hookHash, writeError } = useCompactClaim();
  const [claimMode, setClaimMode] = useState<'transfer' | 'withdraw'>('transfer');
  const [formData, setFormData] = useState<ClaimFormData>({
    id: '',
    amount: '',
    recipient: '',
    sponsor: '',
    nonce: '',
    expires: '',
  });
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use wagmi's built-in transaction receipt tracking
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: hookHash,
  });

  // Auto-fill sponsor from connected wallet
  const handleFillSponsor = useCallback(() => {
    if (address) {
      setFormData(prev => ({ ...prev, sponsor: address }));
    }
  }, [address]);

  // Auto-fill recipient from connected wallet
  const handleFillRecipient = useCallback(() => {
    if (address) {
      setFormData(prev => ({ ...prev, recipient: address }));
    }
  }, [address]);

  // Calculate expires timestamp (default: 1 hour from now)
  const handleSetDefaultExpiry = useCallback(() => {
    const expires = Math.floor(Date.now() / 1000) + 3600;
    setFormData(prev => ({ ...prev, expires: expires.toString() }));
  }, []);

  const handleClaimClick = useCallback(async () => {
    setError(null);
    setIsPending(true);

    if (!address) {
      setError('Wallet not connected');
      setIsPending(false);
      return;
    }

    // Validate required fields
    if (!formData.id || parseFloat(formData.id) < 0) {
      setError('Invalid token ID');
      setIsPending(false);
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Invalid amount');
      setIsPending(false);
      return;
    }

    const finalRecipient = formData.recipient || address;
    if (!isAddress(finalRecipient)) {
      setError('Invalid recipient address');
      setIsPending(false);
      return;
    }

    const sponsor = formData.sponsor || address;
    if (!isAddress(sponsor)) {
      setError('Invalid sponsor address');
      setIsPending(false);
      return;
    }

    try {
      // Determine lockTag based on claim mode
      // Transfer mode: lockTag = 0 (transfer ERC-6909 to recipient)
      // Withdraw mode: lockTag = id (withdraw to underlying tokens)
      const effectiveLockTag = claimMode === 'withdraw' ? formData.id : '0x000000000000000000000000';

      // Signatures are now generated automatically by the hook
      // No need to pass them manually

      await handleClaim({
        lockId: formData.id,
        amount: parseEther(formData.amount),
        sponsorAddr: sponsor as `0x${string}`,
        recipient: finalRecipient as `0x${string}`,
        lockTag: effectiveLockTag as `0x${string}`,
      });

      // isPending will be cleared when the transaction is confirmed
      // Transaction tracking is handled by useWaitForTransactionReceipt
    } catch (err: any) {
      setError(err.message || 'Claim failed. Make sure you have proper signatures.');
      setIsPending(false);
    }
  }, [address, formData, claimMode, handleClaim]);

  // Show write error from the hook
  useEffect(() => {
    if (writeError) {
      setError(writeError.message || 'Transaction failed');
      setIsPending(false);
    }
  }, [writeError]);

  return (
    <Card padding="none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Claim</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {claimMode === 'withdraw'
                ? 'Convert ERC-6909 tokens back to underlying assets'
                : 'Transfer ERC-6909 tokens to another address'
              }
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setClaimMode('transfer')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                claimMode === 'transfer'
                  ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                  : 'bg-secondary text-muted-foreground border border-border hover:bg-muted'
              }`}
            >
              Transfer
            </button>
            <button
              type="button"
              onClick={() => setClaimMode('withdraw')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                claimMode === 'withdraw'
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
        {claimMode === 'withdraw' && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-600 font-medium">Withdraw Mode</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Converting ERC-6909 tokens back to underlying tokens.
              Tokens are sent directly to the recipient address.
            </p>
          </div>
        )}

        {/* Resource Lock ID */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">
            Resource Lock ID
          </label>
          <Input
            type="text"
            placeholder="0"
            value={formData.id}
            onChange={(e: any) => setFormData(prev => ({ ...prev, id: e.target.value }))}
            disabled={!isConnected || isPending}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            The ERC-6909 token ID (e.g., from your deposit)
          </p>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">
            Amount
          </label>
          <Input
            type="text"
            placeholder="0.0000"
            value={formData.amount}
            onChange={(e:any) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            disabled={!isConnected || isPending}
            className="font-mono"
          />
        </div>

        {/* Recipient */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">
            Recipient Address
            {address && !formData.recipient && (
              <button
                type="button"
                onClick={handleFillRecipient}
                className="ml-2 text-xs text-emerald-600 hover:text-emerald-500 transition-colors"
              >
                (use my address)
              </button>
            )}
          </label>
          <Input
            type="text"
            placeholder="0x..."
            value={formData.recipient}
            onChange={(e:any) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
            disabled={!isConnected || isPending}
            className={`font-mono ${formData.recipient && !isAddress(formData.recipient) ? 'border-red-500' : ''}`}
          />
          {formData.recipient && !isAddress(formData.recipient) && (
            <p className="text-xs text-red-500">Invalid address</p>
          )}
          <p className="text-xs text-muted-foreground">
            {claimMode === 'withdraw'
              ? 'Underlying tokens will be sent to this address'
              : 'ERC-6909 tokens will be transferred to this address'
            }
          </p>
        </div>

        {/* Sponsor Section */}
        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm font-medium text-foreground">Sponsor Details</label>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted-foreground">
                Sponsor Address
                {address && !formData.sponsor && (
                  <button
                    type="button"
                    onClick={handleFillSponsor}
                    className="ml-2 text-xs text-emerald-600 hover:text-emerald-500 transition-colors"
                  >
                    (use my address)
                  </button>
                )}
              </label>
              <Input
                type="text"
                placeholder="0x..."
                value={formData.sponsor}
                onChange={(e:any) => setFormData(prev => ({ ...prev, sponsor: e.target.value }))}
                disabled={!isConnected || isPending}
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  Nonce
                </label>
                <Input
                  type="text"
                  placeholder="0"
                  value={formData.nonce}
                  onChange={(e:any) => setFormData(prev => ({ ...prev, nonce: e.target.value }))}
                  disabled={!isConnected || isPending}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  Expires
                  <button
                    type="button"
                    onClick={handleSetDefaultExpiry}
                    className="text-xs text-emerald-600 hover:text-emerald-500 transition-colors"
                    title="Set to 1 hour from now"
                  >
                    (+1hr)
                  </button>
                </label>
                <Input
                  type="text"
                  placeholder="Unix timestamp"
                  value={formData.expires}
                  onChange={(e:any) => setFormData(prev => ({ ...prev, expires: e.target.value }))}
                  disabled={!isConnected || isPending}
                  className="font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Auto-generated signatures notice */}
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <p className="text-sm text-emerald-600 font-medium">Auto-Generated Signatures</p>
          <p className="text-xs text-muted-foreground mt-1">
            Signatures are automatically generated from your wallet (sponsor) and the allocator private key (configured in env).
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-3">
        {error && (
          <div className="w-full p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {hookHash && (
          <div className="w-full p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <StatusDot status={isConfirming ? 'pending' : isConfirmed ? 'online' : 'error'} />
              <span className="text-sm font-medium text-emerald-600">
                {isConfirming ? 'Transaction Pending' : isConfirmed ? 'Transaction Confirmed' : 'Transaction Failed'}
              </span>
            </div>
            <a
              href={`${EXPLORER_URL}/tx/${hookHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
            >
              {hookHash.slice(0, 10)}...{hookHash.slice(-8)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <Button
          onClick={handleClaimClick}
          disabled={!isConnected || isPending || !formData.id || !formData.amount}
          loading={isPending || isConfirming}
          className="w-full"
        >
          {isConfirming
            ? 'Confirming...'
            : isPending
              ? 'Signing...'
              : claimMode === 'withdraw'
                ? 'Withdraw Tokens'
                : 'Submit Claim'
          }
        </Button>
      </CardFooter>
    </Card>
  );
}
