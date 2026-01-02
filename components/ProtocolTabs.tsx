'use client';


import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DepositTab from './DepositTab';
import { ClaimTab } from './ClaimTab';
import { WithdrawTab } from './WithdrawTab';

const TABS = [
  { id: 'deposit', label: 'Deposit' },
  { id: 'withdraw', label: 'Withdraw' },
  { id: 'claim', label: 'Claim' },
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
          <TabsContent value="withdraw">
            <WithdrawTab />
          </TabsContent>
          <TabsContent value="claim">
            <ClaimTab />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}
