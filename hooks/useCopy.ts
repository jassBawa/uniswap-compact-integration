import { useState, useCallback } from "react";
import { copyToClipboard } from "../lib/utils";

/**
 * Hook for copying text to clipboard
 */
export function useCopy() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    return success;
  }, []);

  return [copied, copy] as const;
}
