"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui";
import DepositTab from "./deposit/DepositTab";
import { DepositNativeAndRegister } from "./deposit/native/DepositNativeAndRegister";
import { ProtocolClaimTab } from "./claim/ProtocolClaimTab";
import { WithdrawTab } from "./withdraw/WithdrawTab";

const TABS = [
  { id: "deposit", label: "Deposit" },
  { id: "deposit-register", label: "Deposit & Register" },
  { id: "withdraw", label: "Withdraw" },
  { id: "protocol-claim", label: "Protocol Claim" },
];

export function ProtocolTabs() {
  return (
    <Tabs defaultValue="deposit" className="w-full">
      <div className="bg-card border border-border/60 rounded-2xl shadow-lg backdrop-blur-xl overflow-hidden">
        <div className="p-1">
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <TabsContent value="deposit">
            <DepositTab />
          </TabsContent>
          <TabsContent value="deposit-register">
            <DepositNativeAndRegister />
          </TabsContent>
          <TabsContent value="withdraw">
            <WithdrawTab />
          </TabsContent>
          <TabsContent value="protocol-claim">
            <ProtocolClaimTab />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}
