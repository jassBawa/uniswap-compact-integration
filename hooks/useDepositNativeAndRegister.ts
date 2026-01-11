import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { parseUnits } from "viem";
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

export function getLockTag(allocatorId: bigint, scope: bigint, resetPeriod: bigint): `0x${string}` {
  const tag = (scope << 95n) | (resetPeriod << 92n) | allocatorId;
  return `0x${tag.toString(16).padStart(24, '0')}`;
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

      const lockTag = getLockTag(allocatorId, scope, resetPeriod);
      const recipientAddr = recipient && recipient.startsWith("0x") ? recipient : address;

      mutate({
        address: PROTOCOL_ADDRESS as `0x${string}`,
        abi: COMPACT_ABI,
        functionName: "depositNativeAndRegister",
        args: [lockTag, claimHash as `0x${string}`, typehash as `0x${string}`],
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
