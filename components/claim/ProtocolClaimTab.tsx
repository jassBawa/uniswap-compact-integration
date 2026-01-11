"use client";

import { Link } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { parseUnits } from "viem";
import { useConnection } from "wagmi";

import { Button } from "@/components/ui";
import {
  useProtocolClaim,
  computeLockTag,
} from "@/hooks/useProtocolClaim";
import { ALLOCATORS, RESET_PERIODS } from "@/lib/constants";
import { ClaimantSection } from "./ClaimantSection";
import { MandateSection } from "./MandateSection";
import { CompactParametersSection } from "../common/compact/CompactParametersSection";
import { DepositDetailsSection } from "../common/compact/DepositDetailsSection";

export function ProtocolClaimTab() {
  const { isConnected, address } = useConnection();

  // Deposit details
  const [id, setId] = useState("");
  const [amount, setAmount] = useState("");
  const [resetPeriod, setResetPeriod] = useState<bigint>(2n);
  const [scope, setScope] = useState<bigint>(0n);
  const [allocatorId, setAllocatorId] = useState<bigint>(ALLOCATORS[0].value);

  // Compact parameters
  const [arbiter, setArbiter] = useState("");
  const [sponsor, setSponsor] = useState("");
  const [nonce, setNonce] = useState<bigint>(0n);
  const [expires, setExpires] = useState<bigint>(
    BigInt(Math.floor(Date.now() / 1000) + 3600)
  );

  // Optional mandate
  const [hasMandate, setHasMandate] = useState(false);
  const [witnessArgument, setWitnessArgument] = useState<bigint>(0n);

  // Claimant
  const [claimant, setClaimant] = useState("");
  const [claimantAmount, setClaimantAmount] = useState("");

  const { claim, isPending, hash } = useProtocolClaim();

  // Compute lockTag using shared helper
  const lockTag = useMemo(
    () => computeLockTag(allocatorId, scope, resetPeriod),
    [allocatorId, scope, resetPeriod]
  );

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

  const handleClaim = useCallback(async () => {
    if (
      !address ||
      !id ||
      !amount ||
      !arbiter ||
      !sponsor ||
      !claimant ||
      !claimantAmount
    )
      return;

    claim({
      id: BigInt(id),
      amount: parseUnits(amount, 18),
      allocatorId,
      resetPeriod,
      scope,
      arbiter: arbiter as `0x${string}`,
      sponsor: sponsor as `0x${string}`,
      nonce,
      expires,
      witnessArgument: hasMandate ? witnessArgument : undefined,
      claimant: claimant as `0x${string}`,
      claimantAmount: parseUnits(claimantAmount, 18),
    });
  }, [
    address,
    id,
    amount,
    allocatorId,
    resetPeriod,
    scope,
    arbiter,
    sponsor,
    nonce,
    expires,
    hasMandate,
    witnessArgument,
    claimant,
    claimantAmount,
    claim,
  ]);

  const isFormValid =
    isConnected &&
    !isPending &&
    id &&
    amount &&
    arbiter &&
    sponsor &&
    claimant &&
    claimantAmount;

  return (
    <div className="mt-8 p-2 px-6 space-y-6">
      <DepositDetailsSection
        id={id}
        amount={amount}
        resetPeriod={resetPeriod}
        scope={scope}
        allocatorId={allocatorId}
        onIdChange={setId}
        onAmountChange={setAmount}
        onResetPeriodChange={setResetPeriod}
        onScopeChange={setScope}
        onAllocatorIdChange={setAllocatorId}
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

      <MandateSection
        hasMandate={hasMandate}
        witnessArgument={witnessArgument}
        onHasMandateChange={setHasMandate}
        onWitnessArgumentChange={setWitnessArgument}
      />

      <ClaimantSection
        claimant={claimant}
        claimantAmount={claimantAmount}
        onClaimantChange={setClaimant}
        onClaimantAmountChange={setClaimantAmount}
        connectedAddress={address}
      />

      <Button
        onClick={handleClaim}
        disabled={!isFormValid}
        loading={isPending}
        className="h-11 text-base font-semibold shadow-sm hover:shadow-md transition-all w-full"
        size="lg"
      >
        <Link className="w-5 h-5" />
        {isPending ? "Confirming..." : "Submit Claim"}
      </Button>

      {hash && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <p className="text-sm text-emerald-600 font-medium">
            Transaction Submitted
          </p>
          <p className="text-xs font-mono text-emerald-600 mt-1">{hash}</p>
        </div>
      )}
    </div>
  );
}
