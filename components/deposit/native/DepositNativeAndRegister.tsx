"use client";

import { Link } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { parseUnits } from "viem";
import { useConnection } from "wagmi";

import { Button } from "@/components/ui";
import { DepositSuccess } from "../../common/DepositSuccess";
import {
  useDepositNativeAndRegister,
  computeLockTag,
  COMPACT_TYPEHASH,
  getClaimHash,
  CompactData,
} from "@/hooks/useDepositNativeAndRegister";
import { useMaxAmount } from "@/hooks/useMaxAmount";
import { ALLOCATORS, RESET_PERIODS } from "@/lib/constants";
import { CompactParametersSection } from "../../common/compact/CompactParametersSection";
import { ComputedValuesSection } from "../../common/ComputedValuesSection";
import { DepositAmountSection } from "../../common/DepositAmountSection";
import { DepositOptionsSection } from "../../common/DepositOptionsSection";
import { RecipientSection } from "../../common/RecipientSection";

export function DepositNativeAndRegister() {
  const { isConnected, address } = useConnection();
  const [amount, setAmount] = useState("");
  const [resetPeriod, setResetPeriod] = useState<bigint>(2n);
  const [scope, setScope] = useState<bigint>(0n);
  const [allocatorId, setAllocatorId] = useState<bigint>(ALLOCATORS[0].value);
  const [recipient, setRecipient] = useState("");
  const [arbiter, setArbiter] = useState("");
  const [sponsor, setSponsor] = useState("");
  const [nonce, setNonce] = useState<bigint>(0n);
  const [expires, setExpires] = useState<bigint>(
    BigInt(Math.floor(Date.now() / 1000) + 600)
  );
  const [lastLockId, setLastLockId] = useState<string | null>(null);

  const { deposit, isPending, ethBalance } = useDepositNativeAndRegister({
    onSuccess: (lockId) => {
      setLastLockId(lockId);
    },
  });

  const { handleMax, formattedBalance } = useMaxAmount(ethBalance);

  // Compute lockTag as bigint
  const lockTag = useMemo(
    () => computeLockTag(allocatorId, scope, resetPeriod),
    [allocatorId, scope, resetPeriod]
  );

  // Compute claimHash from compact data
  const claimHash = useMemo(() => {
    if (!address || !amount || !arbiter || !sponsor) return "";

    const compactData: CompactData = {
      arbiter: arbiter as `0x${string}`,
      sponsor: sponsor as `0x${string}`,
      nonce,
      expires,
      lockTag,
      token: 0n,
      amount: parseUnits(amount, 18),
    };

    return getClaimHash(compactData);
  }, [address, amount, arbiter, sponsor, nonce, expires, lockTag]);

  const resetPeriodOptions = useMemo(
    () =>
      Object.entries(RESET_PERIODS).map(([value, { name }]) => ({
        value: BigInt(value),
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
      resetPeriod,
      scope,
      allocatorId,
      recipient,
      claimHash,
      typehash: COMPACT_TYPEHASH,
    });
  }, [
    deposit,
    amount,
    resetPeriod,
    scope,
    allocatorId,
    recipient,
    claimHash,
  ]);

  const isFormValid =
    isConnected && !isPending && amount && claimHash && arbiter && sponsor;

  return (
    <div className="mt-8 p-2 px-6 space-y-5">
      <DepositAmountSection
        amount={amount}
        ethBalance={ethBalance}
        onAmountChange={setAmount}
        onMaxClick={() => setAmount(handleMax())}
        formattedBalance={formattedBalance}
      />

      <DepositOptionsSection
        allocatorId={allocatorId}
        resetPeriod={resetPeriod}
        scope={scope}
        allocatorOptions={allocatorOptions}
        resetPeriodOptions={resetPeriodOptions}
        onAllocatorIdChange={setAllocatorId}
        onResetPeriodChange={setResetPeriod}
        onScopeChange={setScope}
      />

      <RecipientSection
        recipient={recipient}
        onRecipientChange={setRecipient}
      />

      <CompactParametersSection
        arbiter={arbiter}
        sponsor={sponsor}
        nonce={nonce}
        expires={expires}
        onArbiterChange={setArbiter}
        onSponsorChange={setSponsor}
        onNonceChange={setNonce}
        onExpiresChange={setExpires}
        connectedAddress={address}
      />

      <ComputedValuesSection
        lockTag={lockTag}
        claimHash={claimHash}
        typehash={COMPACT_TYPEHASH}
      />

      <Button
        onClick={handleDeposit}
        disabled={!isFormValid}
        loading={isPending}
        className="h-11 text-base font-semibold shadow-sm hover:shadow-md transition-all"
        size="lg"
      >
        <Link className="w-5 h-5" />
        {isPending
          ? "Confirming..."
          : !isConnected
          ? "Connect Wallet"
          : "Deposit & Register"}
      </Button>

      {lastLockId && <DepositSuccess lockId={lastLockId} />}
    </div>
  );
}
