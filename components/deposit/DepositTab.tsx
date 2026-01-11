"use client";

import { Coins } from "lucide-react";
import { useState } from "react";
import { Card, CardHeader } from "@/components/ui";
import { cn } from "@/lib/utils";
import { DepositNative } from "./native/DepositNative";
import { DepositErc20 } from "./erc20/DepositErc20";


export default function DepositForm() {
  const [depositType, setDepositType] = useState<"native" | "erc20">("native");

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
