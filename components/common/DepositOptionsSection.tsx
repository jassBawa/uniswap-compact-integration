"use client";

import { Dropdown } from "@/components/ui";

interface DepositOptionsSectionProps {
  allocatorId: bigint;
  resetPeriod: bigint;
  scope: bigint;
  allocatorOptions: { value: string; label: string }[];
  resetPeriodOptions: { value: bigint; label: string }[];
  onAllocatorIdChange: (value: bigint) => void;
  onResetPeriodChange: (value: bigint) => void;
  onScopeChange: (value: bigint) => void;
}

export function DepositOptionsSection({
  allocatorId,
  resetPeriod,
  scope,
  allocatorOptions,
  resetPeriodOptions,
  onAllocatorIdChange,
  onResetPeriodChange,
  onScopeChange,
}: DepositOptionsSectionProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground ml-0.5">
            Allocator
          </label>
          <Dropdown
            options={allocatorOptions}
            value={allocatorId.toString()}
            onChange={(v) => onAllocatorIdChange(BigInt(v))}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground ml-0.5">
            Reset Period
          </label>
          <Dropdown
            options={resetPeriodOptions}
            value={resetPeriod}
            onChange={(v) => onResetPeriodChange(v as bigint)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground ml-0.5">
          Scope
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/50 rounded-xl">
          <button
            type="button"
            onClick={() => onScopeChange(0n)}
            className={
              "py-2 px-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap" +
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
              "py-2 px-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap" +
              (scope === 1n
                ? " bg-primary text-primary-foreground"
                : " text-muted-foreground hover:text-foreground hover:bg-accent")
            }
          >
            Chain-Specific
          </button>
        </div>
      </div>
    </>
  );
}
