"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage("Check your email to confirm your account.");
    setLoading(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else setMessage("Signed in!");
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-2 w-80 mx-auto mt-10">
      <input
        className="border p-2 rounded"
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-2 rounded"
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className="bg-blue-500 text-white p-2 rounded disabled:opacity-50"
        onClick={handleSignUp}
        disabled={loading}
      >
        Sign Up
      </button>
      <button
        className="bg-green-500 text-white p-2 rounded disabled:opacity-50"
        onClick={handleSignIn}
        disabled={loading}
      >
        Sign In
      </button>
      {message && <p className="mt-2 text-sm text-red-500">{message}</p>}
    </div>
  );
}
