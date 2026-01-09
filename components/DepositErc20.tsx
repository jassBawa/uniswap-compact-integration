"use client";

import { ArrowDownToLine, CheckCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { isAddress, parseUnits } from "viem";

import { useDepositErc20 } from "@/hooks/useDepositErc20";
import { useERC20 } from "@/hooks/useERC20";
import { useCopy } from "@/hooks/useCopy";
import { useToast } from "@/hooks/useToast";
import { RESET_PERIODS, ALLOCATORS } from "@/lib/constants";
import { Card, CardContent, Dropdown, Input, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface DepositErc20Props {
  onSuccess?: (lockId: string) => void;
}

export function DepositErc20({ onSuccess }: DepositErc20Props) {
  const { isConnected } = useConnection();
  const [amount, setAmount] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [resetPeriod, setResetPeriod] = useState<number>(2);
  const [scope, setScope] = useState<number>(0);
  const [allocatorId, setAllocatorId] = useState<bigint>(ALLOCATORS[0].value);
  const [recipient, setRecipient] = useState("");
  const [lastLockId, setLastLockId] = useState<string | null>(null);

  const { showToast } = useToast();
  const [copied, copy] = useCopy();

  // ERC20 token data
  const {
    decimals,
    rawAllowance,
    isValid,
    isLoading: isLoadingToken,
    balance: tokenBalance,
    symbol: tokenSymbol,
    approve: erc20Approve,
  } = useERC20(tokenAddress);

  const { deposit, approve, isPending, ethBalance } = useDepositErc20({
    onSuccess: (lockId) => {
      setLastLockId(lockId);
      onSuccess?.(lockId);
    },
  });

  // Check if approval is needed based on allowance and amount
  const needsApproval = useMemo(() => {
    if (!tokenAddress || !amount || !isAddress(tokenAddress)) return false;
    if (!isValid || isLoadingToken) return false;
    if (!rawAllowance) return true;

    const tokenDecimals = decimals ?? 18;
    const parsedAmount = parseUnits(amount, tokenDecimals);
    return rawAllowance < parsedAmount;
  }, [tokenAddress, amount, rawAllowance, isValid, isLoadingToken, decimals]);

  const resetPeriodOptions = useMemo(
    () =>
      Object.entries(RESET_PERIODS).map(([value, { name }]) => ({
        value: Number(value),
        label: name,
      })),
    []
  );

  const allocatorOptions = useMemo(
    () =>
      ALLOCATORS.map(({ value, label }) => ({
        value: value.toString(),
        label,
      })),
    []
  );

  const handleDeposit = useCallback(() => {
    deposit({
      amount,
      tokenAddress,
      resetPeriod,
      scope,
      allocatorId,
      recipient,
      decimals: decimals ?? 18,
    });
  }, [
    deposit,
    amount,
    tokenAddress,
    resetPeriod,
    scope,
    allocatorId,
    recipient,
    decimals,
  ]);

  const handleApprove = useCallback(() => {
    if (!tokenAddress || !amount) return;
    approve({
      tokenAddress,
      amount,
      decimals: decimals ?? 18,
    });
  }, [approve, tokenAddress, amount, decimals]);

  const handleCopyLockId = useCallback(async () => {
    if (!lastLockId) return;
    await copy(lastLockId);
    showToast("info", "Lock ID copied to clipboard!");
  }, [lastLockId, copy, showToast]);

  // Token address input
  const tokenAddressInput = (
    <div className="space-y-1.5">
      <label
        htmlFor="tokenAddress"
        className="block text-xs font-medium text-muted-foreground ml-0.5"
      >
        Token Address
      </label>
      <Input
        id="tokenAddress"
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
        placeholder="0x..."
        className="font-mono"
      />
    </div>
  );

  // Amount input with balance
  const amountInput = (
    <div className="space-y-1.5">
      <label
        htmlFor="amount"
        className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5"
      >
        Amount
        {tokenBalance && (
          <span className="text-muted-foreground font-normal">
            ({tokenBalance} {tokenSymbol})
          </span>
        )}
      </label>
      <div className="relative">
        <Input
          id="amount"
          type="text"
          value={amount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setAmount(e.target.value)
          }
          placeholder="0.0"
          className="pr-14 text-lg font-medium"
        />
        {tokenBalance && (
          <button
            type="button"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
            onClick={() => setAmount(tokenBalance)}
          >
            MAX
          </button>
        )}
      </div>
    </div>
  );

  // Loading state
  if (isLoadingToken && !isValid) {
    return (
      <div className="p-4 space-y-5">
        {tokenAddressInput}
        {amountInput}

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground ml-0.5">
            Allocator
          </label>
          <Dropdown
            options={allocatorOptions}
            value={allocatorId.toString()}
            onChange={(v) => setAllocatorId(BigInt(v))}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground ml-0.5">
            Reset Period
          </label>
          <Dropdown
            options={resetPeriodOptions}
            value={resetPeriod}
            onChange={(v) => setResetPeriod(Number(v))}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground ml-0.5">
            Scope
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/50 rounded-xl">
            <button
              type="button"
              onClick={() => setScope(0)}
              className={cn(
                "py-2 px-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                scope === 0
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              Multichain
            </button>
            <button
              type="button"
              onClick={() => setScope(1)}
              className={cn(
                "py-2 px-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                scope === 1
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              Chain-Specific
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="recipient"
            className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5"
          >
            Recipient
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>
          <Input
            id="recipient"
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Leave empty for self"
            className="font-mono"
          />
        </div>

        <Button disabled className="h-11 text-base font-semibold">
          Loading token info...
        </Button>
      </div>
    );
  }

  // Invalid token address state
  if (!isLoadingToken && !isValid) {
    return (
      <div className="space-y-5 p-4">
        {tokenAddressInput}
        {amountInput}

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground ml-0.5">
            Allocator
          </label>
          <Dropdown
            options={allocatorOptions}
            value={allocatorId.toString()}
            onChange={(v) => setAllocatorId(BigInt(v))}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground ml-0.5">
            Reset Period
          </label>
          <Dropdown
            options={resetPeriodOptions}
            value={resetPeriod}
            onChange={(v) => setResetPeriod(Number(v))}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground ml-0.5">
            Scope
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/50 rounded-xl">
            <button
              type="button"
              onClick={() => setScope(0)}
              className={cn(
                "py-2 px-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                scope === 0
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              Multichain
            </button>
            <button
              type="button"
              onClick={() => setScope(1)}
              className={cn(
                "py-2 px-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                scope === 1
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              Chain-Specific
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="recipient"
            className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5"
          >
            Recipient
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>
          <Input
            id="recipient"
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Leave empty for self"
            className="font-mono"
          />
        </div>

        <Button
          disabled
          className="h-11 text-base font-semibold bg-destructive/10 text-destructive"
        >
          Invalid Token Address
        </Button>
      </div>
    );
  }

  // Valid token - show approve or deposit button
  return (
    <div className="p-4 space-y-5">
      {tokenAddressInput}
      {amountInput}

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted-foreground ml-0.5">
          Allocator
        </label>
        <Dropdown
          options={allocatorOptions}
          value={allocatorId.toString()}
          onChange={(v) => setAllocatorId(BigInt(v))}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted-foreground ml-0.5">
          Reset Period
        </label>
        <Dropdown
          options={resetPeriodOptions}
          value={resetPeriod}
          onChange={(v) => setResetPeriod(Number(v))}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground ml-0.5">
          Scope
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/50 rounded-xl">
          <button
            type="button"
            onClick={() => setScope(0)}
            className={cn(
              "py-2 px-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
              scope === 0
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            Multichain
          </button>
          <button
            type="button"
            onClick={() => setScope(1)}
            className={cn(
              "py-2 px-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
              scope === 1
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            Chain-Specific
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="recipient"
          className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5"
        >
          Recipient
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Input
          id="recipient"
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Leave empty for self"
          className="font-mono"
        />
      </div>

      {/* Show approve button if needed */}
      {needsApproval && (
        <Button
          onClick={handleApprove}
          disabled={!isConnected || !amount || isPending}
          loading={isPending}
          className="h-11 text-base font-semibold shadow-sm hover:shadow-md transition-all"
          size="lg"
        >
          <ArrowDownToLine className="w-5 h-5" />
          {!isConnected
            ? "Connect Wallet"
            : isPending
            ? "Approving..."
            : "Approve Tokens"}
        </Button>
      )}

      {/* Show deposit button if allowance is sufficient */}
      {!needsApproval && (
        <Button
          onClick={handleDeposit}
          disabled={!isConnected || isPending || !amount}
          loading={isPending}
          className="h-11 text-base font-semibold shadow-sm hover:shadow-md transition-all"
          size="lg"
        >
          <ArrowDownToLine className="w-5 h-5" />
          {!isConnected
            ? "Connect Wallet"
            : isPending
            ? "Depositing..."
            : "Deposit"}
        </Button>
      )}

      {lastLockId && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-fade-in">
          <p className="text-sm text-emerald-600 mb-2.5 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">Deposit Successful!</span>
          </p>
          <p className="text-xs text-emerald-600 mb-1">Resource Lock ID</p>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-emerald-500/10 px-3 py-2 rounded-lg font-mono truncate flex-1 border border-emerald-500/20">
              {lastLockId}
            </code>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyLockId}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Copied!
                </>
              ) : (
                "Copy"
              )}
            </Button>
          </div>
          <p className="text-[10px] text-emerald-500 mt-2">
            LockTag is automatically derived from this ID for status checks.
          </p>
        </div>
      )}
    </div>
  );
}
