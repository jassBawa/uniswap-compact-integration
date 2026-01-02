"use client";

import { ArrowDownToLine, CheckCircle, Coins } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useAccount } from "wagmi";

import { useDeposit } from "@/hooks/useDeposit";
import { useCopy } from "@/hooks/useCopy";
import { useMaxAmount } from "@/hooks/useMaxAmount";
import { useToast } from "@/hooks/useToast";
import { RESET_PERIODS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function DepositForm() {
    const { isConnected } = useAccount();
    const [depositType, setDepositType] = useState<"native" | "erc20">("native");
    const [amount, setAmount] = useState("");
    const [tokenAddress, setTokenAddress] = useState("");
    const [resetPeriod, setResetPeriod] = useState<number>(0);
    const [scope, setScope] = useState<number>(0);
    const [recipient, setRecipient] = useState("");
    const [lastLockId, setLastLockId] = useState<string | null>(null);

    const { showToast } = useToast();
    const [copied, copy] = useCopy();

    const { deposit, isPending, ethBalance } = useDeposit({
        onSuccess: (lockId) => setLastLockId(lockId),
    });

    const { handleMax, formattedBalance } = useMaxAmount(ethBalance);

    const resetPeriodOptions = useMemo(() =>
        Object.entries(RESET_PERIODS).map(([value, { label }]) => ({
            value: Number(value),
            label,
        })), []);

    const handleDeposit = useCallback(() => {
        deposit({
            type: depositType,
            amount,
            tokenAddress,
            resetPeriod,
            scope,
            recipient
        });
    }, [deposit, depositType, amount, tokenAddress, resetPeriod, scope, recipient]);

    const handleCopyLockId = useCallback(async () => {
        if (!lastLockId) return;
        await copy(lastLockId);
        showToast("info", "Lock ID copied to clipboard!");
    }, [lastLockId, copy, showToast]);

    return (
        <Card>
            <CardHeader>
                <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl overflow-x-auto">
                    <button
                        onClick={() => setDepositType("native")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 px-2 sm:px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                            depositType === "native"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                    >
                        <Coins className="w-4 h-4" />
                        Native (ETH)
                    </button>
                    <button
                        onClick={() => setDepositType("erc20")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 px-2 sm:px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                            depositType === "erc20"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                    >
                        <Coins className="w-4 h-4" />
                        ERC20 Token
                    </button>
                </div>
            </CardHeader>

            <CardContent className="space-y-5">
                {depositType === "erc20" && (
                    <div className="space-y-1.5">
                        <label htmlFor="tokenAddress" className="block text-xs font-medium text-muted-foreground ml-0.5">
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
                )}

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

                {lastLockId && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-fade-in">
                        <p className="text-sm text-emerald-600 mb-2.5 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium">Last Deposit Lock ID</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <code className="text-xs bg-emerald-500/10 px-3 py-2 rounded-lg font-mono truncate flex-1 border border-emerald-500/20">
                                {lastLockId}
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
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
