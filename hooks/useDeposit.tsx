"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { isAddress, parseEther } from "viem";
import { useAccount, useBalance, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { useToast } from "./useToast";
import { buildLockTag, DEFAULT_ALLOCATOR_HEX, PROTOCOL_ADDRESS } from "@/lib/constants";
import { COMPACT_ABI } from "@/lib/abis/protocol";
import { mapContractError, copyToClipboard } from "@/lib/utils";

interface UseDepositProps {
    onSuccess?: (lockId: string) => void;
}


export function useDeposit({ onSuccess }: UseDepositProps = {}) {
    const { address } = useAccount();
    const { showToast, dismissAll } = useToast();
    const queryClient = useQueryClient();
    const toastIdRef = useRef<number | string | null>(null);

    const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

    const { data: ethBalance, queryKey: balanceQueryKey } = useBalance({ address });

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

            const transferLog = receipt.logs.find(log =>
                log.topics[0] === "0x1b3d7edb2e9c0b0e7c525b20aaaef0f5940d2ed71663c7d39266ecafac728859"
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
    }, [isSuccess, receipt, hash, queryClient, balanceQueryKey, dismissAll, showToast, onSuccess, reset]);

    useEffect(() => {
        if (error) {
            dismissAll(); // Clear all loading toasts
            showToast("error", mapContractError(error));
            toastIdRef.current = null;
        }
    }, [error, dismissAll, showToast]);

    const deposit = useCallback(async ({
        type,
        amount,
        tokenAddress,
        resetPeriod,
        scope,
        recipient
    }: {
        type: "native" | "erc20";
        amount: string;
        tokenAddress?: string;
        resetPeriod: number;
        scope: number;
        recipient?: string;
    }) => {
        if (!address || !amount) return;

        const parsedAmount = parseEther(amount);
        if (type === "native" && ethBalance && ethBalance.value < parsedAmount) {
            showToast("error", "Insufficient ETH balance");
            return;
        }

        const lockTag = buildLockTag(scope, resetPeriod, DEFAULT_ALLOCATOR_HEX);
        const recipientAddr = recipient && isAddress(recipient) ? recipient : address;

        try {
            if (type === "native") {
                writeContract({
                    address: PROTOCOL_ADDRESS as `0x${string}`,
                    abi: COMPACT_ABI,
                    functionName: "depositNative",
                    args: [lockTag, recipientAddr],
                    value: parsedAmount,
                });
            } else {
                if (!tokenAddress || !isAddress(tokenAddress)) throw new Error("Invalid token address");
                writeContract({
                    address: PROTOCOL_ADDRESS as `0x${string}`,
                    abi: COMPACT_ABI,
                    functionName: "depositERC20",
                    args: [tokenAddress as `0x${string}`, lockTag, parsedAmount, recipientAddr],
                });
            }
        } catch (err) {
            showToast("error", mapContractError(err));
        }
    }, [address, ethBalance, writeContract, showToast]);

    return {
        deposit,
        isPending: isPending || isConfirming,
        hash,
        ethBalance,
    };
}
