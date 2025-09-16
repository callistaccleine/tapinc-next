"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ReturnPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState("");

  useEffect(() => {
    if (!sessionId) return;

    fetch(`/api/session-status?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.status);
        setCustomerEmail(data.customer_email);
      });
  }, [sessionId]);

  if (status === "open") return <p>Payment still in progress...</p>;
  if (status === "complete")
    return (
      <section>
        <p>✅ Thanks! A confirmation email was sent to {customerEmail}.</p>
      </section>
    );

  return <p>Loading payment status...</p>;
}
