import { useCallback } from "react";
import { formatEther } from "viem";

interface BalanceInfo {
  value: bigint;
  symbol: string;
}

/**
 * Hook for MAX amount button logic
 */
export function useMaxAmount(balance: BalanceInfo | undefined) {
  const handleMax = useCallback(() => {
    if (balance) {
      return formatEther(balance.value);
    }
    return "0";
  }, [balance]);

  const formattedBalance = balance
    ? `${formatEther(balance.value)} ${balance.symbol}`
    : "0.0000";

  return { handleMax, formattedBalance };
}
