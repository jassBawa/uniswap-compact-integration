'use client';

import { useState, useCallback } from 'react';
import { Button } from './Button';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex space-x-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </div>
  );
}

interface TabButtonProps {
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ tab, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
        ${isActive 
          ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
        }
      `}
    >
      {tab.label}
    </button>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = useCallback(async () => {
    if (!text) return;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [text]);
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-6 px-2 text-xs"
    >
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
}

export function MaxButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="h-8 px-3 text-xs font-mono text-zinc-400 hover:text-zinc-100"
    >
      MAX
    </Button>
  );
}

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  return (
    <svg className={`animate-spin ${sizes[size]} text-emerald-500`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-xs text-zinc-400 hover:text-emerald-400 transition-colors"
    >
      {children}
      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}
