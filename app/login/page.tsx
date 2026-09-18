"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../register/register.css";

function responseMessage(payload: unknown, fallback: string) {
  return typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
    ? payload.error
    : fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const trimmed = identifier.trim();
      const body: { email?: string; teamId?: string; password: string } = { password };
      if (trimmed.includes("@")) {
        body.email = trimmed;
      } else {
        body.teamId = trimmed.toUpperCase();
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(responseMessage(payload, "Sign in failed. Check your credentials and try again."));
      }

      const role = (payload as { user?: { role?: string } })?.user?.role;
      if (role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/payment");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign in failed. Check your credentials.");
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <section className="register-card" style={{ maxWidth: "540px" }}>
        <div className="register-heading">
          <div>
            <span className="register-kicker">FARLANDS // TEAM PORTAL</span>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 2.8rem)" }}>Sign in to your team.</h1>
            <p>Access your registration to upload payment receipts, track verification status, or manage your team.</p>
          </div>
          <button type="button" className="register-back" onClick={() => router.push("/")}>
            ← Back
          </button>
        </div>

        {message && (
          <p className="register-message" role="alert">
            {message}
          </p>
        )}

        <form onSubmit={submit}>
          <label>
            Team ID or Leader Email
            <input
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. FL26-A8K2M9 or leader@example.com"
              autoComplete="username"
            />
          </label>

          <label style={{ marginTop: "16px" }}>
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your account password"
              autoComplete="current-password"
            />
          </label>

          <button className="register-pay" style={{ marginTop: "24px" }} disabled={loading}>
            {loading ? "Signing in…" : "Sign In to Payment Portal"}
          </button>

          <div style={{ marginTop: "20px", textAlign: "center", fontSize: "0.9rem", color: "#a9bca5" }}>
            Don&apos;t have a team yet?{" "}
            <Link href="/register" style={{ color: "#a5df7a", fontWeight: "bold", textDecoration: "none" }}>
              Register here
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
