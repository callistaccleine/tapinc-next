"use client";

import Signup from "@/components/Signup";
import { Suspense } from "react";

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading Signup...</div>}>
      <Signup />
    </Suspense>
  );
}
