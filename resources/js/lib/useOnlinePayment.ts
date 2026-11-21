import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { OnlinePayment } from "@/types/models";

/**
 * Follow an online payment until it settles: polls every 3 seconds while it is
 * pending (each check also asks M-PESA/the card provider on the server).
 */
export function useOnlinePayment(initial: OnlinePayment | null, onSettled?: (p: OnlinePayment) => void) {
  const [payment, setPayment] = useState<OnlinePayment | null>(initial);
  const [tracked, setTracked] = useState(initial);
  // Start over when the caller passes a different payment.
  if (initial !== tracked) {
    setTracked(initial);
    setPayment(initial);
  }

  const id = payment?.id;
  const pending = payment?.status === "pending";
  useEffect(() => {
    if (!id || !pending) return;
    let live = true;
    const timer = setInterval(async () => {
      try {
        const { data } = await api<{ data: OnlinePayment }>(`/api/online-payments/${id}`);
        if (!live) return;
        setPayment(data);
        if (data.status !== "pending") onSettled?.(data);
      } catch {
        // Keep polling through a blip; the server-side reconcile job settles it regardless.
      }
    }, 3000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [id, pending, onSettled]);

  return payment;
}
