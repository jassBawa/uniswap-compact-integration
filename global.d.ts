/// <reference types="next" />
/// <reference types="next/image-types/global" />

interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, handler: (...args: any[]) => void) => void;
    removeAllListeners: (event: string) => void;
    isMetaMask?: boolean;
  };
}

declare module '*.json' {
  const value: any;
  export default value;
}
