import { useCallback, useState } from "react";
import { isAddress } from "viem";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useConnection,
} from "wagmi";

import { ERC20_ABI } from "@/lib/abis/protocol";
import { PROTOCOL_ADDRESS } from "@/lib/constants";

interface UseERC20Return {
  name: string | undefined;
  symbol: string | undefined;
  decimals: number | undefined;
  balance: string | undefined;
  allowance: string | undefined;
  rawBalance: bigint | undefined;
  rawAllowance: bigint | undefined;
  isValid: boolean;
  isLoading: boolean;
  approve: () => void;
  isApproving: boolean;
  isApproved: boolean;
}

export function useERC20(tokenAddress?: string): UseERC20Return {
  const { address } = useConnection();
  const [lastApprovedAmount, setLastApprovedAmount] = useState<bigint | null>(null);

  const isValidAddress = tokenAddress ? isAddress(tokenAddress) : false;

  const { data: name } = useReadContract({
    address: isValidAddress ? tokenAddress as `0x${string}` : undefined,
    abi: ERC20_ABI,
    functionName: "name",
    query: { enabled: isValidAddress },
  });

  // Read token symbol
  const { data: symbol } = useReadContract({
    address: isValidAddress ? tokenAddress as `0x${string}` : undefined,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: { enabled: isValidAddress },
  });

  // Read token decimals
  const { data: decimalsData } = useReadContract({
    address: isValidAddress ? tokenAddress as `0x${string}` : undefined,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { enabled: isValidAddress },
  });
  const decimals = decimalsData ? Number(decimalsData) : undefined;

  // Read user balance
  const { data: rawBalance } = useReadContract({
    address: isValidAddress ? tokenAddress as `0x${string}` : undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isValidAddress && !!address },
  });

  // Read allowance for protocol
  const { data: rawAllowance } = useReadContract({
    address: isValidAddress ? tokenAddress as `0x${string}` : undefined,
    abi: ERC20_ABI,
    functionName: "allowance",
    args:
      address && PROTOCOL_ADDRESS ? [address, PROTOCOL_ADDRESS] : undefined,
    query: { enabled: isValidAddress && !!address && !!PROTOCOL_ADDRESS },
  });

  // Format balance
  const balance = useCallback(() => {
    if (rawBalance === undefined || decimals === undefined) return undefined;
    return formatTokenAmount(rawBalance, decimals);
  }, [rawBalance, decimals]);

  // Format allowance
  const allowance = useCallback(() => {
    if (rawAllowance === undefined || decimals === undefined) return undefined;
    return formatTokenAmount(rawAllowance, decimals);
  }, [rawAllowance, decimals]);

  // Write contract for approve
  const { data: hash, mutate: approveMutate, isPending: isApprovingTx } = useWriteContract();

  // Wait for approval transaction
  const { isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Track approved amount
  const isApproved = useCallback((): boolean => {
    return isApprovalConfirmed && lastApprovedAmount !== null;
  }, [isApprovalConfirmed, lastApprovedAmount]);

  const approve = useCallback(() => {
    if (!tokenAddress || !address) {
      console.log(`[useERC20] approve called but missing params: tokenAddress=${tokenAddress}, address=${address}`);
      return;
    }

    // Approve max uint256
    const maxUint256 = 2n ** 256n - 1n;
    setLastApprovedAmount(maxUint256);
    console.log(`[useERC20] Approving ${tokenAddress} for max uint256`);

    approveMutate({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [PROTOCOL_ADDRESS, maxUint256],
    });
  }, [tokenAddress, address, approveMutate]);

  const isLoading = isValidAddress && (
    name === undefined ||
    symbol === undefined ||
    decimals === undefined ||
    rawBalance === undefined
  );

  return {
    name: name as string | undefined,
    symbol: symbol as string | undefined,
    decimals,
    balance: balance(),
    allowance: allowance(),
    rawBalance,
    rawAllowance,
    isValid: isValidAddress,
    isLoading,
    approve,
    isApproving: isApprovingTx,
    isApproved: isApproved(),
  };
}

function formatTokenAmount(amount: bigint, decimals: number): string {
  const normalizedDecimals = Math.min(decimals, 18);
  const divisor = 10n ** BigInt(normalizedDecimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;

  const fractionalString = fractionalPart
    .toString()
    .padStart(normalizedDecimals, "0")
    .slice(0, 6);

  if (fractionalPart === 0n) {
    return wholePart.toString();
  }

  return `${wholePart.toString()}.${fractionalString}`;
}
