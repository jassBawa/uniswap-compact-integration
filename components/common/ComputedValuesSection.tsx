"use client";

import { Input } from "@/components/ui";

interface ComputedValuesSectionProps {
  lockTag: bigint;
  claimHash: string;
  typehash: string;
}

export function ComputedValuesSection({
  lockTag,
  claimHash,
  typehash,
}: ComputedValuesSectionProps) {
  return (
    <>
      <div className="p-3 bg-secondary/30 rounded-lg">
        <p className="text-xs text-muted-foreground">
          Lock Tag:{" "}
          <span className="font-mono text-foreground">
            0x{lockTag.toString(16).padStart(48, "0")}
          </span>
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="claimHash"
          className="text-xs font-medium text-muted-foreground ml-0.5"
        >
          Claim Hash (computed)
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
        <label
          htmlFor="typehash"
          className="text-xs font-medium text-muted-foreground ml-0.5"
        >
          Typehash (computed)
        </label>
        <Input
          id="typehash"
          type="text"
          value={typehash}
          readOnly
          placeholder="0x..."
          className="font-mono bg-secondary/30"
        />
      </div>
    </>
  );
}
