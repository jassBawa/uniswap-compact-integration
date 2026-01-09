import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { parseUnits } from "viem";
import {
  useAccount,
  useBalance,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { COMPACT_ABI } from "@/lib/abis/protocol";
import { PROTOCOL_ADDRESS } from "@/lib/constants";
import { buildLockTag, copyToClipboard, mapContractError } from "@/lib/utils";
import { useToast } from "./useToast";

interface UseDepositNativeProps {
  onSuccess?: (lockId: string) => void;
}

export function useDepositNative({ onSuccess }: UseDepositNativeProps = {}) {
  const { address } = useAccount();
  const { showToast, dismissAll } = useToast();
  const queryClient = useQueryClient();
  const toastIdRef = useRef<number | string | null>(null);

  const { data: hash, mutate, isPending, error, reset } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash });

  const { data: ethBalance, queryKey: balanceQueryKey } = useBalance({
    address,
  });

  useEffect(() => {
    if (isPending) {
      dismissAll();
      const id = showToast("loading", "Confirm transaction in wallet...");
      toastIdRef.current = id;
    }
  }, [isPending, showToast, dismissAll]);

  useEffect(() => {
    if (isConfirming && hash) {
      dismissAll();
      const id = showToast("loading", "Transaction pending...", hash);
      toastIdRef.current = id;
    }
  }, [isConfirming, hash, showToast, dismissAll]);

  useEffect(() => {
    if (isSuccess && receipt && hash) {
      dismissAll();

      queryClient.invalidateQueries({ queryKey: balanceQueryKey });

      const transferLog = receipt.logs.find(
        (log) =>
          log.topics[0] ===
          "0x1b3d7edb2e9c0b0e7c525b20aaaef0f5940d2ed71663c7d39266ecafac728859"
      );

      const lockId = transferLog?.topics[3] || "";

      showToast("success", "Deposit successful!", hash);

      if (lockId) {
        copyToClipboard(lockId);
        onSuccess?.(lockId);
      }

      toastIdRef.current = null;
      reset();
    }
  }, [
    isSuccess,
    receipt,
    hash,
    queryClient,
    balanceQueryKey,
    dismissAll,
    showToast,
    onSuccess,
    reset,
  ]);

  useEffect(() => {
    if (error) {
      dismissAll();
      showToast("error", mapContractError(error));
      toastIdRef.current = null;
    }
  }, [error, dismissAll, showToast]);

  const deposit = useCallback(
    async ({
      amount,
      resetPeriod,
      scope,
      allocatorId,
      recipient,
    }: {
      amount: string;
      resetPeriod: number;
      scope: number;
      allocatorId: bigint;
      recipient?: string;
    }) => {
      if (!address || !amount) return;

      const parsedAmount = parseUnits(amount, 18);
      if (ethBalance && ethBalance.value < parsedAmount) {
        showToast("error", "Insufficient ETH balance");
        return;
      }

      const lockTag = buildLockTag(allocatorId, scope, resetPeriod);
      const recipientAddr = recipient && recipient.startsWith("0x") ? recipient : address;

      try {
        mutate({
          address: PROTOCOL_ADDRESS as `0x${string}`,
          abi: COMPACT_ABI,
          functionName: "depositNative",
          args: [lockTag, recipientAddr as `0x${string}`],
          value: parsedAmount,
        });
      } catch (err) {
        console.error("ERROR: ", err);
        showToast("error", mapContractError(err));
      }
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
