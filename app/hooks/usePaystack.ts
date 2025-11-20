"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    PaystackPop?: any;
  }
}

interface PaystackConfig {
  email: string;
  amount: number;
  currency?: string;
  reference?: string;
}

type SuccessCallback = (response: { reference: string }) => void;
type CloseCallback = () => void;

export default function usePaystack(publicKey: string | undefined) {
  useEffect(() => {
    if (typeof window !== "undefined" && !window.PaystackPop) {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const initializePayment = (
    config: PaystackConfig,
    onSuccess: SuccessCallback,
    onClose: CloseCallback
  ) => {
    if (typeof window === "undefined") {
      console.error("❌ Cannot initialize payment on server");
      return;
    }

    if (!window.PaystackPop) {
      alert("Paystack script not loaded yet. Please wait a moment.");
      return;
    }

    if (typeof onSuccess !== "function" || typeof onClose !== "function") {
      console.error("❌ Paystack callbacks must be valid functions");
      return;
    }

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: config.email,
      amount: config.amount,
      currency: config.currency || "KES",
      ref: config.reference || `${Date.now()}`,
      callback: (response: { reference: string }) => {
        onSuccess(response);
      },
      onClose: () => {
        onClose();
      },
    });

    handler.openIframe();
  };

  return { initializePayment };
}
