"use client";

import { Input } from "@/components/ui";

interface CompactParametersSectionProps {
  arbiter: string;
  sponsor: string;
  nonce: bigint;
  expires: bigint;
  onArbiterChange: (value: string) => void;
  onSponsorChange: (value: string) => void;
  onNonceChange: (value: bigint) => void;
  onExpiresChange: (value: bigint) => void;
  connectedAddress?: string;
}

export function CompactParametersSection({
  arbiter,
  sponsor,
  nonce,
  expires,
  onArbiterChange,
  onSponsorChange,
  onNonceChange,
  onExpiresChange,
  connectedAddress,
}: CompactParametersSectionProps) {
  return (
    <div className="space-y-4 border-t border-border pt-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        Compact Parameters
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="arbiter"
            className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5"
          >
            Arbiter
            {connectedAddress && (
              <button
                type="button"
                onClick={() => onArbiterChange(connectedAddress)}
                className="text-xs text-emerald-600 hover:text-emerald-500"
              >
                (use my address)
              </button>
            )}
          </label>
          <Input
            id="arbiter"
            type="text"
            value={arbiter}
            onChange={(e) => onArbiterChange(e.target.value)}
            placeholder="0x..."
            className="font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="sponsor"
            className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5"
          >
            Sponsor
            {connectedAddress && (
              <button
                type="button"
                onClick={() => onSponsorChange(connectedAddress)}
                className="text-xs text-emerald-600 hover:text-emerald-500"
              >
                (use my address)
              </button>
            )}
          </label>
          <Input
            id="sponsor"
            type="text"
            value={sponsor}
            onChange={(e) => onSponsorChange(e.target.value)}
            placeholder="0x..."
            className="font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="nonce"
            className="text-xs font-medium text-muted-foreground ml-0.5"
          >
            Nonce
          </label>
          <Input
            id="nonce"
            type="text"
            value={nonce.toString()}
            onChange={(e) => onNonceChange(BigInt(e.target.value))}
            placeholder="0"
            className="font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="expires"
            className="text-xs font-medium text-muted-foreground ml-0.5"
          >
            Expires (timestamp)
          </label>
          <Input
            id="expires"
            type="text"
            value={expires.toString()}
            onChange={(e) => onExpiresChange(BigInt(e.target.value))}
            placeholder="Unix timestamp"
            className="font-mono"
          />
        </div>
      </div>
    </div>
  );
}
