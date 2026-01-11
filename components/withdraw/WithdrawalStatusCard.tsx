"use client";

import { FORCED_WITHDRAWAL_STATUS } from "@/lib/constants";
import { TransactionProgress } from "../TransactionProgress";

interface WithdrawalStatusCardProps {
  status: number;
  withdrawableAt: number;
  canWithdraw: boolean;
  progressSteps: Array<{ label: string; status: "upcoming" | "loading" | "success" }>;
}

export function WithdrawalStatusCard({ status, withdrawableAt, canWithdraw, progressSteps }: WithdrawalStatusCardProps) {
  const isPending = status === 1 || (status === 2 && !canWithdraw);
  const isReady = status === 2 && canWithdraw;

  return (
    <div className="mb-8 space-y-8 animate-fade-in">
      <div className="px-2">
        <TransactionProgress steps={progressSteps} />
      </div>

      <div
        className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
          status === 0
            ? "bg-secondary/20 border-border"
            : isPending
            ? "bg-amber-500/10 border-amber-500/30"
            : "bg-emerald-500/10 border-emerald-500/30"
        }`}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${
                status === 0
                  ? "bg-muted-foreground"
                  : isPending
                  ? "bg-amber-500 animate-pulse"
                  : "bg-emerald-500"
              }`}
            />
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none mb-1">
                Workflow Status
              </p>
              <h4
                className={`text-sm font-bold ${
                  status === 0
                    ? "text-muted-foreground"
                    : isPending
                    ? "text-amber-500"
                    : "text-emerald-500"
                }`}
              >
                {FORCED_WITHDRAWAL_STATUS[status as keyof typeof FORCED_WITHDRAWAL_STATUS]}
              </h4>
            </div>
          </div>
          {!canWithdraw && (status === 1 || status === 2) && (
            <div className="text-right">
              <p className="text-[10px] font-bold text-amber-500/50 uppercase tracking-wider mb-1">
                Maturity Date
              </p>
              <p className="text-xs text-amber-500/80 font-mono">
                {new Date(withdrawableAt * 1000).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
