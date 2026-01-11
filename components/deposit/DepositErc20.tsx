"use client";

import { ReactNode, useCallback, useMemo, useState } from "react";
import { isAddress, parseUnits } from "viem";
import { useConnection } from "wagmi";

import { DepositSuccess } from "./DepositSuccess";
import { DepositFormFields } from "./DepositFormFields";
import { DepositActions } from "./DepositActions";
import { Button } from "@/components/ui";
import { useDepositErc20 } from "@/hooks/useDepositErc20";
import { useERC20 } from "@/hooks/useERC20";
import { ALLOCATORS, RESET_PERIODS } from "@/lib/constants";

type FormState = "loading" | "invalid" | "valid";

interface DepositFormProps {
  state: FormState;
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
  children?: ReactNode;
}

function DepositForm({ state, children, ...formProps }: DepositFormProps) {
  return (
    <div className="p-4 space-y-5">
      <DepositFormFields {...formProps} />

      {state === "loading" && (
        <Button disabled className="h-11 text-base font-semibold">
          Loading token info...
        </Button>
      )}

      {state === "invalid" && (
        <Button
          disabled
          className="h-11 text-base font-semibold bg-destructive/10 text-destructive"
        >
          Invalid Token Address
        </Button>
      )}

      {state === "valid" && children}
    </div>
  );
}


export function DepositErc20() {
  const { isConnected } = useConnection();
  const [amount, setAmount] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [resetPeriod, setResetPeriod] = useState<number>(2);
  const [scope, setScope] = useState<number>(0);
  const [allocatorId, setAllocatorId] = useState<bigint>(ALLOCATORS[0].value);
  const [recipient, setRecipient] = useState("");
  const [lastLockId, setLastLockId] = useState<string | null>(null);

  const {
    decimals,
    rawAllowance,
    isValid,
    isLoading: isLoadingToken,
    balance: tokenBalance,
    symbol: tokenSymbol,
  } = useERC20(tokenAddress);

  const { deposit, approve, isPending } = useDepositErc20({
    onSuccess: (lockId) => {
      setLastLockId(lockId);
    },
  });

  const needsApproval = useMemo(() => {
    if (!tokenAddress || !amount || !isAddress(tokenAddress)) return false;
    if (!isValid || isLoadingToken) return false;
    if (!rawAllowance) return true;

    const tokenDecimals = decimals ?? 18;
    const parsedAmount = parseUnits(amount, tokenDecimals);
    return rawAllowance < parsedAmount;
  }, [tokenAddress, amount, rawAllowance, isValid, isLoadingToken, decimals]);

  const resetPeriodOptions = useMemo(
    () =>
      Object.entries(RESET_PERIODS).map(([value, { name }]) => ({
        value: Number(value),
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

  const handleDeposit = useCallback(() => {
    deposit({
      amount,
      tokenAddress,
      resetPeriod,
      scope,
      allocatorId,
      recipient,
      decimals: decimals ?? 18,
    });
  }, [
    deposit,
    amount,
    tokenAddress,
    resetPeriod,
    scope,
    allocatorId,
    recipient,
    decimals,
  ]);

  const handleApprove = useCallback(() => {
    if (!tokenAddress || !amount) return;
    approve({
      tokenAddress,
      amount,
      decimals: decimals ?? 18,
    });
  }, [approve, tokenAddress, amount, decimals]);

  const formState: FormState = isLoadingToken && !isValid ? "loading" : !isValid ? "invalid" : "valid";

  return (
    <DepositForm
      state={formState}
      tokenAddress={tokenAddress}
      onTokenAddressChange={setTokenAddress}
      amount={amount}
      onAmountChange={setAmount}
      balance={tokenBalance}
      symbol={tokenSymbol}
      allocatorId={allocatorId}
      onAllocatorChange={setAllocatorId}
      allocatorOptions={allocatorOptions}
      resetPeriod={resetPeriod}
      onResetPeriodChange={setResetPeriod}
      resetPeriodOptions={resetPeriodOptions}
      scope={scope}
      onScopeChange={setScope}
      recipient={recipient}
      onRecipientChange={setRecipient}
    >
      <DepositActions
        isConnected={isConnected}
        isPending={isPending}
        amount={amount}
        needsApproval={needsApproval}
        onDeposit={handleDeposit}
        onApprove={handleApprove}
      />

      {lastLockId && <DepositSuccess lockId={lastLockId} />}
    </DepositForm>
  );
}
