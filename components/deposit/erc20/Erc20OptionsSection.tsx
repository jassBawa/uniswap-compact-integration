"use client";

import { Dropdown } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Erc20OptionsSectionProps {
  allocatorId: bigint;
  resetPeriod: number;
  scope: number;
  allocatorOptions: Array<{ value: string; label: string }>;
  resetPeriodOptions: Array<{ value: number; label: string }>;
  onAllocatorChange: (value: bigint) => void;
  onResetPeriodChange: (value: number) => void;
  onScopeChange: (value: number) => void;
}

export function Erc20OptionsSection({
  allocatorId,
  resetPeriod,
  scope,
  allocatorOptions,
  resetPeriodOptions,
  onAllocatorChange,
  onResetPeriodChange,
  onScopeChange,
}: Erc20OptionsSectionProps) {
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
            onChange={(v) => onAllocatorChange(BigInt(v))}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground ml-0.5">
            Reset Period
          </label>
          <Dropdown
            options={resetPeriodOptions}
            value={resetPeriod}
            onChange={(v) => onResetPeriodChange(Number(v))}
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
            onClick={() => onScopeChange(0)}
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
            onClick={() => onScopeChange(1)}
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
    </>
  );
}
