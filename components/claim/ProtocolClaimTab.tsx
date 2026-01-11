"use client";

import { Link, User } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { parseUnits } from "viem";
import { useConnection } from "wagmi";

import { Button, Dropdown, Input } from "@/components/ui";
import { useProtocolClaim } from "@/hooks/useProtocolClaim";
import { useMaxAmount } from "@/hooks/useMaxAmount";
import { ALLOCATORS, RESET_PERIODS } from "@/lib/constants";
import { Address } from "viem";

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

  const { claim, isPending, hash, isSuccess } = useProtocolClaim();
  const { handleMax, formattedBalance } = useMaxAmount(undefined);

  // Computed values
  const lockTag = useMemo(
    () => (scope << 95n) | (resetPeriod << 92n) | allocatorId,
    [scope, resetPeriod, allocatorId]
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
      arbiter: arbiter as Address,
      sponsor: sponsor as Address,
      nonce,
      expires,
      witnessArgument: hasMandate ? witnessArgument : undefined,
      claimant: claimant as Address,
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

  return (
    <div className="mt-8 p-2 px-6 space-y-6">
      {/* Deposit Details Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Deposit Details
        </h3>

        <div className="space-y-1.5">
          <label
            htmlFor="id"
            className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5"
          >
            ID (Lock ID)
          </label>
          <Input
            id="id"
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="0"
            className="font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="amount"
            className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5"
          >
            Amount (ETH)
          </label>
          <div className="relative">
            <Input
              id="amount"
              type="text"
              value={amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAmount(e.target.value)
              }
              placeholder="0.0"
              className="pr-14 text-lg font-medium"
            />
            <button
              type="button"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
              onClick={() => setAmount(handleMax())}
            >
              MAX
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground ml-0.5">
              Allocator
            </label>
            <Dropdown
              options={allocatorOptions}
              value={allocatorId.toString()}
              onChange={(v) => setAllocatorId(BigInt(v))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground ml-0.5">
              Reset Period
            </label>
            <Dropdown
              options={resetPeriodOptions}
              value={resetPeriod}
              onChange={(v) => setResetPeriod(v as bigint)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground ml-0.5">
            Scope
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/50 rounded-xl">
            <button
              type="button"
              onClick={() => setScope(0n)}
              className={
                "py-2 px-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap" +
                (scope === 0n
                  ? " bg-primary text-primary-foreground"
                  : " text-muted-foreground hover:text-foreground hover:bg-accent")
              }
            >
              Multichain
            </button>
            <button
              type="button"
              onClick={() => setScope(1n)}
              className={
                "py-2 px-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap" +
                (scope === 1n
                  ? " bg-primary text-primary-foreground"
                  : " text-muted-foreground hover:text-foreground hover:bg-accent")
              }
            >
              Chain-Specific
            </button>
          </div>
        </div>

        <div className="p-3 bg-secondary/30 rounded-lg">
          <p className="text-xs text-muted-foreground">
            Computed Lock Tag:{" "}
            <span className="font-mono text-foreground">
              0x{lockTag.toString(16).padStart(24, "0")}
            </span>
          </p>
        </div>
      </div>

      {/* Compact Parameters Section */}
      <div className="space-y-4 border-t border-border pt-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Compact Parameters
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="arbiter"
              className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5"
            >
              Arbiter
              {address && (
                <button
                  type="button"
                  onClick={() => setArbiter(address)}
                  className="text-xs text-emerald-600 hover:text-emerald-500"
                >
                  (use my address)
                </button>
              )}
            </label>
            <Input
              id="arbiter"
              type="text"
              value={arbiter}
              onChange={(e) => setArbiter(e.target.value)}
              placeholder="0x..."
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="sponsor"
              className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5"
            >
              Sponsor
              {address && (
                <button
                  type="button"
                  onClick={() => setSponsor(address)}
                  className="text-xs text-emerald-600 hover:text-emerald-500"
                >
                  (use my address)
                </button>
              )}
            </label>
            <Input
              id="sponsor"
              type="text"
              value={sponsor}
              onChange={(e) => setSponsor(e.target.value)}
              placeholder="0x..."
              className="font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="nonce"
              className="text-xs font-medium text-muted-foreground ml-0.5"
            >
              Nonce
            </label>
            <Input
              id="nonce"
              type="text"
              value={nonce.toString()}
              onChange={(e) => setNonce(BigInt(e.target.value))}
              placeholder="0"
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="expires"
              className="text-xs font-medium text-muted-foreground ml-0.5"
            >
              Expires (timestamp)
            </label>
            <Input
              id="expires"
              type="text"
              value={expires.toString()}
              onChange={(e) => setExpires(BigInt(e.target.value))}
              placeholder="Unix timestamp"
              className="font-mono"
            />
          </div>
        </div>
      </div>

      {/* Optional Mandate Section */}
      <div className="space-y-4 border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hasMandate"
            checked={hasMandate}
            onChange={(e) => setHasMandate(e.target.checked)}
            className="rounded border-border"
          />
          <label
            htmlFor="hasMandate"
            className="text-sm font-medium text-foreground"
          >
            Has Mandate (Witness)
          </label>
        </div>

        {hasMandate && (
          <div className="space-y-1.5">
            <label
              htmlFor="witnessArgument"
              className="text-xs font-medium text-muted-foreground ml-0.5"
            >
              Witness Argument
            </label>
            <Input
              id="witnessArgument"
              type="text"
              value={witnessArgument.toString()}
              onChange={(e) => setWitnessArgument(BigInt(e.target.value))}
              placeholder="0"
              className="font-mono"
            />
          </div>
        )}
      </div>

      {/* Claimant Section */}
      <div className="space-y-4 border-t border-border pt-4">
        <h3 className="text-sm font-medium text-muted-foreground">Claimant</h3>

        <div className="space-y-1.5">
          <label
            htmlFor="claimant"
            className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5"
          >
            Claimant Address
            {address && (
              <button
                type="button"
                onClick={() => setClaimant(address)}
                className="text-xs text-emerald-600 hover:text-emerald-500"
              >
                (use my address)
              </button>
            )}
          </label>
          <Input
            id="claimant"
            type="text"
            value={claimant}
            onChange={(e) => setClaimant(e.target.value)}
            placeholder="0x..."
            className="font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="claimantAmount"
            className="text-xs font-medium text-muted-foreground ml-0.5"
          >
            Claimant Amount (ETH)
          </label>
          <Input
            id="claimantAmount"
            type="text"
            value={claimantAmount}
            onChange={(e) => setClaimantAmount(e.target.value)}
            placeholder="0.0"
            className="font-mono"
          />
        </div>
      </div>

      <Button
        onClick={handleClaim}
        disabled={
          !isConnected ||
          isPending ||
          !id ||
          !amount ||
          !arbiter ||
          !sponsor ||
          !claimant ||
          !claimantAmount
        }
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
