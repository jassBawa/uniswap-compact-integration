"use client";

import { Coins } from "lucide-react";
import { useState } from "react";
import { Card, CardHeader } from "@/components/ui";
import { cn } from "@/lib/utils";
import { DepositNative } from "./DepositNative";
import { DepositNativeAndRegister } from "./DepositNativeAndRegister";
import { DepositErc20 } from "./DepositErc20";

interface DepositTabProps {
  mode?: "default" | "register";
}

export default function DepositForm({ mode = "default" }: DepositTabProps) {
  const [depositType, setDepositType] = useState<"native" | "erc20">("native");

  // In register mode, only show native deposit with registration
  if (mode === "register") {
    return (
      <Card className="">
        <CardHeader>
          <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl overflow-x-auto">
            <button
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-2 sm:px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                "bg-primary text-primary-foreground"
              )}
            >
              <Coins className="w-4 h-4" />
              Native (ETH)
            </button>
          </div>
        </CardHeader>
        <DepositNativeAndRegister />
      </Card>
    );
  }

  return (
    <Card className="">
      <CardHeader>
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl overflow-x-auto">
          <button
            onClick={() => setDepositType("native")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-2 sm:px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
              depositType === "native"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Coins className="w-4 h-4" />
            Native (ETH)
          </button>
          <button
            onClick={() => setDepositType("erc20")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-2 sm:px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
              depositType === "erc20"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Coins className="w-4 h-4" />
            ERC20 Token
          </button>
        </div>
      </CardHeader>

      {depositType === "native" ? <DepositNative /> : <DepositErc20 />}
    </Card>
  );
}
