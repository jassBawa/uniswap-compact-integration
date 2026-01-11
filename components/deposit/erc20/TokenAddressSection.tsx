"use client";

import { Input } from "@/components/ui";

interface TokenAddressSectionProps {
  tokenAddress: string;
  onTokenAddressChange: (value: string) => void;
}

export function TokenAddressSection({
  tokenAddress,
  onTokenAddressChange,
}: TokenAddressSectionProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor="tokenAddress"
        className="block text-xs font-medium text-muted-foreground ml-0.5"
      >
        Token Address
      </label>
      <Input
        id="tokenAddress"
        value={tokenAddress}
        onChange={(e) => onTokenAddressChange(e.target.value)}
        placeholder="0x..."
        className="font-mono"
      />
    </div>
  );
}
