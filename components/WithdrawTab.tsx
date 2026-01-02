"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseEther } from "viem";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { CHAIN_NAME, EXPLORER_URL, PROTOCOL_ADDRESS } from "@/lib/constants";
import { COMPACT_ABI } from "@/lib/abis/protocol";
import { loadSavedDepositIds } from "./BalancesTab";
import { useForcedWithdrawal, useForcedWithdrawalStatus, useLockDetails } from "@/lib/hooks/useCompactProtocol";
import { formatBalance } from "@/lib/utils";

export function WithdrawTab() {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const [lockIdInput, setLockIdInput] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "enabling" | "waiting" | "withdrawing">("idle");

  // Parse lockId from input
  const lockId = lockIdInput ? BigInt(lockIdInput) : undefined;

  // Load saved deposit IDs for quick selection
  const [savedIds, setSavedIds] = useState<bigint[]>([]);
  useEffect(() => {
    if (address) {
      const ids = loadSavedDepositIds(address);
      setSavedIds(ids);
    }
  }, [address]);

  // Get forced withdrawal status
  const { data: withdrawalStatus } = useForcedWithdrawalStatus(address, lockId);

  // Get lock details to show balance
  const { data: balanceData } = useERC6909Balance(lockId);
  const { data: lockDetailsData } = useLockDetails(lockId);

  // Calculate withdrawal amount (max if empty, or parse user input)
  const maxAmount = typeof balanceData === 'bigint' ? balanceData : 0n;
  const withdrawAmount = amount
    ? parseEther(amount) // Parse decimal ETH amount to wei
    : maxAmount;

  // Forced withdrawal hooks
  const {
    enableForcedWithdrawal,
    forcedWithdrawal,
    hash: enableHash,
    isWriting: isEnabling,
    isConfirming: isEnablingConfirming,
    isConfirmed: isEnablingConfirmed,
    writeError: enableError,
  } = useForcedWithdrawal();

  const {
    hash: withdrawHash,
    isWriting: isWithdrawing,
    isConfirming: isWithdrawingConfirming,
    isConfirmed: isWithdrawingConfirmed,
    writeError: withdrawError,
  } = useForcedWithdrawal();

  // Enable forced withdrawal
  const handleEnable = useCallback(async () => {
    if (!lockId) {
      setError("Please enter a valid Lock ID");
      return;
    }

    setError(null);
    setStep("enabling");

    try {
      enableForcedWithdrawal(lockId);
    } catch (err: any) {
      setError(err.message || "Failed to enable withdrawal");
      setStep("idle");
    }
  }, [lockId, enableForcedWithdrawal]);

  // Complete forced withdrawal
  const handleWithdraw = useCallback(async () => {
    if (!lockId || !address) {
      setError("Invalid lock ID or recipient");
      return;
    }

    setError(null);
    setStep("withdrawing");

    try {
      const recipientAddress = recipient && recipient.trim() !== "" ? recipient as `0x${string}` : address;
      forcedWithdrawal(lockId, recipientAddress, withdrawAmount);
    } catch (err: any) {
      setError(err.message || "Failed to withdraw");
      setStep("waiting");
    }
  }, [lockId, address, recipient, withdrawAmount, forcedWithdrawal]);

  // Check withdrawal status and update step
  useEffect(() => {
    if (!lockId || !address) return;

    if (isEnablingConfirmed && !isWithdrawing) {
      setStep("waiting");
    }
    if (isWithdrawingConfirmed) {
      setStep("idle");
      setAmount("");
      // Invalidate queries to refresh balances
      queryClient.invalidateQueries({ queryKey: ['balanceOf'] });
      queryClient.invalidateQueries({ queryKey: ['getForcedWithdrawalStatus'] });
    }
  }, [isEnablingConfirmed, isWithdrawingConfirmed, isWithdrawing, lockId, address, queryClient]);

  const combinedError = enableError?.message || withdrawError?.message || error;

  const isPending = isEnabling || isEnablingConfirming || isWithdrawing || isWithdrawingConfirming;
  const isSuccess = isWithdrawingConfirmed;

  // Parse lock details for display
  const lockDetails = lockDetailsData as readonly [string, string, bigint, bigint] | undefined;
  const getScopeLabel = (scope: number) => (scope === 0 ? "Multichain" : "Chain");
  const getResetPeriodLabel = (period: number) => {
    const labels: Record<number, string> = {
      0: "1s", 1: "15s", 2: "1m", 3: "10m", 4: "1h5m", 5: "1d", 6: "7d1h", 7: "30d",
    };
    return labels[period] || `${period}`;
  };

  // Check if withdrawal is enabled
  const withdrawalEnabled = withdrawalStatus ? (withdrawalStatus as any).enabled : false;
  const withdrawalReady = withdrawalEnabled && (withdrawalStatus as any)?.ready;

  return (
    <div className="space-y-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">Withdraw</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Force withdraw using your Lock ID
            </p>
          </div>
          <Badge variant={step === "waiting" ? "warning" : "info"}>
            {step === "idle" ? "Ready" : step === "enabling" ? "Enabling..." : step === "waiting" ? "Waiting Period" : "Withdrawing..."}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Saved IDs Quick Select */}
        {savedIds.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Your Saved Lock IDs
            </label>
            <div className="flex flex-wrap gap-2">
              {savedIds.map((id) => (
                <button
                  key={id.toString()}
                  type="button"
                  onClick={() => setLockIdInput(id.toString())}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-xs font-mono text-zinc-300 transition-colors"
                >
                  {id.toString().slice(0, 8)}...{id.toString().slice(-4)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lock ID Input */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">
            Lock ID
          </label>
          <Input
            type="text"
            placeholder="Enter or select Lock ID"
            value={lockIdInput}
            onChange={(e) => setLockIdInput(e.target.value)}
            disabled={!isConnected || isPending}
            className="font-mono"
          />
        </div>

        {/* Lock Details Display */}
        {lockDetails && (
          <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Available Balance</span>
              <span className="text-sm font-mono text-emerald-400">
                {formatBalance(balanceData as bigint || 0n, 18, 4)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Scope</span>
              <span className="text-xs text-zinc-300">{getScopeLabel(Number(lockDetails[3]))}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Reset Period</span>
              <span className="text-xs text-zinc-300">{getResetPeriodLabel(Number(lockDetails[2]))}</span>
            </div>
            {withdrawalEnabled && (
              <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
                <span className="text-xs text-zinc-500">Withdrawal Status</span>
                <Badge variant={withdrawalReady ? "success" : "warning"} size="sm">
                  {withdrawalReady ? "Ready to Withdraw" : "Waiting Period"}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Recipient Address */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-zinc-400">Recipient Address</label>
            <button
              type="button"
              onClick={() => address && setRecipient(address)}
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              Use My Address
            </button>
          </div>
          <Input
            type="text"
            placeholder="0x... (leave empty to use your address)"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={!isConnected || isPending}
            className="font-mono"
          />
        </div>

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-zinc-400">Amount</label>
            <button
              type="button"
              onClick={() => setAmount(maxAmount.toString())}
              disabled={!isConnected || isPending || maxAmount === 0n}
              className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
            >
              Max: {formatBalance(maxAmount, 18, 6)}
            </button>
          </div>
          <Input
            type="text"
            placeholder="Enter amount or use Max"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!isConnected || isPending}
            className="font-mono"
          />
        </div>

        {/* Info Box */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-xs text-amber-400">
            <strong>Note:</strong> Forced withdrawals require enabling first, then waiting for the protocol&apos;s withdrawal delay before completing.
          </p>
        </div>

        {/* Network Info */}
        <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Network</span>
            <span className="text-zinc-300 font-mono">{CHAIN_NAME}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-3">
        {combinedError && (
          <div className="w-full p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{combinedError}</p>
          </div>
        )}

        {(enableHash || withdrawHash) && (
          <div className="w-full p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <StatusDot
                status={
                  isPending
                    ? "pending"
                    : isSuccess
                    ? "online"
                    : "error"
                }
              />
              <span className="text-sm font-medium text-emerald-400">
                {isPending
                  ? "Transaction Pending"
                  : isSuccess
                  ? "Transaction Confirmed"
                  : "Transaction Failed"}
              </span>
            </div>
            <ExternalLink href={`${EXPLORER_URL}/tx/${withdrawHash || enableHash}`}>
              {withdrawHash || enableHash}
            </ExternalLink>
          </div>
        )}

        <Button
          onClick={step === "waiting" ? handleWithdraw : handleEnable}
          disabled={
            !isConnected ||
            isPending ||
            !lockId ||
            (step === "waiting" && maxAmount === 0n)
          }
          isLoading={isPending}
          className="w-full"
          variant={step === "waiting" ? "primary" : "secondary"}
        >
          {isPending
            ? "Processing..."
            : step === "enabling"
            ? "Enabling Forced Withdrawal..."
            : step === "waiting"
            ? `Withdraw ${formatBalance(withdrawAmount, 18, 4)}`
            : "Enable Forced Withdrawal"}
        </Button>
      </CardFooter>
    </div>
  );
}

// Helper hook for balance (inline since we need it here)
function useERC6909Balance(id: bigint | undefined) {
  const { address } = useAccount();
  return useReadContract({
    address: PROTOCOL_ADDRESS,
    abi: COMPACT_ABI,
    functionName: "balanceOf",
    args: address && id ? [address, id] : undefined,
    query: { enabled: !!address && !!id, refetchInterval: 5000 },
  } as any);
}

// Simple ExternalLink component since it's not imported
function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
    >
      {children}
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}
