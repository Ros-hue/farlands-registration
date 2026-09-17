"use client";

import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "./payment.css";

type PaymentStatus = "pending_verification" | "paid" | "payment_failed";
type PaymentData = {
  team: { id: string; teamId: string | null; teamName: string } | null;
  registration: { id: string; number: string; status: string; feeAmount: number; currency: string; confirmedAt: string | null };
  payment: { id: string; status: PaymentStatus; utrLastFour: string; submittedAt: string; reviewedAt: string | null; rejectionReason: string | null } | null;
  paymentInstructions: { upiId: string; qrPath: string };
};

function messageFrom(payload: unknown, fallback: string) {
  return typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : fallback;
}

function displayTime(value: string | null) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
}

export default function PaymentPage() {
  const router = useRouter();
  const [data, setData] = useState<PaymentData | null>(null);
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotInfo, setScreenshotInfo] = useState<{ name: string; sizeKb: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [qrMissing, setQrMissing] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/payments/status", { cache: "no-store" });
    if (response.status === 401) { router.replace("/login"); return; }
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) throw new Error(messageFrom(payload, "Your payment information could not be loaded."));
    setData(payload as PaymentData);
  }, [router]);

  useEffect(() => {
    let active = true;
    const initialLoad = window.setTimeout(() => {
      void load().catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "Your payment information could not be loaded."); }).finally(() => { if (active) setLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(initialLoad); };
  }, [load]);

  // Polling every 15s to reactively catch organizer verification
  useEffect(() => {
    const timer = window.setInterval(() => { void load().catch(() => undefined); }, 15_000);
    return () => window.clearInterval(timer);
  }, [load]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    };
  }, [screenshotPreview]);

  const amount = useMemo(() => data ? new Intl.NumberFormat("en-IN", { style: "currency", currency: data.registration.currency, maximumFractionDigits: 0 }).format(data.registration.feeAmount / 100) : "₹1,000", [data]);
  const canSubmit = !data?.payment || data.payment.status === "payment_failed";

  function selectScreenshot(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);

    if (!file) {
      setScreenshot(null);
      setScreenshotPreview(null);
      setScreenshotInfo(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Selected receipt image exceeds 5 MB. Please select a smaller screenshot.");
      setScreenshot(null);
      setScreenshotPreview(null);
      setScreenshotInfo(null);
      event.target.value = "";
      return;
    }

    setMessage(null);
    setScreenshot(file);
    setScreenshotInfo({ name: file.name, sizeKb: Math.round(file.size / 1024) });
    setScreenshotPreview(URL.createObjectURL(file));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!screenshot) { setMessage("Select your payment receipt / screenshot first."); return; }
    setSubmitting(true); setMessage(null);
    try {
      const form = new FormData();
      form.set("utr", utr);
      form.set("screenshot", screenshot);
      const response = await fetch("/api/payments/submit-proof", { method: "POST", body: form, cache: "no-store" });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFrom(payload, "Your payment receipt could not be submitted."));
      
      if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
      setUtr("");
      setScreenshot(null);
      setScreenshotPreview(null);
      setScreenshotInfo(null);
      setMessage("Payment receipt submitted successfully! The organizer will verify it shortly.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your payment receipt could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  function openUpiApp() {
    if (!data) return;
    const uri = new URL("upi://pay");
    uri.searchParams.set("pa", data.paymentInstructions.upiId);
    uri.searchParams.set("pn", "Farlands Hackathon");
    uri.searchParams.set("am", (data.registration.feeAmount / 100).toFixed(2));
    uri.searchParams.set("cu", data.registration.currency);
    uri.searchParams.set("tn", data.registration.number);
    window.location.assign(uri.toString());
  }

  async function viewProof() {
    if (!data?.payment) return;
    const response = await fetch(`/api/payments/proof/${data.payment.id}`, { cache: "no-store" });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok || typeof payload !== "object" || payload === null || !("url" in payload) || typeof payload.url !== "string") {
      setMessage(messageFrom(payload, "The uploaded screenshot is temporarily unavailable."));
      return;
    }
    window.open(payload.url, "_blank", "noopener,noreferrer");
  }

  if (loading) return <main className="payment-page"><p className="payment-loading">LOADING PAYMENT PORTAL…</p></main>;
  if (!data) return <main className="payment-page"><section className="payment-card payment-error"><h1>Payment portal unavailable</h1><p>{message ?? "Unable to load your payment information."}</p><Link href="/login">Return to sign in</Link></section></main>;
  const payment = data.payment;
  const paid = payment?.status === "paid" && data.registration.status === "confirmed";
  const pending = payment?.status === "pending_verification";

  return (
    <main className="payment-page">
      <section className="payment-card">
        <header className="payment-heading">
          <div>
            <span>FARLANDS // REGISTRATION PAYMENT</span>
            <h1>{paid ? "Payment verified." : pending ? "Under verification." : "Complete your payment."}</h1>
            <p>{paid ? "Your registration is confirmed! Your team is registered for Farlands 2026." : "Pay the registration fee using Google Pay or UPI, then enter your transaction ID (UTR) and upload the receipt screenshot for verification."}</p>
          </div>
          <Link href="/">← Back to Farlands</Link>
        </header>

        {message && <p className="payment-message" role="status">{message}</p>}

        <section className="payment-summary">
          {data.team && (
            <article>
              <span>TEAM NAME</span>
              <strong>{data.team.teamName}</strong>
            </article>
          )}
          {data.team?.teamId && (
            <article>
              <span>TEAM ID</span>
              <strong style={{ letterSpacing: "0.06em", color: "#a5df7a" }}>{data.team.teamId}</strong>
            </article>
          )}
          <article>
            <span>REGISTRATION NO.</span>
            <strong>{data.registration.number}</strong>
          </article>
          <article>
            <span>OFFICIAL FEE</span>
            <strong>{amount}</strong>
          </article>
          <article>
            <span>STATUS</span>
            <strong>
              {paid ? "CONFIRMED" : pending ? "UNDER VERIFICATION" : payment?.status === "payment_failed" ? "RESUBMISSION REQUIRED" : "PAYMENT PENDING"}
            </strong>
          </article>
        </section>

        {paid ? (
          <section className="payment-result success">
            <h2>✓ Registration Confirmed &amp; Payment Verified</h2>
            <p>
              Verified on {displayTime(payment?.reviewedAt ?? data.registration.confirmedAt)}. Your payment reference ends in <b>{payment?.utrLastFour}</b>.
            </p>
            <button type="button" className="payment-secondary" onClick={() => void viewProof()}>
              View verified receipt
            </button>
          </section>
        ) : pending ? (
          <section className="payment-result pending">
            <h2>Payment receipt submitted for verification</h2>
            <p>
              Your receipt was submitted on {displayTime(payment?.submittedAt ?? null)} (Ref ends in <b>{payment?.utrLastFour}</b>) and is currently awaiting organizer verification.
            </p>
            <p style={{ marginTop: "8px", fontSize: "0.9rem", color: "#a9bca5" }}>
              The status on this page will automatically refresh once the organizer reviews your payment.
            </p>
            <button type="button" className="payment-secondary" onClick={() => void viewProof()}>
              View my submitted receipt
            </button>
          </section>
        ) : (
          <>
            {payment?.status === "payment_failed" && (
              <section className="payment-result rejected">
                <h2>Payment could not be verified</h2>
                <p>{payment.rejectionReason ?? "Please check the transaction details and submit a replacement receipt."}</p>
                <button type="button" className="payment-secondary" onClick={() => void viewProof()} style={{ marginTop: "12px" }}>
                  View previous receipt
                </button>
              </section>
            )}

            <section className="payment-method">
              <div className="payment-qr-wrap">
                {!qrMissing ? (
                  <Image
                    src={data.paymentInstructions.qrPath}
                    alt={`Google Pay / UPI QR code for ${data.paymentInstructions.upiId}`}
                    className="payment-qr"
                    width={270}
                    height={270}
                    unoptimized
                    onError={() => setQrMissing(true)}
                  />
                ) : (
                  <div className="payment-qr-fallback">QR temporarily unavailable.<br />Use the UPI ID below.</div>
                )}
              </div>
              <div>
                <span>STEP 1: SCAN WITH GOOGLE PAY OR ANY UPI APP</span>
                <h2>{amount}</h2>
                <p>Google Pay / UPI ID</p>
                <code>{data.paymentInstructions.upiId}</code>
                <button type="button" className="payment-secondary" onClick={openUpiApp}>
                  Pay via Google Pay / UPI
                </button>
                <small>
                  Transfer exactly {amount} to <b>{data.paymentInstructions.upiId}</b>. Note down the 12-digit UPI Transaction ID / UTR and take a screenshot of the successful payment.
                </small>
              </div>
            </section>

            {canSubmit && (
              <form className="payment-form" onSubmit={submit}>
                <h2>{payment?.status === "payment_failed" ? "STEP 2: Submit replacement payment receipt" : "STEP 2: Submit payment receipt for verification"}</h2>
                <p className="payment-form-desc">
                  Enter the transaction ID / UTR from Google Pay and upload an unedited screenshot of the payment receipt.
                </p>
                <label>
                  UPI Transaction ID / UTR
                  <input
                    required
                    value={utr}
                    onChange={(event) => setUtr(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                    minLength={6}
                    maxLength={64}
                    pattern="[A-Za-z0-9-]{6,64}"
                    placeholder="Enter 12-digit UTR or Google Pay Transaction ID"
                  />
                </label>
                <label>
                  Payment Screenshot / Receipt <small>PNG, JPEG, or WebP · up to 5 MB</small>
                  <input
                    required
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={selectScreenshot}
                  />
                </label>

                {screenshotInfo && screenshotPreview && (
                  <div className="payment-preview-box">
                    <div className="payment-preview-details">
                      <span className="payment-preview-name">📄 {screenshotInfo.name}</span>
                      <span className="payment-preview-size">({screenshotInfo.sizeKb} KB)</span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={screenshotPreview} alt="Receipt preview" className="payment-preview-thumb" />
                  </div>
                )}

                <button disabled={submitting}>
                  {submitting ? "Submitting receipt for verification…" : "Submit Payment Receipt for Verification"}
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  );
}
