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
import { buildLockTag, copyToClipboard, mapContractError } from "@/lib/utils";
import { useToast } from "./useToast";

const DEPOSIT_EVENT_TOPIC = "0x1b3d7edb2e9c0b0e7c525b20aaaef0f5940d2ed71663c7d39266ecafac728859";

interface DepositParams {
  amount: string;
  resetPeriod: number;
  scope: number;
  allocatorId: bigint;
  recipient?: string;
}

interface UseDepositNativeProps {
  onSuccess?: (lockId: string) => void;
}

export function useDepositNative({ onSuccess }: UseDepositNativeProps = {}) {
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

    showToast("success", "Deposit successful!", hash);

    if (lockId) {
      copyToClipboard(lockId);
      onSuccess?.(lockId);
    }

    reset();
  }, [isSuccess, receipt, hash, queryClient, balanceQueryKey, dismissAll, showToast, onSuccess, reset]);

  const deposit = useCallback(
    ({ amount, resetPeriod, scope, allocatorId, recipient }: DepositParams) => {
      if (!address || !amount) return;

      const parsedAmount = parseUnits(amount, 18);
      if (ethBalance && ethBalance.value < parsedAmount) {
        showToast("error", "Insufficient ETH balance");
        return;
      }

      const lockTag = buildLockTag(allocatorId, scope, resetPeriod);
      const recipientAddr = recipient && recipient.startsWith("0x") ? recipient : address;

      mutate({
        address: PROTOCOL_ADDRESS as `0x${string}`,
        abi: COMPACT_ABI,
        functionName: "depositNative",
        args: [lockTag, recipientAddr as `0x${string}`],
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
