"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { loadRazorpayScript } from "@/lib/razorpay/types";

type CheckoutButtonProps = {
  planId: string;
  planName: string;
  razorpayKeyId: string;
  userEmail?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
};

export function CheckoutButton({
  planId,
  planName,
  razorpayKeyId,
  userEmail,
  onSuccess,
  onError,
  children,
  className,
  variant = "default",
  size = "default",
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    loadRazorpayScript().then(setScriptLoaded);
  }, []);

  const handleCheckout = useCallback(async () => {
    if (!scriptLoaded) {
      onError?.("Payment system is loading. Please try again.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create subscription");
      }

      const { subscriptionId } = await response.json();

      const options = {
        key: razorpayKeyId,
        subscription_id: subscriptionId,
        name: "Mentorship",
        description: `${planName} Subscription`,
        prefill: userEmail ? { email: userEmail } : undefined,
        handler: () => {
          onSuccess?.();
          window.location.href = "/dashboard";
        },
        theme: {
          color: "#000000",
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      onError?.(message);
      setIsLoading(false);
    }
  }, [planId, planName, razorpayKeyId, scriptLoaded, onSuccess, onError]);

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading || !scriptLoaded}
      className={className}
      variant={variant}
      size={size}
    >
      {isLoading ? "Processing..." : children || "Subscribe"}
    </Button>
  );
}
