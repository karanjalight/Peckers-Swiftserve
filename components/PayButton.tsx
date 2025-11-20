"use client";
// import usePaystack from "@/hooks/usePaystack";
import usePaystack from "@/app/hooks/usePaystack";

interface PayButtonProps {
  email: string;
  amount: number;
}

export default function PayButton({ email, amount }: PayButtonProps) {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string;
  const { initializePayment } = usePaystack(publicKey);

  const handlePay = () => {
    const onSuccess = async (response: { reference: string }) => {
      console.log("✅ Payment successful:", response.reference);
      await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: response.reference }),
      });
    };

    const onClose = () => {
      console.log("❌ Payment popup closed");
    };

    initializePayment(
      {
        email,
        amount: amount * 100,
        currency: "KES",
      },
      onSuccess,
      onClose
    );
  };

  return (
    <button
      onClick={handlePay}
      className="px-4 py-2 bg-green-600 text-white rounded-lg"
    >
      Pay with Paystack
    </button>
  );
}
