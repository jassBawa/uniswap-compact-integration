"use client";

import { toast } from "sonner";

type ToastStatus = "success" | "error" | "info" | "warning" | "loading";

export function useToast() {
    const showToast = (type: ToastStatus, message: string, txHash?: string) => {
        const toastMethods = toast as unknown as Record<ToastStatus, (msg: string, opts?: Record<string, unknown>) => number | string>;

        const options: Record<string, unknown> = {};

        if (txHash) {
            options.action = {
                label: "View",
                onClick: () => window.open(`https://sepolia.etherscan.io/tx/${txHash}`, "_blank"),
            };
        }

        // Only set duration for non-loading toasts
        if (type !== 'loading') {
            options.duration = 5000;
        }

        return toastMethods[type](message, options);
    };

    const dismissToast = (id?: number | string) => {
        if (id !== undefined && id !== null) {
            toast.dismiss(id);
        } else {
            toast.dismiss();
        }
    };

    const dismissAll = () => {
        toast.dismiss();
    };

    return {
        toasts: [],
        showToast,
        dismissToast,
        dismissAll,
    };
}
