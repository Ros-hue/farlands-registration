"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { minecraftFont } from "../fonts";
import "./register.css";

type MemberDraft = { name: string; email: string; phone: string };
type Registration = { id: string; registration_number: string };
type CreatedRegistration = { registration: Registration; team: { id: string; name: string } };

const blankMember = (): MemberDraft => ({ name: "", email: "", phone: "" });

function responseMessage(payload: unknown, fallback: string) {
  return typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : fallback;
}

export default function RegisterPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [leader, setLeader] = useState<MemberDraft>(blankMember());
  const [members, setMembers] = useState<MemberDraft[]>([blankMember()]);
  const [status, setStatus] = useState<"form" | "submitting" | "done">("form");
  const [message, setMessage] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedRegistration | null>(null);

  const changeMember = (index: number, field: keyof MemberDraft, value: string) =>
    setMembers((current) => current.map((m, i) => (i === index ? { ...m, [field]: value } : m)));

  const memberCount = members.length + 1;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setStatus("submitting");
    try {
      const response = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          leader: { name: leader.name, email: leader.email, phone: leader.phone || undefined },
          members: members.map((m) => ({ name: m.name, email: m.email, phone: m.phone || undefined })),
        }),
        cache: "no-store",
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseMessage(payload, "Could not create your registration."));
      const registration = payload as CreatedRegistration;
      setCreated(registration);
      setStatus("done");
    } catch (error) {
      setStatus("form");
      setMessage(error instanceof Error ? error.message : "Could not create your registration.");
    }
  }

  if (status === "done") {
    return (
      <main className="register-page">
        <section className="register-card register-success">
          <span className={`register-kicker ${minecraftFont.className}`}>REGISTRATION COMPLETE</span>
          <h1 className={minecraftFont.className}>You&apos;re in.</h1>
          <p>Your team has been registered for Farlands Hackathon 2026.</p>
          <p className={`register-number ${minecraftFont.className}`}>{created?.registration.registration_number}</p>
          <Link href="/" className={`register-home-link ${minecraftFont.className}`}>Back to home</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="register-page">
      <section className="register-card">
        <div className="register-heading">
          <div className="register-heading-inner">
            <div>
              <span className={`register-kicker ${minecraftFont.className}`}>CRAFTING STATION // REGISTRATION</span>
              <h1 className={minecraftFont.className}>Assemble Your Squad</h1>
              <p>Register a team of 1 to 4 hackers. Fill in your details below.</p>
            </div>
            <button type="button" className={`register-back ${minecraftFont.className}`} onClick={() => router.push("/")}>Back</button>
          </div>
        </div>
        <div className="register-form">
          {message && <p className="register-message" role="alert">{message}</p>}
          <form onSubmit={submit}>
            <label>
              <span className={minecraftFont.className}>TEAM NAME</span>
              <input required minLength={3} maxLength={50} value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. Redstone Builders" />
            </label>

            <MemberFields title="TEAM LEADER" member={leader} onChange={(field, value) => setLeader((c) => ({ ...c, [field]: value }))} />

            {members.map((member, index) => (
              <div className="register-member" key={index}>
                <MemberFields title={`TEAMMATE ${index + 2}`} member={member} onChange={(field, value) => changeMember(index, field, value)} />
                {members.length > 1 && (
                  <button type="button" className={`register-remove ${minecraftFont.className}`} onClick={() => setMembers((c) => c.filter((_, i) => i !== index))}>Remove</button>
                )}
              </div>
            ))}

            <div className="register-actions">
              {memberCount < 4 && (
                <button type="button" className={`register-secondary ${minecraftFont.className}`} onClick={() => setMembers((c) => [...c, blankMember()])}>+ Add Teammate</button>
              )}
              <span className={minecraftFont.className}>{memberCount} of 4 Teammates</span>
            </div>

            <button className={`register-submit ${minecraftFont.className}`} disabled={status === "submitting"}>
              {status === "submitting" ? "CRAFTING REGISTRATION..." : "REGISTER TEAM NOW"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function MemberFields({ title, member, onChange }: { title: string; member: MemberDraft; onChange: (field: keyof MemberDraft, value: string) => void }) {
  return (
    <fieldset className="register-fields">
      <legend className={minecraftFont.className}>{title}</legend>
      <div className="register-grid">
        <label>
          <span>Full name</span>
          <input required minLength={2} maxLength={100} autoComplete="name" value={member.name} onChange={(e) => onChange("name", e.target.value)} placeholder="Steve / Alex" />
        </label>
        <label>
          <span>Email</span>
          <input required type="email" autoComplete="email" value={member.email} onChange={(e) => onChange("email", e.target.value)} placeholder="hacker@minecraft.org" />
        </label>
        <label>
          <span>Phone <small>(optional)</small></span>
          <input type="tel" inputMode="tel" pattern="\\+?[0-9]{10,15}" value={member.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="+919876543210" />
        </label>
      </div>
    </fieldset>
  );
}
