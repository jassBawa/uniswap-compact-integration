"use client";

import { useState, useCallback, useEffect } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useToast } from "./useToast";
import { useQueryClient } from "@tanstack/react-query";
import { mapContractError } from "@/lib/utils";

interface UseTransactionOptions {
  onSuccess?: (hash: string) => void;
  onError?: (error: string) => void;
}

/**
 * Hook for handling transaction flow
 */
export function useTransaction({ onSuccess, onError }: UseTransactionOptions = {}) {
  const { showToast, updateToast } = useToast();
  const queryClient = useQueryClient();
  const [lastToastId, setLastToastId] = useState<number | null>(null);

  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Show loading toast when transaction is pending
  useEffect(() => {
    if (isPending) {
      const id = showToast("loading", "Confirm transaction in wallet...");
      setLastToastId(id);
    }
  }, [isPending, showToast]);

  // Update toast when transaction is confirming
  useEffect(() => {
    if (isConfirming && hash && lastToastId !== null) {
      updateToast(lastToastId, "loading", "Transaction pending...", hash);
    }
  }, [isConfirming, hash, lastToastId, updateToast]);

  // Handle success
  useEffect(() => {
    if (isSuccess && hash && lastToastId !== null) {
      // Invalidate all queries to refresh UI
      queryClient.invalidateQueries();

      updateToast(lastToastId, "success", "Transaction successful!", hash);
      setLastToastId(null);
      reset();
      onSuccess?.(hash);
    }
  }, [isSuccess, hash, queryClient, updateToast, lastToastId, reset, onSuccess]);

  // Handle error
  useEffect(() => {
    if (error && lastToastId !== null) {
      const errorMessage = mapContractError(error);
      updateToast(lastToastId, "error", errorMessage);
      setLastToastId(null);
      reset();
      onError?.(errorMessage);
    }
  }, [error, lastToastId, updateToast, reset, onError]);

  const execute = useCallback(
    async (options: {
      address: `0x${string}`;
      abi: readonly unknown[];
      functionName: string;
      args?: readonly unknown[];
      value?: bigint | undefined;
    }) => {
      try {
        writeContract(options as Parameters<typeof writeContract>[0]);
      } catch (err) {
        const errorMessage = mapContractError(err);
        showToast("error", errorMessage);
        onError?.(errorMessage);
      }
    },
    [writeContract, showToast, onError]
  );

  return {
    hash,
    isPending: isPending || isConfirming,
    isSuccess,
    execute,
    reset,
  };
}
