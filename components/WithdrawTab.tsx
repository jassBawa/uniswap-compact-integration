"use client";

import { ArrowUpFromLine, Clock, XCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { formatEther } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { Card } from "./ui/card";
import { useWithdraw } from "../hooks/useWithdraw";
import { useCountdown } from "../hooks/useCountdown";
import { FormInput } from "./ui/form-input";
import { TransactionProgress } from "./TransactionProgress";
import { Button } from "./ui/button";
import { COMPACT_ABI } from "../lib/abis/protocol";
import { PROTOCOL_ADDRESS, SCOPES, FORCED_WITHDRAWAL_STATUS, RESET_PERIODS } from "../lib/constants";
import { formatAddress } from "../lib/utils";

export function WithdrawTab() {
    const { address, isConnected } = useAccount();
    const [lockId, setLockId] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawRecipient, setWithdrawRecipient] = useState("");

    const {
        enableForcedWithdrawal,
        disableForcedWithdrawal,
        forcedWithdrawal,
        isPending,
        isSuccess
    } = useWithdraw();

    const { data: lockDetailsRaw } = useReadContract({
        address: PROTOCOL_ADDRESS as `0x${string}`,
        abi: COMPACT_ABI,
        functionName: "getLockDetails",
        args: lockId ? [BigInt(lockId)] : undefined,
        query: { enabled: !!lockId },
    });
    const lockDetails = lockDetailsRaw as [string, string, bigint, bigint, string] | undefined;

    const { data: balanceRaw } = useReadContract({
        address: PROTOCOL_ADDRESS as `0x${string}`,
        abi: COMPACT_ABI,
        functionName: "balanceOf",
        args: address && lockId ? [address, BigInt(lockId)] : undefined,
        query: { enabled: !!address && !!lockId },
    });
    const balance = balanceRaw as bigint | undefined;

    // Only fetch forced withdrawal status when we have a real address
    // This ensures we're checking the correct user's status for the lock
    const hasValidAddress = address && address !== '0x0000000000000000000000000000000000000000';

    const withdrawalStatusData = useReadContract({
        address: PROTOCOL_ADDRESS as `0x${string}`,
        abi: COMPACT_ABI,
        functionName: "getForcedWithdrawalStatus",
        args: hasValidAddress && lockId ? [address, BigInt(lockId)] : undefined,
        query: { enabled: hasValidAddress && !!lockId },
    }).data as [bigint, bigint] | undefined;

    const status = withdrawalStatusData ? Number(withdrawalStatusData[0]) : 0;
    const withdrawableAt = withdrawalStatusData ? Number(withdrawalStatusData[1]) : 0;
    const canWithdraw = useMemo(() => status === 2 || (status === 1 && Date.now() / 1000 >= withdrawableAt), [status, withdrawableAt]);

    const isActuallyFinished = useMemo(() => (balance === BigInt(0) && (status === 1 || status === 2)) || isSuccess, [balance, status, isSuccess]);

    const progressSteps = useMemo(() => [
        {
            label: "Enable Forced Withdrawal",
            status: (status === 0 ? "upcoming" : "success") as "upcoming" | "success"
        },
        {
            label: "Wait for Reset Period",
            status: (status === 0 ? "upcoming" : (status === 1 && !canWithdraw ? "loading" : "success")) as "upcoming" | "loading" | "success"
        },
        {
            label: "Execute Withdrawal",
            status: (isActuallyFinished ? "success" : canWithdraw ? "loading" : "upcoming") as "success" | "loading" | "upcoming"
        }
    ], [status, canWithdraw, isActuallyFinished]);

    const handleMaxAmount = useCallback(() => balance && setWithdrawAmount(formatEther(balance)), [balance]);

    // Check if balance is zero or undefined
    const hasZeroBalance = !balance || balance === BigInt(0);

    return (
        <Card>
            <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Withdraw Assets</h2>
                </div>
                <div>
                    <FormInput
                        label="Resource Lock ID"
                        value={lockId}
                        onChange={(e) => setLockId(e.target.value)}
                        placeholder="Enter lock ID"
                        helperText="The ERC6909 token ID from your deposit"
                        className="font-mono text-xs break-all"
                    />
                </div>

                {lockDetails && lockId && (
                    <div className="mb-6 space-y-3 animate-fade-in">
                        <div className="bg-secondary/20 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-foreground ">Active Lock Parameters</h3>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Asset</span>
                                    <p className="text-sm font-mono truncate text-foreground">
                                        {lockDetails[0] === "0x0000000000000000000000000000000000000000" ? "Native (ETH)" : formatAddress(lockDetails[0])}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Network Scope</span>
                                    <p className="text-sm text-foreground">
                                        {SCOPES[Number(lockDetails[3]) as keyof typeof SCOPES] || `Unknown`}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Reset Delay</span>
                                    <p className="text-sm text-foreground">
                                        {RESET_PERIODS[Number(lockDetails[2]) as keyof typeof RESET_PERIODS]?.label || `Unknown`}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Current Balance</span>
                                    <p className="text-sm font-bold text-primary">
                                        {balance ? formatEther(balance) : "0"} ETH
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Show status only when we have a valid address to query with */}
                {lockId && !hasValidAddress && (
                    <div className="mb-6 p-4 bg-secondary/20 border border-border rounded-xl">
                        <p className="text-sm text-muted-foreground text-center">
                            Connect your wallet to check withdrawal status
                        </p>
                    </div>
                )}

                {lockId && withdrawalStatusData && (
                    <div className="mb-8 space-y-8 animate-fade-in">
                        <div className="px-2">
                            <TransactionProgress steps={progressSteps} />
                        </div>

                        <div className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${status === 0 ? "bg-secondary/20 border-border" :
                            status === 1 ? "bg-amber-500/10 border-amber-500/30" :
                                "bg-emerald-500/10 border-emerald-500/30"
                            }`}>
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${status === 0 ? "bg-muted-foreground" :
                                        status === 1 ? "bg-amber-500 animate-pulse" :
                                            "bg-emerald-500"
                                        }`} />
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none mb-1">Workflow Status</p>
                                        <h4 className={`text-sm font-bold ${status === 0 ? "text-muted-foreground" :
                                            status === 1 ? "text-amber-500" :
                                                "text-emerald-500"
                                            }`}>
                                            {FORCED_WITHDRAWAL_STATUS[status as keyof typeof FORCED_WITHDRAWAL_STATUS]}
                                        </h4>
                                    </div>
                                </div>
                                {status === 1 && (
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-amber-500/50 uppercase tracking-wider mb-1">Maturity Date</p>
                                        <p className="text-xs text-amber-500/80 font-mono">
                                            {new Date(withdrawableAt * 1000).toLocaleTimeString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Show "Enable Forced Withdrawal" only when we have valid status data */}
                {status === 0 && lockId && hasValidAddress && (
                    <div className="mb-6 group">
                        <Button
                            onClick={() => enableForcedWithdrawal(lockId)}
                            disabled={!isConnected || isPending || hasZeroBalance}
                            loading={isPending}
                            variant="default"
                            size="lg"
                            icon={<Clock className="w-4 h-4" />}
                        >
                            Step 1: Initiate Forced Withdrawal
                        </Button>
                        <p className="text-[11px] text-muted-foreground mt-3 text-center transition-colors group-hover:text-foreground">
                            Action required: Enable the withdrawal countdown to bypass the allocator.
                        </p>
                    </div>
                )}

                {/* Show withdraw form only when we have valid status data */}
                {(status === 1 || status === 2) && lockId && hasValidAddress && (
                    <>
                        <div className="mb-4">
                            <FormInput
                                label="Withdraw Amount"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                placeholder="0.0"
                                rightElement={
                                    balance && (
                                        <button
                                            onClick={handleMaxAmount}
                                            className="bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer active:scale-95"
                                        >
                                            MAX
                                        </button>
                                    )
                                }
                            />
                        </div>

                        <div className="mb-6">
                            <FormInput
                                label="Recipient Address"
                                value={withdrawRecipient}
                                onChange={(e) => setWithdrawRecipient(e.target.value)}
                                placeholder="Leave empty for self"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={() => forcedWithdrawal(lockId, withdrawRecipient, withdrawAmount)}
                                disabled={!isConnected || isPending || !withdrawAmount || !canWithdraw || hasZeroBalance}
                                loading={isPending}
                                className="flex-1"
                                size="lg"
                                icon={<ArrowUpFromLine className="w-5 h-5" />}
                            >
                                {!canWithdraw ? "Waiting for Reset..." : "Withdraw Funds"}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => disableForcedWithdrawal(lockId)}
                                disabled={isPending || hasZeroBalance}
                                className="flex-1 sm:flex-initial sm:w-auto"
                                icon={<XCircle className="w-4 h-4" />}
                            >
                                Cancel
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Card >
    );
}
