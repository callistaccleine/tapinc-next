"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function ReturnPageContent() {
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
        <p>
          Thanks! A confirmation email was sent to {customerEmail}.<br />
          If you have any questions, please email{" "}
          <a href="mailto:tapinc.io.au@gmail.com">tapinc.io.au@gmail.com</a>.
        </p>
      </section>
    );

  return <p>Loading payment status...</p>;
}

export default function ReturnPage() {
  return (
    <Suspense fallback={<p>Loading page...</p>}>
      <ReturnPageContent />
    </Suspense>
  );
}
