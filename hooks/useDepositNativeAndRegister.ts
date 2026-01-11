import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { hashStruct, keccak256, parseUnits, toBytes } from "viem";
import {
  useBalance,
  useConnection,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { COMPACT_ABI } from "@/lib/abis/protocol";
import { PROTOCOL_ADDRESS } from "@/lib/constants";
import { copyToClipboard, mapContractError } from "@/lib/utils";
import { useToast } from "./useToast";

const DEPOSIT_EVENT_TOPIC = "0x1b3d7edb2e9c0b0e7c525b20aaaef0f5940d2ed71663c7d39266ecafac728859";

// EIP-712 types for Compact
const COMPACT_TYPES = {
  Compact: [
    { name: "arbiter", type: "address" },
    { name: "sponsor", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "expires", type: "uint256" },
    { name: "lockTag", type: "bytes12" },
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
  ],
} as const;

// Typehash constant for Compact type
export const COMPACT_TYPEHASH = keccak256(
  toBytes(
    "Compact(address arbiter,address sponsor,uint256 nonce,uint256 expires,bytes12 lockTag,address token,uint256 amount)"
  )
);

export interface CompactData {
  arbiter: `0x${string}`;
  sponsor: `0x${string}`;
  nonce: bigint;
  expires: bigint;
  lockTag: bigint;
  token: bigint;
  amount: bigint;
  mandate?: {
    witnessArgument: bigint;
  };
}

interface DepositParams {
  amount: string;
  resetPeriod: bigint;
  scope: bigint;
  allocatorId: bigint;
  recipient?: string;
  claimHash: string;
  typehash: string;
}

interface UseDepositNativeAndRegisterProps {
  onSuccess?: (lockId: string) => void;
}

// Compute lockTag as bigint
export function computeLockTag(allocatorId: bigint, scope: bigint, resetPeriod: bigint): bigint {
  return (scope << 95n) | (resetPeriod << 92n) | allocatorId;
}

// Convert lockTag bigint to bytes12 hex string
export function lockTagToHex(lockTag: bigint): `0x${string}` {
  return `0x${lockTag.toString(16).padStart(24, '0')}`;
}

// Get EIP-712 types for Compact data
function getCompactTypes(message?: CompactData) {
  return {
    Compact: [
      { name: "arbiter", type: "address" },
      { name: "sponsor", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "expires", type: "uint256" },
      { name: "lockTag", type: "bytes12" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      ...(message?.mandate ? [{ name: "mandate", type: "Mandate" }] : []),
    ],
    ...(message?.mandate
      ? { Mandate: [{ name: "witnessArgument", type: "uint256" }] }
      : {}),
  };
}

// Compute claim hash from Compact data using EIP-712
export function getClaimHash(message: CompactData): `0x${string}` {
  const lockTagHex = lockTagToHex(message.lockTag);
  const tokenHex = `0x${message.token.toString(16).padStart(40, '0')}` as `0x${string}`;

  const messageWithFormattedData = {
    ...message,
    lockTag: lockTagHex,
    token: tokenHex,
  };

  return hashStruct({
    types: getCompactTypes(message),
    primaryType: "Compact",
    data: messageWithFormattedData,
  });
}

export function useDepositNativeAndRegister({ onSuccess }: UseDepositNativeAndRegisterProps = {}) {
  const { address } = useConnection();
  const { showToast, dismissAll } = useToast();
  const queryClient = useQueryClient();

  const { data: hash, mutate, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });
  const { data: ethBalance, queryKey: balanceQueryKey } = useBalance({ address });

  useEffect(() => {
    if (isPending) {
      dismissAll();
      showToast("loading", "Confirm transaction in wallet...");
    }
  }, [isPending, dismissAll, showToast]);

  useEffect(() => {
    if (isConfirming && hash) {
      dismissAll();
      showToast("loading", "Transaction pending...", hash);
    }
  }, [isConfirming, hash, dismissAll, showToast]);

  useEffect(() => {
    if (error) {
      dismissAll();
      showToast("error", mapContractError(error));
    }
  }, [error, dismissAll, showToast]);

  useEffect(() => {
    if (!isSuccess || !receipt || !hash) return;

    dismissAll();
    queryClient.invalidateQueries({ queryKey: balanceQueryKey });

    const transferLog = receipt.logs.find((log) => log.topics[0] === DEPOSIT_EVENT_TOPIC);
    const lockId = transferLog?.topics[3] || "";

    showToast("success", "Deposit & Register successful!", hash);

    if (lockId) {
      copyToClipboard(lockId);
      onSuccess?.(lockId);
    }

    reset();
  }, [isSuccess, receipt, hash, queryClient, balanceQueryKey, dismissAll, showToast, onSuccess, reset]);

  const deposit = useCallback(
    ({ amount, resetPeriod, scope, allocatorId, recipient, claimHash, typehash }: DepositParams) => {
      if (!address || !amount || !claimHash || !typehash) return;

      const parsedAmount = parseUnits(amount, 18);
      if (ethBalance && ethBalance.value < parsedAmount) {
        showToast("error", "Insufficient ETH balance");
        return;
      }

      // Validate hex format
      if (!claimHash.startsWith("0x") || claimHash.length !== 66) {
        showToast("error", "Invalid claimHash format. Must be 66 character hex string (0x + 64 hex chars)");
        return;
      }
      if (!typehash.startsWith("0x") || typehash.length !== 66) {
        showToast("error", "Invalid typehash format. Must be 66 character hex string (0x + 64 hex chars)");
        return;
      }

      const lockTagHex = lockTagToHex(computeLockTag(allocatorId, scope, resetPeriod));
      const recipientAddr = recipient && recipient.startsWith("0x") ? recipient : address;

      mutate({
        address: PROTOCOL_ADDRESS as `0x${string}`,
        abi: COMPACT_ABI,
        functionName: "depositNativeAndRegister",
        args: [lockTagHex, claimHash as `0x${string}`, typehash as `0x${string}`],
        value: parsedAmount,
      });
    },
    [address, ethBalance, mutate, showToast]
  );

  return {
    deposit,
    isPending: isPending || isConfirming,
    hash,
    ethBalance,
  };
}
