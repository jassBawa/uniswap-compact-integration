"use client";

import { useCallback, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useConnection } from "wagmi";

import { Button } from "@/components/ui";
import { DepositSuccess } from "../../common/DepositSuccess";
import { DepositActions } from "../../common/DepositActions";
import { TokenAddressSection } from "./TokenAddressSection";
import { Erc20AmountSection } from "./Erc20AmountSection";
import { Erc20OptionsSection } from "./Erc20OptionsSection";
import { RecipientSection } from "../../common/RecipientSection";
import { useDepositErc20 } from "@/hooks/useDepositErc20";
import { useERC20 } from "@/hooks/useERC20";
import { ALLOCATORS, RESET_PERIODS } from "@/lib/constants";

export function DepositErc20() {
  const { isConnected } = useConnection();
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
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
    rawBalance: tokenBalance,
    symbol: tokenSymbol,
  } = useERC20(tokenAddress);

  const { deposit, approve, isPending } = useDepositErc20({
    onSuccess: (lockId) => {
      setLastLockId(lockId);
    },
  });

  const tokenDecimals = decimals ?? 18;

  const formattedBalance = useMemo(() => {
    if (!tokenBalance || !tokenSymbol) return "";
    return `${formatUnits(tokenBalance, tokenDecimals)} ${tokenSymbol}`;
  }, [tokenBalance, tokenSymbol, tokenDecimals]);

  const handleMaxAmount = useCallback(() => {
    if (tokenBalance) {
      return formatUnits(tokenBalance, tokenDecimals);
    }
    return "0";
  }, [tokenBalance, tokenDecimals]);

  const needsApproval = useMemo(() => {
    if (!tokenAddress || !amount || !isValid || isLoadingToken) return false;
    if (!rawAllowance) return true;

    const parsedAmount = parseUnits(amount, tokenDecimals);
    return rawAllowance < parsedAmount;
  }, [tokenAddress, amount, rawAllowance, isValid, isLoadingToken, tokenDecimals]);

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

  const formState =
    isLoadingToken && !isValid ? "loading" : !isValid ? "invalid" : "valid";

  const handleDeposit = useCallback(() => {
    deposit({
      amount,
      tokenAddress,
      resetPeriod,
      scope,
      allocatorId,
      recipient,
      decimals: tokenDecimals,
    });
  }, [deposit, amount, tokenAddress, resetPeriod, scope, allocatorId, recipient, tokenDecimals]);

  const handleApprove = useCallback(() => {
    if (!tokenAddress || !amount) return;
    approve({
      tokenAddress,
      amount,
      decimals: tokenDecimals,
    });
  }, [approve, tokenAddress, amount, tokenDecimals]);

  return (
    <div className="p-4 space-y-5">
      <TokenAddressSection
        tokenAddress={tokenAddress}
        onTokenAddressChange={setTokenAddress}
      />

      <Erc20AmountSection
        amount={amount}
        formattedBalance={formattedBalance}
        onAmountChange={setAmount}
        onMaxClick={() => setAmount(handleMaxAmount())}
      />

      <Erc20OptionsSection
        allocatorId={allocatorId}
        resetPeriod={resetPeriod}
        scope={scope}
        allocatorOptions={allocatorOptions}
        resetPeriodOptions={resetPeriodOptions}
        onAllocatorChange={setAllocatorId}
        onResetPeriodChange={setResetPeriod}
        onScopeChange={setScope}
      />

      <RecipientSection
        recipient={recipient}
        onRecipientChange={setRecipient}
      />

      {formState === "loading" && (
        <Button disabled className="h-11 text-base font-semibold">
          Loading token info...
        </Button>
      )}

      {formState === "invalid" && (
        <Button
          disabled
          className="h-11 text-base font-semibold bg-destructive/10 text-destructive"
        >
          Invalid Token Address
        </Button>
      )}

      {formState === "valid" && (
        <>
          <DepositActions
            isConnected={isConnected}
            isPending={isPending}
            amount={amount}
            needsApproval={needsApproval}
            onDeposit={handleDeposit}
            onApprove={handleApprove}
          />

          {lastLockId && <DepositSuccess lockId={lastLockId} />}
        </>
      )}
    </div>
  );
}
