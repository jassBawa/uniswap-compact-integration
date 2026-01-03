import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { isAddress, parseEther } from "viem";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { COMPACT_ABI } from "../lib/abis/protocol";
import { useToast } from "./useToast";
import { PROTOCOL_ADDRESS } from "../lib/constants";
import { mapContractError } from "../lib/utils";

export function useWithdraw() {
  const { address } = useAccount();
  const { showToast, dismissAll } = useToast();
  const queryClient = useQueryClient();
  const toastIdRef = useRef<number | string | null>(null);

  const {
    data: hash,
    writeContract,
    isPending,
    error,
    reset,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isPending) {
      dismissAll(); // Clear any existing toasts
      const id = showToast("loading", "Confirm transaction in wallet...");
      toastIdRef.current = id;
    }
  }, [isPending, showToast, dismissAll]);

  useEffect(() => {
    if (isConfirming && hash) {
      dismissAll(); // Clear previous toasts
      const id = showToast("loading", "Transaction pending...", hash);
      toastIdRef.current = id;
    }
  }, [isConfirming, hash, showToast, dismissAll]);

  useEffect(() => {
    if (isSuccess && hash) {
      dismissAll(); // Clear all loading toasts

      // Invalidate all related contract reads to refresh UI
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.some(
            (key) =>
              typeof key === "object" &&
              key !== null &&
              "address" in key &&
              key.address === PROTOCOL_ADDRESS
          ),
      });

      showToast("success", "Transaction successful!", hash);
      toastIdRef.current = null;
      reset();
    }
  }, [isSuccess, hash, queryClient, dismissAll, showToast, reset]);

  useEffect(() => {
    if (error) {
      dismissAll(); // Clear all loading toasts
      showToast("error", mapContractError(error));
      toastIdRef.current = null;
    }
  }, [error, dismissAll, showToast]);

  const enableForcedWithdrawal = useCallback(
    (lockId: string) => {
      if (!lockId) return;
      try {
        writeContract({
          address: PROTOCOL_ADDRESS as `0x${string}`,
          abi: COMPACT_ABI,
          functionName: "enableForcedWithdrawal",
          args: [BigInt(lockId)],
        });
      } catch (err) {
        showToast("error", mapContractError(err));
      }
    },
    [writeContract, showToast]
  );

  const disableForcedWithdrawal = useCallback(
    (lockId: string) => {
      if (!lockId) return;
      try {
        writeContract({
          address: PROTOCOL_ADDRESS as `0x${string}`,
          abi: COMPACT_ABI,
          functionName: "disableForcedWithdrawal",
          args: [BigInt(lockId)],
        });
      } catch (err) {
        showToast("error", mapContractError(err));
      }
    },
    [writeContract, showToast]
  );

  const forcedWithdrawal = useCallback(
    (lockId: string, recipient: string, amount: string) => {
      if (!lockId || !amount || !address) return;
      const recipientAddr =
        recipient && isAddress(recipient) ? recipient : address;

      try {
        writeContract({
          address: PROTOCOL_ADDRESS as `0x${string}`,
          abi: COMPACT_ABI,
          functionName: "forcedWithdrawal",
          args: [
            BigInt(lockId),
            recipientAddr as `0x${string}`,
            parseEther(amount),
          ],
        });
      } catch (err) {
        showToast("error", mapContractError(err));
      }
    },
    [address, writeContract, showToast]
  );

  return {
    enableForcedWithdrawal,
    disableForcedWithdrawal,
    forcedWithdrawal,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
  };
}
