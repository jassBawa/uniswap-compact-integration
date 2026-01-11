"use client";

import { Input } from "@/components/ui";

interface MandateSectionProps {
  hasMandate: boolean;
  witnessArgument: bigint;
  onHasMandateChange: (value: boolean) => void;
  onWitnessArgumentChange: (value: bigint) => void;
}

export function MandateSection({
  hasMandate,
  witnessArgument,
  onHasMandateChange,
  onWitnessArgumentChange,
}: MandateSectionProps) {
  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="hasMandate"
          checked={hasMandate}
          onChange={(e) => onHasMandateChange(e.target.checked)}
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
            onChange={(e) => onWitnessArgumentChange(BigInt(e.target.value))}
            placeholder="0"
            className="font-mono"
          />
        </div>
      )}
    </div>
  );
}
