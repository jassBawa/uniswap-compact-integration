import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { isAddress, parseUnits } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
// import { simulateContract } from "@wagmi/core";

import { COMPACT_ABI, ERC20_ABI } from "../lib/abis/protocol";
import { PROTOCOL_ADDRESS } from "../lib/constants";
import { buildLockTag, copyToClipboard, mapContractError } from "../lib/utils";
import { useToast } from "./useToast";
interface UseDepositProps {
  onSuccess?: (lockId: string) => void;
}

export function useDeposit({ onSuccess }: UseDepositProps = {}) {
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

  const [checkingTokenAddress, setCheckingTokenAddress] = useState<
    string | undefined
  >();

  const { data: ethBalance, queryKey: balanceQueryKey } = useBalance({
    address,
  });

  // Read allowance directly using wagmi's useReadContract
  const { data: allowance, isFetching: isCheckingAllowance } = useReadContract({
    address: checkingTokenAddress as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && PROTOCOL_ADDRESS ? [address, PROTOCOL_ADDRESS] : undefined,
    query: {
      enabled:
        !!checkingTokenAddress && !!address && isAddress(checkingTokenAddress),
    },
  });

  // Log allowance changes
  useEffect(() => {
    if (checkingTokenAddress) {
      console.log(
        `[Allowance] Checking allowance for token: ${checkingTokenAddress}`
      );
    }
  }, [checkingTokenAddress]);

  useEffect(() => {
    if (allowance !== undefined && checkingTokenAddress) {
      console.log(
        `[Allowance] Fetched allowance for ${checkingTokenAddress}: ${allowance?.toString()}`
      );
    }
  }, [allowance, checkingTokenAddress]);

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
    if (isSuccess && receipt && hash) {
      dismissAll(); // Clear all loading toasts

      // Invalidate balance queries to refresh UI
      queryClient.invalidateQueries({ queryKey: balanceQueryKey });
      console.log(`[Deposit] Success! Invalidating queries for balance`);

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
      dismissAll(); // Clear all loading toasts
      showToast("error", mapContractError(error));
      toastIdRef.current = null;
    }
  }, [error, dismissAll, showToast]);

  const deposit = useCallback(
    async ({
      type,
      amount,
      tokenAddress,
      resetPeriod,
      scope,
      recipient,
      allocatorId,
      decimals = 18,
    }: {
      type: "native" | "erc20";
      amount: string;
      tokenAddress?: string;
      resetPeriod: number;
      scope: number;
      allocatorId: bigint;
      recipient?: string;
      decimals?: number;
    }) => {
      if (!address || !amount) return;

      const parsedAmount = parseUnits(amount, decimals);
      if (type === "native" && ethBalance && ethBalance.value < parsedAmount) {
        showToast("error", "Insufficient ETH balance");
        return;
      }

      const lockTag = buildLockTag(allocatorId, scope, resetPeriod);
      console.log(`locktag: ${lockTag}`);
      const recipientAddr =
        recipient && isAddress(recipient) ? recipient : address;

      try {
        if (type === "native") {
          mutate({
            address: PROTOCOL_ADDRESS as `0x${string}`,
            abi: COMPACT_ABI,
            functionName: "depositNative",
            args: [lockTag, recipientAddr],
            value: parsedAmount,
          });
        } else {
          if (!tokenAddress || !isAddress(tokenAddress))
            throw new Error("Invalid token address");

          // Wait for allowance check to complete
          if (isCheckingAllowance) {
            console.log(`[Deposit] Waiting for allowance check...`);
            showToast("info", "Checking token allowance...");
            return;
          }

          // Check allowance before depositing
          const allowanceValue = allowance as bigint | undefined;
          console.log(
            `[Deposit] Token: ${tokenAddress}, Allowance: ${
              allowanceValue?.toString() ?? "undefined"
            }, Required: ${parsedAmount.toString()}`
          );

          if (!allowanceValue || allowanceValue < parsedAmount) {
            console.log(
              `[Deposit] Approval needed! Allowance (${
                allowanceValue?.toString() ?? "0"
              }) < Required (${parsedAmount.toString()})`
            );
            showToast("info", "Please approve tokens first");
            return;
          }

          console.log(`[Deposit] Proceeding with depositERC20`);

          // TODO: fix this failing here
        //   try {
        //     await simulateContract(config, {
        //       abi: COMPACT_ABI,
        //       address: PROTOCOL_ADDRESS as `0x${string}`,
        //       functionName: "depositERC20",
        //       args: [
        //         tokenAddress as `0x${string}`,
        //         lockTag,
        //         parsedAmount,
        //         recipientAddr,
        //       ],
        //       account: address as `0x${string}`,
        //     });
        //   } catch (simErr) {
        //     console.error("[Simulation failed]", simErr);
        //     showToast("error", mapContractError(simErr));
        //     return; //  do NOT send tx
        //   }

          mutate({
            address: PROTOCOL_ADDRESS as `0x${string}`,
            abi: COMPACT_ABI,
            functionName: "depositERC20",
            args: [
              tokenAddress as `0x${string}`,
              lockTag,
              parsedAmount,
              recipientAddr,
            ],
          });
        }
      } catch (err) {
        console.error("ERROR: ", err);
        showToast("error", mapContractError(err));
      }
    },
    [address, ethBalance, mutate, showToast, allowance, isCheckingAllowance]
  );

  const approve = useCallback(
    async ({
      tokenAddress,
      amount,
      decimals = 18,
    }: {
      tokenAddress: string;
      amount: string;
      decimals?: number;
    }) => {
      if (!address || !tokenAddress || !amount) return;

      const parsedAmount = parseUnits(amount, decimals);
      console.log(
        `[Approve] Calling approve for ${tokenAddress}, amount: ${parsedAmount.toString()}`
      );

      try {
        mutate({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [PROTOCOL_ADDRESS, parsedAmount],
        });
        console.log(`[Approve] Transaction sent for ${tokenAddress}`);
      } catch (err) {
        console.error("ERROR: ", err);
        showToast("error", mapContractError(err));
      }
    },
    [address, mutate, showToast]
  );

  // Show success toast when approval transaction succeeds
  useEffect(() => {
    if (isSuccess && hash) {
      showToast("success", "Tokens approved successfully!");
    }
  }, [isSuccess, hash, showToast]);

  return {
    deposit,
    approve,
    isPending: isPending || isConfirming,
    hash,
    ethBalance,
    allowance,
    isCheckingAllowance,
    setCheckingTokenAddress,
  };
}
