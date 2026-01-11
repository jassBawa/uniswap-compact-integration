"use client";

import { Input } from "@/components/ui";

interface RecipientSectionProps {
  recipient: string;
  onRecipientChange: (value: string) => void;
}

export function RecipientSection({
  recipient,
  onRecipientChange,
}: RecipientSectionProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor="recipient"
        className="text-xs font-medium text-muted-foreground ml-0.5 flex items-center gap-1.5"
      >
        Recipient
        <span className="text-muted-foreground font-normal">(optional)</span>
      </label>
      <Input
        id="recipient"
        type="text"
        value={recipient}
        onChange={(e) => onRecipientChange(e.target.value)}
        placeholder="Leave empty for self"
        className="font-mono"
      />
    </div>
  );
}
