"use client";

import { ArrowDownToLine } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { isAddress, parseUnits } from "viem";
import { useConnection } from "wagmi";

import { DepositSuccess } from "./DepositSuccess";
import { Button, Dropdown, Input } from "@/components/ui";
import { useDepositErc20 } from "@/hooks/useDepositErc20";
import { useERC20 } from "@/hooks/useERC20";
import { ALLOCATORS, RESET_PERIODS } from "@/lib/constants";
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

      {lastLockId && <DepositSuccess lockId={lastLockId} />}
    </div>
  );
}
