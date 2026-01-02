"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
  useReadContract,
} from "wagmi";
import { parseEther, parseUnits, isAddress } from "viem";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { MaxButton, ExternalLink } from "@/components/ui/Tabs";
import { formatBalance } from "@/lib/utils";
import {
  buildLockTag,
  CHAIN_NAME,
  EXPLORER_URL,
  PROTOCOL_ADDRESS,
} from "@/lib/constants";
import { SEPOLIA_TOKENS, ERC20_ABI } from "@/lib/abis/protocol";
import { ResetPeriod, Scope } from "@/lib/types/compact";
import {
  useDepositNative,
  useDepositERC20,
  useERC20Balance,
  useERC20Approve,
  useERC20Allowance,
  useLockIdFromTransaction,
} from "@/lib/hooks/useCompactProtocol";
import { saveDepositId } from "./BalancesTab";

const RESET_PERIODS = [
  { label: "1 second", value: 0, duration: 1 },
  { label: "15 seconds", value: 1, duration: 15 },
  { label: "1 minute", value: 2, duration: 60 },
  { label: "10 minutes", value: 3, duration: 600 },
  { label: "1 hour 5 min", value: 4, duration: 3900 },
  { label: "1 day", value: 5, duration: 86400 },
  { label: "7 days 1 hour", value: 6, duration: 604800 },
  { label: "30 days", value: 7, duration: 2592000 },
];

const SCOPES = [
  { label: "Chain-specific", value: 1 },
  { label: "Multichain", value: 0 },
];

const ALLOCATOR_ADDRESS = "0x6D0E6566e255AE483a13F18f079b52276Faad179" as const;

