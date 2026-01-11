import { isAddress } from "viem";
import {
  useConnection,
  useReadContract
} from "wagmi";

import { ERC20_ABI } from "@/lib/abis/protocol";
import { PROTOCOL_ADDRESS } from "@/lib/constants";

interface UseERC20Return {
  name: string | undefined;
  symbol: string | undefined;
  decimals: number | undefined;
  rawBalance: bigint | undefined;
  rawAllowance: bigint | undefined;
  isValid: boolean;
  isLoading: boolean;
}

export function useERC20(tokenAddress?: string): UseERC20Return {
  const { address } = useConnection();

  const isValidAddress = tokenAddress ? isAddress(tokenAddress) : false;

  const { data: name } = useReadContract({
    address: isValidAddress ? (tokenAddress as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: "name",
    query: { enabled: isValidAddress },
  });

  // Read token symbol
  const { data: symbol } = useReadContract({
    address: isValidAddress ? (tokenAddress as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: { enabled: isValidAddress },
  });

  // Read token decimals
  const { data: decimalsData } = useReadContract({
    address: isValidAddress ? (tokenAddress as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { enabled: isValidAddress },
  });
  const decimals = decimalsData ? Number(decimalsData) : undefined;

  // Read user balance
  const { data: rawBalance } = useReadContract({
    address: isValidAddress ? (tokenAddress as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isValidAddress && !!address },
  });

  // Read allowance for protocol
  const { data: rawAllowance } = useReadContract({
    address: isValidAddress ? (tokenAddress as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && PROTOCOL_ADDRESS ? [address, PROTOCOL_ADDRESS] : undefined,
    query: { enabled: isValidAddress && !!address && !!PROTOCOL_ADDRESS },
  });

  const isLoading =
    isValidAddress &&
    (name === undefined ||
      symbol === undefined ||
      decimals === undefined ||
      rawBalance === undefined);

  return {
    name: name as string | undefined,
    symbol: symbol as string | undefined,
    decimals,
    rawBalance,
    rawAllowance,
    isValid: isValidAddress,
    isLoading,
  };
}