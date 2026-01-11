"use client";

import { useMemo } from "react";

import { Dropdown, Input } from "@/components/ui";
import { ALLOCATORS, RESET_PERIODS } from "@/lib/constants";
import { computeLockTag } from "@/hooks/useProtocolClaim";

interface DepositDetailsSectionProps {
  id: string;
  amount: string;
  resetPeriod: bigint;
  scope: bigint;
  allocatorId: bigint;
  onIdChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onResetPeriodChange: (value: bigint) => void;
  onScopeChange: (value: bigint) => void;
  onAllocatorIdChange: (value: bigint) => void;
}

export function DepositDetailsSection({
  id,
  amount,
  resetPeriod,
  scope,
  allocatorId,
  onIdChange,
  onAmountChange,
  onResetPeriodChange,
  onScopeChange,
  onAllocatorIdChange,
}: DepositDetailsSectionProps) {
  const lockTag = useMemo(
    () => computeLockTag(allocatorId, scope, resetPeriod),
    [allocatorId, scope, resetPeriod]
  );

  const resetPeriodOptions = useMemo(
    () =>
      Object.entries(RESET_PERIODS).map(([value, { name }]) => ({
        value: BigInt(value),
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

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Deposit Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="id" className="text-xs font-medium text-muted-foreground ml-0.5">
            ID (Lock ID)
          </label>
          <Input
            id="id"
            type="text"
            value={id}
            onChange={(e) => onIdChange(e.target.value)}
            placeholder="0"
            className="font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="amount" className="text-xs font-medium text-muted-foreground ml-0.5">
            Amount (ETH)
          </label>
          <Input
            id="amount"
            type="text"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onAmountChange(e.target.value)}
            placeholder="0.0"
            className="font-mono"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground ml-0.5">Allocator</label>
          <Dropdown
            options={allocatorOptions}
            value={allocatorId.toString()}
            onChange={(v) => onAllocatorIdChange(BigInt(v))}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground ml-0.5">Reset Period</label>
          <Dropdown
            options={resetPeriodOptions}
            value={resetPeriod}
            onChange={(v) => onResetPeriodChange(v as bigint)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground ml-0.5">Scope</label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/50 rounded-xl">
          <button
            type="button"
            onClick={() => onScopeChange(0n)}
            className={
              "py-2 px-2 rounded-lg text-sm font-medium transition-all" +
              (scope === 0n
                ? " bg-primary text-primary-foreground"
                : " text-muted-foreground hover:text-foreground hover:bg-accent")
            }
          >
            Multichain
          </button>
          <button
            type="button"
            onClick={() => onScopeChange(1n)}
            className={
              "py-2 px-2 rounded-lg text-sm font-medium transition-all" +
              (scope === 1n
                ? " bg-primary text-primary-foreground"
                : " text-muted-foreground hover:text-foreground hover:bg-accent")
            }
          >
            Chain-Specific
          </button>
        </div>
      </div>
      <div className="p-3 bg-secondary/30 rounded-lg">
        <p className="text-xs text-muted-foreground">
          Lock Tag:{" "}
          <span className="font-mono text-foreground">
            0x{lockTag.toString(16).padStart(48, "0")}
          </span>
        </p>
      </div>
    </div>
  );
}
