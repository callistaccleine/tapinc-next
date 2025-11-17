"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ProcessResponse = {
  status: string | null;
  subscriptionUpdated: boolean;
  planName: string | null;
  planCategory: string | null;
  customerEmail: string | null;
};

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const [state, setState] = useState<ProcessResponse>({
    status: null,
    subscriptionUpdated: false,
    planName: null,
    planCategory: null,
    customerEmail: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing checkout session.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/process-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to process checkout");
        }

        setState({
          status: data.status ?? null,
          subscriptionUpdated: Boolean(data.subscriptionUpdated),
          planName: data.planName ?? null,
          planCategory: data.planCategory ?? null,
          customerEmail: data.customerEmail ?? null,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  const heading =
    state.subscriptionUpdated && state.planName
      ? `You're now on the ${state.planName} plan`
      : "Thanks for your purchase!";

  const description = state.subscriptionUpdated
    ? "You can now create additional profiles from your dashboard."
    : "Your order was received successfully. We'll keep you posted via email.";

  return (
    <section style={{ padding: "3rem 1rem", maxWidth: 640, margin: "0 auto" }}>
      {loading ? (
        <p>Confirming your purchase...</p>
      ) : error ? (
        <div>
          <h2>We hit a snag</h2>
          <p>{error}</p>
        </div>
      ) : (
        <div>
          <h2>{heading}</h2>
          <p>{description}</p>
          {state.customerEmail && (
            <p>
              A receipt was sent to <strong>{state.customerEmail}</strong>.
            </p>
          )}
          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: 999,
                border: "none",
                background: "black",
                color: "white",
                cursor: "pointer",
              }}
            >
              Go to dashboard
            </button>
            <button
              type="button"
              onClick={() => router.push("/support")}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: 999,
                border: "1px solid #ccc",
                background: "white",
                cursor: "pointer",
              }}
            >
              Need help?
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
