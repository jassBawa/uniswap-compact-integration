"use client";

import { Input } from "@/components/ui";

interface ClaimantSectionProps {
  claimant: string;
  claimantAmount: string;
  onClaimantChange: (value: string) => void;
  onClaimantAmountChange: (value: string) => void;
  connectedAddress?: string;
}

export function ClaimantSection({
  claimant,
  claimantAmount,
  onClaimantChange,
  onClaimantAmountChange,
  connectedAddress,
}: ClaimantSectionProps) {
  return (
    <div className="space-y-4 border-t border-border pt-4">
      <h3 className="text-sm font-medium text-muted-foreground">Claimant</h3>

      <div className="space-y-1.5">
        <label
          htmlFor="claimant"
          className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5"
        >
          Claimant Address
          {connectedAddress && (
            <button
              type="button"
              onClick={() => onClaimantChange(connectedAddress)}
              className="text-xs text-emerald-600 hover:text-emerald-500"
            >
              (use my address)
            </button>
          )}
        </label>
        <Input
          id="claimant"
          type="text"
          value={claimant}
          onChange={(e) => onClaimantChange(e.target.value)}
          placeholder="0x..."
          className="font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="claimantAmount"
          className="text-xs font-medium text-muted-foreground ml-0.5"
        >
          Claimant Amount (ETH)
        </label>
        <Input
          id="claimantAmount"
          type="text"
          value={claimantAmount}
          onChange={(e) => onClaimantAmountChange(e.target.value)}
          placeholder="0.0"
          className="font-mono"
        />
      </div>
    </div>
  );
}
