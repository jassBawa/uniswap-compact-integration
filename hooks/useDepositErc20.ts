import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { isAddress, parseUnits } from "viem";
import {
  useConnection,
  useBalance,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { COMPACT_ABI, ERC20_ABI } from "@/lib/abis/protocol";
import { PROTOCOL_ADDRESS } from "@/lib/constants";
import { buildLockTag, copyToClipboard, mapContractError } from "@/lib/utils";
import { useToast } from "./useToast";

interface UseDepositErc20Props {
  onSuccess?: (lockId: string) => void;
}

export function useDepositErc20({ onSuccess }: UseDepositErc20Props = {}) {
  const { address } = useConnection();
  const { showToast, dismissAll } = useToast();
  const queryClient = useQueryClient();
  const toastIdRef = useRef<number | string | null>(null);
  const pendingActionRef = useRef<"approve" | "deposit" | null>(null);

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
      const message =
        pendingActionRef.current === "approve"
          ? "Approving tokens..."
          : "Confirm transaction in wallet...";
      const id = showToast("loading", message);
      toastIdRef.current = id;
    }
  }, [isPending, showToast, dismissAll]);

  useEffect(() => {
    if (isConfirming && hash) {
      dismissAll();
      const message =
        pendingActionRef.current === "approve"
          ? "Approve pending..."
          : "Transaction pending...";
      const id = showToast("loading", message, hash);
      toastIdRef.current = id;
    }
  }, [isConfirming, hash, showToast, dismissAll]);

  useEffect(() => {
    if (isSuccess && receipt && hash) {
      dismissAll();

      if (pendingActionRef.current === "deposit") {
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
      } else if (pendingActionRef.current === "approve") {
        queryClient.invalidateQueries();
        showToast("success", "Tokens approved!", hash);
      }

      pendingActionRef.current = null;
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
      pendingActionRef.current = null;
      toastIdRef.current = null;
    }
  }, [error, dismissAll, showToast]);

  const deposit = useCallback(
    async ({
      amount,
      tokenAddress,
      resetPeriod,
      scope,
      allocatorId,
      recipient,
      decimals,
    }: {
      amount: string;
      tokenAddress: string;
      resetPeriod: number;
      scope: number;
      allocatorId: bigint;
      recipient?: string;
      decimals: number;
    }) => {
      if (!address || !amount || !tokenAddress) return;

      if (!isAddress(tokenAddress)) {
        showToast("error", "Invalid token address");
        return;
      }

      const parsedAmount = parseUnits(amount, decimals);
      const lockTag = buildLockTag(allocatorId, scope, resetPeriod);
      const recipientAddr =
        recipient && isAddress(recipient) ? recipient : address;

      try {
        pendingActionRef.current = "deposit";
        mutate({
          address: PROTOCOL_ADDRESS as `0x${string}`,
          abi: COMPACT_ABI,
          functionName: "depositERC20",
          args: [
            tokenAddress as `0x${string}`,
            lockTag,
            parsedAmount,
            recipientAddr as `0x${string}`,
          ],
        });
      } catch (err) {
        console.error("ERROR: ", err);
        showToast("error", mapContractError(err));
      }
    },
    [address, mutate, showToast]
  );

  const approve = useCallback(
    async ({
      tokenAddress,
      amount,
      decimals,
    }: {
      tokenAddress: string;
      amount: string;
      decimals: number;
    }) => {
      if (!address || !tokenAddress || !amount) return;

      const parsedAmount = parseUnits(amount, decimals);

      try {
        pendingActionRef.current = "approve";
        mutate({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [PROTOCOL_ADDRESS, parsedAmount],
        });
      } catch (err) {
        console.error("ERROR: ", err);
        showToast("error", mapContractError(err));
      }
    },
    [address, mutate, showToast]
  );

  return {
    deposit,
    approve,
    isPending: isPending || isConfirming,
    hash,
    ethBalance,
  };
}
