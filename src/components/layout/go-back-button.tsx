"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function isInternalReferrer(): boolean {
  if (!document.referrer) return false;
  try {
    const referrerUrl = new URL(document.referrer);
    return referrerUrl.host === window.location.host;
  } catch {
    return false;
  }
}

export function GoBackButton({ fallback = "/dashboard" }: { fallback?: string }) {
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (isInternalReferrer()) {
      router.back();
    } else {
      router.push(fallback);
    }
  }, [router, fallback]);

  return (
    <Button variant="ghost" size="sm" onClick={handleBack}>
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
}
