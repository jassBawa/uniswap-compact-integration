"use client";

import { ArrowDownToLine } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useConnection } from "wagmi";

import { Button, Dropdown, Input } from "@/components/ui";
import { DepositSuccess } from "../../common/DepositSuccess";
import { useDepositNative } from "@/hooks/useDepositNative";
import { useMaxAmount } from "@/hooks/useMaxAmount";
import { ALLOCATORS, RESET_PERIODS } from "@/lib/constants";
import { cn } from "@/lib/utils";


export function DepositNative() {
  const { isConnected } = useConnection();
  const [amount, setAmount] = useState("");
  const [resetPeriod, setResetPeriod] = useState<number>(2);
  const [scope, setScope] = useState<number>(0);
  const [allocatorId, setAllocatorId] = useState<bigint>(ALLOCATORS[0].value);
  const [recipient, setRecipient] = useState("");
  const [lastLockId, setLastLockId] = useState<string | null>(null);

  const { deposit, isPending, ethBalance } = useDepositNative({
    onSuccess: (lockId) => {
      setLastLockId(lockId);
    },
  });

  const { handleMax, formattedBalance } = useMaxAmount(ethBalance);

  const resetPeriodOptions = useMemo(() =>
    Object.entries(RESET_PERIODS).map(([value, { name }]) => ({
      value: Number(value),
      label: name,
    })), []);

  const allocatorOptions = useMemo(() =>
    ALLOCATORS.map(({ value, label }) => ({
      value: value.toString(),
      label,
    })), []);

  const handleDeposit = useCallback(() => {
    deposit({
      amount,
      resetPeriod,
      scope,
      allocatorId,
      recipient,
    });
  }, [deposit, amount, resetPeriod, scope, allocatorId, recipient]);

  return (
      <div className="mt-8 p-2 px-6 space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="amount" className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5">
            Amount
            {ethBalance && (
              <span className="text-muted-foreground font-normal">
                ({formattedBalance} ETH)
              </span>
            )}
          </label>
          <div className="relative">
            <Input
              id="amount"
              type="text"
              value={amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
              placeholder="0.0"
              className="pr-14 text-lg font-medium"
            />
            {ethBalance && (
              <button
                type="button"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
                onClick={() => setAmount(handleMax())}
              >
                MAX
              </button>
            )}
          </div>
        </div>

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
          <label htmlFor="recipient" className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5">
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

        <Button
          onClick={handleDeposit}
          disabled={!isConnected || isPending || !amount}
          loading={isPending}
          className="h-11 text-base font-semibold shadow-sm hover:shadow-md transition-all"
          size="lg"
        >
          <ArrowDownToLine className="w-5 h-5" />
          {!isConnected ? "Connect Wallet" : isPending ? "Confirming..." : "Deposit"}
        </Button>

        {lastLockId && <DepositSuccess lockId={lastLockId} />}
      </div>
  );
}
