"use client";

import { Input } from "@/components/ui";

interface DepositAmountSectionProps {
  amount: string;
  ethBalance?: {
    decimals: number;
    symbol: string;
    value: bigint;
  };
  onAmountChange: (value: string) => void;
  onMaxClick: () => void;
  formattedBalance: string;
}

export function DepositAmountSection({
  amount,
  ethBalance,
  onAmountChange,
  onMaxClick,
  formattedBalance,
}: DepositAmountSectionProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor="amount"
        className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5"
      >
        Amount
        {ethBalance && (
          <span className="text-muted-foreground font-normal">
            ({formattedBalance} ETH)
          </span>
        )}
      </label>
      <div className="relative">
        <Input
          id="amount"
          type="text"
          value={amount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onAmountChange(e.target.value)
          }
          placeholder="0.0"
          className="pr-14 text-lg font-medium"
        />
        {ethBalance && (
          <button
            type="button"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
            onClick={onMaxClick}
          >
            MAX
          </button>
        )}
      </div>
    </div>
  );
}