export function DepositTab() {
  const { address, isConnected } = useAccount();

  const { data: hash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });
  const { data: ethBalance } = useBalance({ address });

  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [resetPeriod, setResetPeriod] = useState(5);
  const [scope, setScope] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depositType, setDepositType] = useState<"native" | "erc20">("native");
  const [selectedToken, setSelectedToken] = useState<
    (typeof SEPOLIA_TOKENS)[number]
  >(SEPOLIA_TOKENS[0]);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [approvalHash, setApprovalHash] = useState<string | null>(null);

  // ERC-20 balance and allowance
  const { data: tokenBalance } = useERC20Balance(
    depositType === "erc20" ? selectedToken.address : undefined
  );
  const { data: allowance } = useERC20Allowance(
    depositType === "erc20" ? selectedToken.address : undefined,
    PROTOCOL_ADDRESS
  );

  // Deposit hooks
  const {
    depositNative,
    hash: nativeHash,
    isWriting: isNativeWriting,
    isConfirming: isNativeConfirming,
    isConfirmed: isNativeConfirmed,
    writeError: nativeError,
  } = useDepositNative();
  const {
    depositERC20,
    hash: erc20Hash,
    isWriting: isERC20Writing,
    isConfirming: isERC20Confirming,
    isConfirmed: isERC20Confirmed,
    writeError: erc20Error,
  } = useDepositERC20();

  // Combine all errors
  const combinedError = nativeError?.message || erc20Error?.message || error;

  // Approval hook
  const {
    approve,
    hash: approveHash,
    isWriting: isApproving,
    isConfirming: isApproveConfirming,
    isConfirmed: isApproveConfirmed,
  } = useERC20Approve();

  // State for lockId after deposit
  const [lastLockId, setLastLockId] = useState<bigint | null>(null);
  const lastLockIdRef = useRef<bigint | null>(null);

  // Extract lockId from deposit transaction
  const displayHash = approveHash || nativeHash || erc20Hash;
  const { lockId: extractedLockId } = useLockIdFromTransaction(
    isConfirmed || isNativeConfirmed || isERC20Confirmed
      ? displayHash
      : undefined
  );

  // Save lockId when extracted and save to localStorage
  useEffect(() => {
    if (
      extractedLockId &&
      address &&
      (isConfirmed || isNativeConfirmed || isERC20Confirmed) &&
      extractedLockId !== lastLockIdRef.current
    ) {
      lastLockIdRef.current = extractedLockId;
      setLastLockId(extractedLockId);
      saveDepositId(address, extractedLockId);
    }
  }, [
    extractedLockId,
    address,
    isConfirmed,
    isNativeConfirmed,
    isERC20Confirmed,
  ]);

  useEffect(() => {
    if (address) {
      if (!recipient) setRecipient(address);
    }
  }, [address, recipient]);

  useEffect(() => {
    if (
      depositType === "erc20" &&
      tokenBalance &&
      allowance !== undefined &&
      allowance !== null
    ) {
      const amountWei = parseUnits(amount || "0", selectedToken.decimals);
      const allowanceValue =
        typeof allowance === "bigint" ? allowance : BigInt(allowance as string);
      setNeedsApproval(allowanceValue < amountWei);
    } else {
      setNeedsApproval(false);
    }
  }, [depositType, amount, tokenBalance, allowance, selectedToken.decimals]);

  const isPending =
    isWriting || isConfirming || isApproving || isApproveConfirming;

  // Debug logging - only log when relevant state changes
  useEffect(() => {
    console.log("DepositTab state:", {
      isConnected,
      address: address?.slice(0, 6) + "...",
      amount,
      recipient: recipient?.slice(0, 6) + "...",
      isPending,
      needsApproval,
      isValidAmount: amount && parseFloat(amount) > 0,
      isValidRecipient: recipient && isAddress(recipient),
    });
  }, [isConnected, address, amount, recipient, isPending, needsApproval]);
  const txSuccess = isConfirmed || isNativeConfirmed || isERC20Confirmed;
  const txError = combinedError;

  const handleMaxClick = useCallback(() => {
    if (depositType === "native" && ethBalance) {
      setAmount(formatBalance(ethBalance.value, 18, 6));
    } else if (depositType === "erc20" && tokenBalance) {
      setAmount(
        formatBalance(tokenBalance as bigint, selectedToken.decimals, 6)
      );
    }
  }, [ethBalance, tokenBalance, depositType, selectedToken.decimals]);

  const handleApprove = useCallback(async () => {
    setError(null);
    if (!selectedToken.address) return;

    try {
      // Approve max amount
      const maxAmount = BigInt(2) ** BigInt(256) - 1n;
      approve(selectedToken.address, PROTOCOL_ADDRESS, maxAmount);
    } catch (err: any) {
      setError(err.message || "Approval failed");
    }
  }, [selectedToken.address, approve]);

  const handleDeposit = useCallback(async () => {
    console.log("handleDeposit called", {
      address,
      amount,
      recipient,
      depositType,
    });
    setError(null);
    if (!address || !amount || parseFloat(amount) <= 0) {
      setError("Invalid amount");
      console.log("Invalid amount check failed");
      return;
    }
    if (!recipient || !isAddress(recipient)) {
      setError("Invalid recipient address");
      console.log("Invalid recipient check failed", {
        recipient,
        isValid: recipient && isAddress(recipient),
      });
      return;
    }

    try {
      // if (lockTag.length !== 24) {
      //   throw new Error("Invalid lockTag: must be bytes12");
      // }

      console.log("Calling deposit with", {
        amount: parseEther(amount),
        recipient,
      });
      if (depositType === "native") {
        depositNative(
          scope,
          resetPeriod,
          recipient as `0x${string}`,
          parseEther(amount)
        );
      } else {
        const amountWei = parseUnits(amount, selectedToken.decimals);
        depositERC20(
          scope,
          resetPeriod,
          selectedToken.address,
          amountWei,
          recipient as `0x${string}`
        );
      }
    } catch (err: any) {
      setError(err.message || "Transaction failed");
      console.error("Deposit error:", err);
    }
  }, [
    address,
    amount,
    recipient,
    scope,
    resetPeriod,
    depositType,
    selectedToken,
    depositNative,
    depositERC20,
    ALLOCATOR_ADDRESS,
  ]);

  const currentBalance =
    depositType === "native" ? ethBalance?.value : tokenBalance;
  const balanceDecimals =
    depositType === "native" ? 18 : selectedToken.decimals;
  const balanceDisplay = currentBalance
    ? formatBalance(currentBalance as bigint, balanceDecimals, 6)
    : "0.0000";
  const symbol = depositType === "native" ? "ETH" : selectedToken.symbol;

  const displayIsPending = isPending;
  const displayIsSuccess = isApproveConfirmed || txSuccess;

  return (
    <div className="space-y-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">Deposit</h3>
            <p className="text-sm text-zinc-500 mt-1">
              {depositType === "native"
                ? "Deposit native ETH"
                : `Deposit ${selectedToken.symbol} tokens`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDepositType("native")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                depositType === "native"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
              }`}
            >
              Native
            </button>
            <button
              type="button"
              onClick={() => setDepositType("erc20")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                depositType === "erc20"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
              }`}
            >
              ERC-20
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {depositType === "erc20" && (
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Token
            </label>
            <select
              value={selectedToken.address}
              onChange={(e) => {
                const token = SEPOLIA_TOKENS.find(
                  (t) => t.address === e.target.value
                );
                if (token) setSelectedToken(token);
              }}
              disabled={!isConnected || isPending}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm"
            >
              {SEPOLIA_TOKENS.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-zinc-400">Amount</label>
            <span className="text-xs text-zinc-500">
              Balance: {balanceDisplay} {symbol}
            </span>
          </div>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.0000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!isConnected || isPending}
              className="font-mono pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <MaxButton
                onClick={handleMaxClick}
                disabled={!isConnected || isPending}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">
            Recipient Address
          </label>
          <Input
            type="text"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={!isConnected || isPending}
            error={
              recipient && !isAddress(recipient) ? "Invalid address" : undefined
            }
            className="font-mono"
          />
        </div>

        {depositType === "erc20" && needsApproval && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-400">
                  Token Approval Required
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Approve the Compact contract to spend your{" "}
                  {selectedToken.symbol}
                </p>
              </div>
              <Button
                onClick={handleApprove}
                disabled={!isConnected || isApproving || isApproveConfirming}
                isLoading={isApproving || isApproveConfirming}
                size="sm"
              >
                {isApproving || isApproveConfirming
                  ? "Approving..."
                  : "Approve"}
              </Button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
        >
          <svg
            className={`w-3 h-3 transition-transform ${
              showAdvanced ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          Protocol Parameters
        </button>

        {showAdvanced && (
          <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800 space-y-4">
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-emerald-400">
                  Allocator
                </span>
              </div>
              <div className="space-y-1 text-xs text-zinc-500">
                <p className="font-mono text-zinc-400">{ALLOCATOR_ADDRESS}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                Reset Period
              </label>
              <select
                value={resetPeriod}
                onChange={(e) => setResetPeriod(Number(e.target.value))}
                disabled={!isConnected || isPending}
                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm"
              >
                {RESET_PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                Scope
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(Number(e.target.value))}
                disabled={!isConnected || isPending}
                className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-sm"
              >
                {SCOPES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-zinc-700">
              <p className="text-xs text-zinc-500 font-mono break-all">
                Lock Tag:{" "}
                <span className="text-zinc-300">
                  {buildLockTag(scope, resetPeriod)}
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="p-3 bg-zinc-800/30 rounded-lg border border-zinc-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Network</span>
            <span className="text-zinc-300 font-mono">{CHAIN_NAME}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-zinc-500">Contract</span>
            <ExternalLink href={`${EXPLORER_URL}/address/${PROTOCOL_ADDRESS}`}>
              View on Etherscan
            </ExternalLink>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-3">
        {txError && (
          <div className="w-full p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{txError}</p>
          </div>
        )}

        {displayHash && (
          <div className="w-full p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <StatusDot
                status={
                  displayIsPending
                    ? "pending"
                    : displayIsSuccess
                    ? "online"
                    : "error"
                }
              />
              <span className="text-sm font-medium text-emerald-400">
                {displayIsPending
                  ? "Transaction Pending"
                  : displayIsSuccess
                  ? "Transaction Confirmed"
                  : "Transaction Failed"}
              </span>
            </div>
            <ExternalLink href={`${EXPLORER_URL}/tx/${displayHash}`}>
              {displayHash}
            </ExternalLink>
            {lastLockId && displayIsSuccess && (
              <div className="mt-3 pt-3 border-t border-emerald-500/20">
                <p className="text-xs text-zinc-500 mb-1">
                  Lock ID (save for withdrawal):
                </p>
                <p className="font-mono text-sm text-emerald-400 break-all">
                  {lastLockId.toString()}
                </p>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={needsApproval ? handleApprove : handleDeposit}
          disabled={
            !isConnected ||
            isPending ||
            !amount ||
            parseFloat(amount) <= 0 ||
            !recipient ||
            !isAddress(recipient)
          }
          isLoading={isPending}
          className="w-full"
          // Debug - show button state in console
          title={`Disabled: ${
            !isConnected ||
            isPending ||
            !amount ||
            parseFloat(amount) <= 0 ||
            !recipient ||
            !isAddress(recipient)
          }`}
        >
          {isPending
            ? needsApproval
              ? "Approving..."
              : "Processing..."
            : needsApproval
            ? `Approve ${selectedToken.symbol}`
            : `Deposit ${symbol}`}
        </Button>
      </CardFooter>
    </div>
  );
}
