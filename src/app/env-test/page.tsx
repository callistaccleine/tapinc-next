"use client";

export default function EnvTestPage() {
  const envVars: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_DOMAIN: process.env.NEXT_PUBLIC_DOMAIN,
  };

  console.log("Environment variables (NEXT_PUBLIC_):", envVars);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Env Test</h1>
      <pre>{JSON.stringify(envVars, null, 2)}</pre>
    </div>
  );
}
