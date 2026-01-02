'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { DepositTab } from './DepositTab';
import { ClaimTab } from './ClaimTab';
import { BalancesTab } from './BalancesTab';
import { WithdrawTab } from './WithdrawTab';

const TABS = [
  { id: 'deposit' as const, label: 'Deposit' },
  { id: 'withdraw' as const, label: 'Withdraw' },
  { id: 'claim' as const, label: 'Claim' },
  { id: 'balances' as const, label: 'Balances' },
];

type TabId = 'deposit' | 'withdraw' | 'claim' | 'balances';

export function ProtocolTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('deposit');

  const handleTabChange = (tabId: string) => {
    if (['deposit', 'withdraw', 'claim', 'balances'].includes(tabId)) {
      setActiveTab(tabId as TabId);
    }
  };

  return (
    <Card>
      <CardContent className="p-1">
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      </CardContent>

      <div className="px-6 pb-6">
        {activeTab === 'deposit' && <DepositTab />}
        {activeTab === 'withdraw' && <WithdrawTab />}
        {activeTab === 'claim' && <ClaimTab />}
        {activeTab === 'balances' && <BalancesTab />}
      </div>
    </Card>
  );
}
