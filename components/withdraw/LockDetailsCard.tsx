"use client";

import { RESET_PERIODS, SCOPES } from "@/lib/constants";
import { formatAddress } from "@/lib/utils";

interface LockDetailsCardProps {
  lockDetails: [string, string, bigint, bigint, string];
  isNative: boolean;
  tokenAddress: string;
  formattedBalance: string;
}

export function LockDetailsCard({ lockDetails, isNative, tokenAddress, formattedBalance }: LockDetailsCardProps) {
  return (
    <div className="mb-6 space-y-3 animate-fade-in">
      <div className="bg-secondary/20 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground">Active Lock Parameters</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Asset</span>
            <p className="text-sm font-mono truncate text-foreground">
              {isNative ? "Native (ETH)" : formatAddress(tokenAddress)}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Network Scope</span>
            <p className="text-sm text-foreground">
              {SCOPES[Number(lockDetails[3]) as keyof typeof SCOPES] || "Unknown"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Reset Delay</span>
            <p className="text-sm text-foreground">
              {RESET_PERIODS[Number(lockDetails[2]) as keyof typeof RESET_PERIODS]?.name || "Unknown"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Current Balance</span>
            <p className="text-sm font-bold text-primary">
              {formattedBalance} {isNative ? "ETH" : "tokens"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
