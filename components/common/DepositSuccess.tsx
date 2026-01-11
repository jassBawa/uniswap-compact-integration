"use client";

import { CheckCircle } from "lucide-react";
import { useCopy } from "@/hooks/useCopy";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui";

interface DepositSuccessProps {
  lockId: string;
}

export function DepositSuccess({ lockId }: DepositSuccessProps) {
  const [copied, copy] = useCopy();
  const { showToast } = useToast();

  const handleCopyLockId = async () => {
    await copy(lockId);
    showToast("info", "Lock ID copied to clipboard!");
  };

  return (
    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-fade-in">
      <p className="text-sm text-emerald-600 mb-2.5 flex items-center gap-2">
        <CheckCircle className="w-4 h-4" />
        <span className="font-medium">Deposit Successful!</span>
      </p>
      <p className="text-xs text-emerald-600 mb-1">Resource Lock ID</p>
      <div className="flex items-center gap-2">
        <code className="text-xs bg-emerald-500/10 px-3 py-2 rounded-lg font-mono truncate flex-1 border border-emerald-500/20">
          {lockId}
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
  );
}
