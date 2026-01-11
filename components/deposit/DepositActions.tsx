import { ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui";

interface DepositActionsProps {
  isConnected: boolean;
  isPending: boolean;
  amount: string;
  needsApproval: boolean;
  onDeposit: () => void;
  onApprove: () => void;
}

export function DepositActions({
  isConnected,
  isPending,
  amount,
  needsApproval,
  onDeposit,
  onApprove,
}: DepositActionsProps) {
  return (
    <>
      {needsApproval && (
        <Button
          onClick={onApprove}
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

      {!needsApproval && (
        <Button
          onClick={onDeposit}
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
    </>
  );
}
