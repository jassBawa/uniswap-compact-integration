'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'neutral', size = 'sm' }: BadgeProps) {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    neutral: 'bg-zinc-700/50 text-zinc-400 border-zinc-700'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };
  
  return (
    <span className={`
      inline-flex items-center font-mono rounded-full border
      ${variants[variant]}
      ${sizes[size]}
    `}>
      {children}
    </span>
  );
}

export function StatusDot({ status }: { status: 'online' | 'offline' | 'pending' | 'error' }) {
  const colors = {
    online: 'bg-emerald-500',
    offline: 'bg-zinc-500',
    pending: 'bg-amber-500',
    error: 'bg-red-500'
  };
  
  const sizes = {
    online: 'bg-emerald-500 shadow-lg shadow-emerald-500/50',
    offline: 'bg-zinc-500',
    pending: 'bg-amber-500 animate-pulse',
    error: 'bg-red-500'
  };
  
  return (
    <span className={`
      inline-block w-2 h-2 rounded-full
      ${sizes[status]}
    `} />
  );
}
