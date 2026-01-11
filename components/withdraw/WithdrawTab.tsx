"use client";

import { ArrowUpFromLine, Clock, XCircle } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { formatEther, formatUnits } from "viem";
import { useConnection, useReadContract } from "wagmi";
import { useWithdraw } from "../../hooks/useWithdraw";
import { COMPACT_ABI, ERC20_ABI } from "../../lib/abis/protocol";
import { PROTOCOL_ADDRESS } from "../../lib/constants";
import { LockDetailsCard } from "./LockDetailsCard";
import { WithdrawalStatusCard } from "./WithdrawalStatusCard";
import { Button, Card, FormInput } from "../ui";

export function WithdrawTab() {
  const { address, isConnected } = useConnection();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [lockId, setLockId] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawRecipient, setWithdrawRecipient] = useState("");

  const { enableForcedWithdrawal, disableForcedWithdrawal, forcedWithdrawal, isPending } =
    useWithdraw();

  // Fetch lock details
  const { data: lockDetailsRaw } = useReadContract({
    address: PROTOCOL_ADDRESS as `0x${string}`,
    abi: COMPACT_ABI,
    functionName: "getLockDetails",
    args: lockId ? [BigInt(lockId)] : undefined,
    query: { enabled: !!lockId },
  });
  const lockDetails = lockDetailsRaw as [string, string, bigint, bigint, string] | undefined;
  const tokenAddress = lockDetails?.[0];
  const isNative = tokenAddress === "0x0000000000000000000000000000000000000000";

  const { data: tokenDecimalsData } = useReadContract({
    address: isNative ? undefined : (tokenAddress as `0x${string}`),
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { enabled: !isNative && !!tokenAddress },
  });
  const tokenDecimals = isNative ? 18 : (tokenDecimalsData ? Number(tokenDecimalsData) : 18);

  const { data: balanceRaw } = useReadContract({
    address: PROTOCOL_ADDRESS as `0x${string}`,
    abi: COMPACT_ABI,
    functionName: "balanceOf",
    args: address && lockId ? [address, BigInt(lockId)] : undefined,
    query: { enabled: !!address && !!lockId },
  });
  const balance = balanceRaw as bigint | undefined;

  const hasValidAddress = address && address !== "0x0000000000000000000000000000000000000000";
  const hasValidLockId = lockId.length === 66 && lockId.startsWith("0x");

  const withdrawalStatusQuery = useReadContract({
    address: PROTOCOL_ADDRESS as `0x${string}`,
    abi: COMPACT_ABI,
    functionName: "getForcedWithdrawalStatus",
    args: hasValidAddress && hasValidLockId ? [address, BigInt(lockId)] : undefined,
    query: { enabled: Boolean(hasValidAddress && hasValidLockId), staleTime: 0, refetchOnWindowFocus: true },
  });
  const withdrawalStatusData = withdrawalStatusQuery.data as [bigint, bigint] | undefined;

  const status = withdrawalStatusData ? Number(withdrawalStatusData[0]) : 0;
  const withdrawableAt = withdrawalStatusData ? Number(withdrawalStatusData[1]) : 0;
  const canWithdraw = useMemo(
    () => (status === 1 || status === 2) && Date.now() / 1000 >= withdrawableAt,
    [status, withdrawableAt]
  );

  const refetchRef = useRef(withdrawalStatusQuery.refetch);
  refetchRef.current = withdrawalStatusQuery.refetch;

  useEffect(() => {
    const now = Date.now() / 1000;
    if (status === 1 && withdrawableAt > 0) {
      const timeUntilMaturity = (withdrawableAt - now) * 1000;
      if (timeUntilMaturity <= 0) {
        pollIntervalRef.current = setInterval(() => refetchRef.current?.(), 2000);
      } else if (timeUntilMaturity < 10000) {
        pollIntervalRef.current = setInterval(() => refetchRef.current?.(), 1000);
      } else {
        const timeoutId = setTimeout(() => {
          refetchRef.current?.().then(() => {
            if (withdrawableAt - Date.now() / 1000 <= 0) {
              pollIntervalRef.current = setInterval(() => refetchRef.current?.(), 2000);
            }
          });
        }, timeUntilMaturity + 500);
        return () => clearTimeout(timeoutId);
      }
      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    }
  }, [status, withdrawableAt]);

  // Computed values
  const isActuallyFinished = balance === BigInt(0) && (status === 1 || status === 2);
  const progressSteps = useMemo<
    Array<{ label: string; status: "upcoming" | "loading" | "success" }>
  >(() => [
    { label: "Enable Forced Withdrawal", status: status === 0 ? "upcoming" : "success" },
    { label: "Wait for Reset Period", status: status === 0 ? "upcoming" : !canWithdraw ? "loading" : "success" },
    { label: "Execute Withdrawal", status: isActuallyFinished ? "success" : canWithdraw ? "loading" : "upcoming" },
  ], [status, canWithdraw, isActuallyFinished]);

  const formattedBalance = useMemo(
    () => (balance ? (tokenDecimals === 18 ? formatEther(balance) : formatUnits(balance, tokenDecimals)) : "0"),
    [balance, tokenDecimals]
  );

  const handleMaxAmount = () => {
    if (balance) {
      setWithdrawAmount(formattedBalance);
    }
  };

  const handleForcedWithdrawal = () => {
    if (lockId && withdrawAmount) {
      forcedWithdrawal(lockId, withdrawRecipient, withdrawAmount, tokenDecimals);
    }
  };

  const hasZeroBalance = !balance || balance === BigInt(0);


  console.log(status);

  return (
    <Card>
      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        <h2 className="text-xl font-bold text-foreground">Withdraw Assets</h2>

        <FormInput
          label="Resource Lock ID"
          value={lockId}
          onChange={(e) => setLockId(e.target.value)}
          placeholder="0x..."
          helperText="Full lock ID from deposit"
          className="font-mono text-xs break-all"
        />

        {lockDetails && lockId && (
          <LockDetailsCard lockDetails={lockDetails} isNative={isNative} tokenAddress={tokenAddress || ""} formattedBalance={formattedBalance} />
        )}

        {lockId && !hasValidAddress && (
          <div className="p-4 bg-secondary/20 border border-border rounded-xl text-center text-sm text-muted-foreground">
            Connect wallet to check status
          </div>
        )}

        {lockId && withdrawalStatusData && (
          <WithdrawalStatusCard status={status} withdrawableAt={withdrawableAt} canWithdraw={canWithdraw} progressSteps={progressSteps} />
        )}

        {status === 0 && lockId && hasValidAddress && (
          <div className="group">
            <Button
              onClick={() => enableForcedWithdrawal(lockId)}
              disabled={!isConnected || isPending || hasZeroBalance}
              loading={isPending}
              size="lg"
              icon={<Clock className="w-4 h-4" />}
              className="w-full"
            >
              Step 1: Initiate Forced Withdrawal
            </Button>
            <p className="text-[11px] text-muted-foreground mt-3 text-center">Enable countdown to bypass allocator</p>
          </div>
        )}

        {(status === 1 || status === 2) && lockId && hasValidAddress && (
          <Button variant="outline" onClick={() => disableForcedWithdrawal(lockId)} disabled={isPending || hasZeroBalance} icon={<XCircle className="w-4 h-4" />}>
            Cancel Forced Withdrawal
          </Button>
        )}

        {(status === 1 || status === 2) && canWithdraw && lockId && hasValidAddress && (
          <>
            <FormInput
              label="Withdraw Amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.0"
              rightElement={
                balance && (
                  <button type="button" onClick={handleMaxAmount} className="px-2 py-1 text-[10px] font-bold bg-primary/10 text-primary rounded-md hover:bg-primary/20">
                    MAX
                  </button>
                )
              }
            />
            <FormInput label="Recipient Address" value={withdrawRecipient} onChange={(e) => setWithdrawRecipient(e.target.value)} placeholder="Leave empty for self" />
            <Button onClick={handleForcedWithdrawal} disabled={!isConnected || isPending || !withdrawAmount} loading={isPending} icon={<ArrowUpFromLine className="w-5 h-5" />} className="w-full" size="lg">
              Withdraw Funds
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
