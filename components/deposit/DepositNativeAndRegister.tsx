"use client";

import { Link } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { keccak256, parseUnits, toBytes } from "viem";
import { useConnection } from "wagmi";

import { Button, Dropdown, Input } from "@/components/ui";
import { DepositSuccess } from "./DepositSuccess";
import { useDepositNativeAndRegister } from "@/hooks/useDepositNativeAndRegister";
import { useMaxAmount } from "@/hooks/useMaxAmount";
import { ALLOCATORS, RESET_PERIODS } from "@/lib/constants";
import { Address, hashStruct, Hex } from "viem";

const COMPACT_TYPEHASH = keccak256(
  toBytes(
    "Compact(address arbiter,address sponsor,uint256 nonce,uint256 expires,bytes12 lockTag,address token,uint256 amount)"
  )
);

// Internal lockTag computation as bigint
function computeLockTag(allocatorId: bigint, scope: bigint, resetPeriod: bigint): bigint {
  return (scope << 95n) | (resetPeriod << 92n) | allocatorId;
}

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
  const [expires, setExpires] = useState<bigint>(BigInt(Math.floor(Date.now() / 1000) + 600));
  const [lastLockId, setLastLockId] = useState<string | null>(null);

  const { deposit, isPending, ethBalance } = useDepositNativeAndRegister({
    onSuccess: (lockId) => {
      setLastLockId(lockId);
    },
  });

  const { handleMax, formattedBalance } = useMaxAmount(ethBalance);

  // Compute lockTag as bigint internally
  const lockTag = useMemo(() =>
    computeLockTag(allocatorId, scope, resetPeriod),
    [allocatorId, scope, resetPeriod]
  );

  // Compute claimHash from compact data
  const claimHash = useMemo(() => {
    if (!address || !amount || !arbiter || !sponsor) return "";

    const parsedAmount = parseUnits(amount, 18);
    const compactData = {
      arbiter: arbiter as Address,
      sponsor: sponsor as Address,
      nonce,
      expires,
      lockTag: lockTag,
      token: 0n, // native token
      amount: parsedAmount,
    };

    return getClaimHash(compactData);
  }, [address, amount, arbiter, sponsor, nonce, expires, lockTag]);

  // Typehash is constant for Compact type
  const computedTypehash = COMPACT_TYPEHASH;

  const resetPeriodOptions = useMemo(() =>
    Object.entries(RESET_PERIODS).map(([value, { name }]) => ({
      value: BigInt(value),
      label: name,
    })), []);

  const allocatorOptions = useMemo(() =>
    ALLOCATORS.map(({ value, label }) => ({
      value: value.toString(),
      label,
    })), []);

  const handleDeposit = useCallback(() => {
    deposit({
      amount,
      resetPeriod,
      scope,
      allocatorId,
      recipient,
      claimHash,
      typehash: computedTypehash,
    });
  }, [deposit, amount, resetPeriod, scope, allocatorId, recipient, claimHash, computedTypehash]);

  return (
      <div className="mt-8 p-2 px-6 space-y-5">
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

        <div className="space-y-1.5">
          <label htmlFor="arbiter" className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5">
            Arbiter
            <span className="text-muted-foreground font-normal">(address)</span>
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
          <label htmlFor="sponsor" className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5">
            Sponsor
            <span className="text-muted-foreground font-normal">(address)</span>
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

        <div className="space-y-1.5">
          <label htmlFor="nonce" className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5">
            Nonce
            <span className="text-muted-foreground font-normal">(uint256)</span>
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
          <label htmlFor="expires" className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5">
            Expires
            <span className="text-muted-foreground font-normal">(timestamp)</span>
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

        <div className="space-y-1.5">
          <label htmlFor="claimHash" className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5">
            Claim Hash
            <span className="text-muted-foreground font-normal">(computed)</span>
          </label>
          <Input
            id="claimHash"
            type="text"
            value={claimHash}
            readOnly
            placeholder="0x..."
            className="font-mono bg-secondary/30"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="typehash" className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5">
            Typehash
            <span className="text-muted-foreground font-normal">(computed)</span>
          </label>
          <Input
            id="typehash"
            type="text"
            value={computedTypehash}
            readOnly
            placeholder="0x..."
            className="font-mono bg-secondary/30"
          />
        </div>

        <Button
          onClick={handleDeposit}
          disabled={!isConnected || isPending || !amount || !claimHash || !arbiter || !sponsor}
          loading={isPending}
          className="h-11 text-base font-semibold shadow-sm hover:shadow-md transition-all"
          size="lg"
        >
          <Link className="w-5 h-5" />
          {!isConnected ? "Connect Wallet" : isPending ? "Confirming..." : "Deposit & Register"}
        </Button>

        {lastLockId && <DepositSuccess lockId={lastLockId} />}
      </div>
  );
}




function getClaimHash(message: CompactData) {
  // Convert lockTag bigint to bytes12 hex string and token bigint to address
  const messageWithFormattedData = {
    ...message,
    lockTag: `0x${message.lockTag.toString(16).padStart(24, '0')}` as Hex,
    token: typeof message.token === 'bigint' 
      ? `0x${message.token.toString(16).padStart(40, '0')}` as Address
      : message.token,
  };
  
  return hashStruct({
    types: getTypes(message),
    primaryType: "Compact",
    data: messageWithFormattedData,
  });
}



type CompactData = {
  arbiter: Address;
  sponsor: Address;
  nonce: bigint;
  expires: bigint;
  id?: bigint;
  lockTag: bigint;
  token: Address | bigint;
  amount: bigint;
  mandate?: {
    witnessArgument: bigint;
  };
};

function getTypes(message: CompactData) {
  return {
    Compact: [
      { name: "arbiter", type: "address" },
      { name: "sponsor", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "expires", type: "uint256" },
      { name: "lockTag", type: "bytes12" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      ...(message.mandate ? [{ name: "mandate", type: "Mandate" }] : []),
    ],
    ...(message.mandate
      ? { Mandate: [{ name: "witnessArgument", type: "uint256" }] }
      : {}),
  };
}