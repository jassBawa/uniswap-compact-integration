import { Input, Dropdown } from "@/components/ui";
import { cn } from "@/lib/utils";

interface DepositFormFieldsProps {
  tokenAddress: string;
  onTokenAddressChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  balance?: string;
  symbol?: string;
  allocatorId: bigint;
  onAllocatorChange: (value: bigint) => void;
  allocatorOptions: Array<{ value: string; label: string }>;
  resetPeriod: number;
  onResetPeriodChange: (value: number) => void;
  resetPeriodOptions: Array<{ value: number; label: string }>;
  scope: number;
  onScopeChange: (value: number) => void;
  recipient: string;
  onRecipientChange: (value: string) => void;
}

export function DepositFormFields({
  tokenAddress,
  onTokenAddressChange,
  amount,
  onAmountChange,
  balance,
  symbol,
  allocatorId,
  onAllocatorChange,
  allocatorOptions,
  resetPeriod,
  onResetPeriodChange,
  resetPeriodOptions,
  scope,
  onScopeChange,
  recipient,
  onRecipientChange,
}: DepositFormFieldsProps) {
  return (
    <>
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
          onChange={(e) => onTokenAddressChange(e.target.value)}
          placeholder="0x..."
          className="font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="amount"
          className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5"
        >
          Amount
          {balance && symbol && (
            <span className="text-muted-foreground font-normal">
              ({balance} {symbol})
            </span>
          )}
        </label>
        <div className="relative">
          <Input
            id="amount"
            type="text"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onAmountChange(e.target.value)
            }
            placeholder="0.0"
            className="pr-14 text-lg font-medium"
          />
          {balance && (
            <button
              type="button"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
              onClick={() => onAmountChange(balance)}
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
          onChange={(e) => onRecipientChange(e.target.value)}
          placeholder="Leave empty for self"
          className="font-mono"
        />
      </div>
    </>
  );
}
